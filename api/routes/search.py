"""
api/routes/search.py — Semantic search endpoint.
Cache-first: Redis L1 → pgvector L2. Returns full context bundle.
"""

from __future__ import annotations

import logging
import time
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from api.middleware.injection import check_prompt_injection
from processing.cache import (
    KEY_BPS_NATIONAL,
    KEY_INDICATORS,
    KEY_TENSION,
    cache_get,
    cache_set,
    make_search_key,
)

router = APIRouter(tags=["search"])

SEARCH_CACHE_TTL = 86_400  # 24h


class SearchRequest(BaseModel):
    query:          str   = Field(..., min_length=2, max_length=500)
    limit:          int   = Field(default=10, ge=1, le=20)
    min_similarity: float = Field(default=0.5, ge=0.0, le=1.0)
    source_types:   list[str] | None = None
    content_types:  list[str] | None = None
    published_after: str | None = None


@router.post("/search")
async def semantic_search(req: SearchRequest):
    t0 = time.monotonic()

    # Input validation + injection check
    clean_query = req.query.strip()
    if not check_prompt_injection(clean_query):
        raise HTTPException(status_code=400, detail="Invalid query content")

    # L1 cache check
    cache_key = make_search_key(clean_query, {
        "limit": req.limit,
        "source_types": sorted(req.source_types or []),
        "content_types": sorted(req.content_types or []),
        "published_after": req.published_after,
    })
    cached = await cache_get(cache_key)
    if cached:
        bundle = cached["data"]
        bundle["metadata"]["cache_hit"] = True
        bundle["metadata"]["latency_ms"] = int((time.monotonic() - t0) * 1000)
        return bundle

    # L2: embed + pgvector search
    from processing.embeddings import embed_query
    from processing.scoring import assemble_context_bundle
    from api.main import get_db_client

    query_vector = await embed_query(clean_query)

    db     = get_db_client()
    params = {
        "query_embedding": query_vector,
        "match_count":     req.limit * 2,
        "min_similarity":  req.min_similarity,
    }
    if req.content_types:
        params["content_types"] = req.content_types
    if req.source_types:
        params["source_types"] = req.source_types
    if req.published_after:
        params["published_after"] = req.published_after

    try:
        result    = db.rpc("search_documents", params).execute()
        news_docs = result.data or []
    except Exception as exc:
        logger.warning("pgvector search failed (returning empty): %s", exc)
        news_docs = []

    # Fetch context data from Redis
    bps_cached     = await cache_get(KEY_BPS_NATIONAL)
    market_cached  = await cache_get(KEY_INDICATORS)
    tension_cached = await cache_get(KEY_TENSION)

    bundle = await assemble_context_bundle(
        query          = clean_query,
        query_vector   = query_vector,
        news_docs      = news_docs,
        bps_national   = bps_cached["data"] if bps_cached else {},
        market_signals = market_cached["data"] if market_cached else {},
        tension        = tension_cached["data"] if tension_cached else {},
        cache_hit      = False,
    )

    latency_ms = int((time.monotonic() - t0) * 1000)
    bundle["metadata"]["latency_ms"] = latency_ms

    # Log search
    try:
        import hashlib
        qhash = hashlib.sha256(clean_query.lower().encode()).hexdigest()[:16]
        db.table("search_log").insert({
            "query":        clean_query,
            "query_hash":   qhash,
            "result_count": len(news_docs),
            "cache_hit":    False,
            "latency_ms":   latency_ms,
        }).execute()
    except Exception:
        pass

    # Store in Redis
    await cache_set(cache_key, bundle, ttl=SEARCH_CACHE_TTL)
    return bundle
