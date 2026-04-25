"""
api/routes/export.py — LLM-ready JSON export endpoint.
Structured payload optimized for LLM consumption with full attribution.
"""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from api.middleware.injection import check_prompt_injection
from processing.cache import make_bundle_key, cache_get, cache_set

router = APIRouter(tags=["export"])

BUNDLE_CACHE_TTL = 3_600  # 1h — shorter than search (data changes)


class ExportRequest(BaseModel):
    query:        str          = Field(..., min_length=2, max_length=500)
    source_ids:   list[str]   = Field(default_factory=list)
    max_articles: int          = Field(default=10, ge=1, le=25)
    include_bps:  bool         = Field(default=True)
    include_market: bool       = Field(default=True)


@router.post("/export")
async def export_for_llm(req: ExportRequest):
    clean_query = req.query.strip()
    if not check_prompt_injection(clean_query):
        raise HTTPException(status_code=400, detail="Invalid query content")

    cache_key = make_bundle_key(clean_query, {
        "source_ids":   sorted(req.source_ids),
        "include_bps":  req.include_bps,
        "include_market": req.include_market,
    })
    cached = await cache_get(cache_key)
    if cached:
        return cached["data"]

    # Build from search
    from api.routes.search import semantic_search, SearchRequest
    search_req = SearchRequest(
        query=clean_query,
        limit=req.max_articles,
        source_types=req.source_ids or None,
    )
    bundle = await semantic_search(search_req)

    # Format as LLM-optimized payload
    news = bundle.get("context_bundle", {}).get("news", [])[:req.max_articles]
    payload = {
        "export_version": "1.0",
        "query":          clean_query,
        "generated_at":   datetime.now(timezone.utc).isoformat(),

        "news_articles": [
            {
                "title":          a.get("title"),
                "source":         a.get("source_id"),
                "published":      a.get("published_at") or a.get("published"),
                "url":            a.get("link"),
                "summary":        (a.get("body") or a.get("summary") or "")[:800],
                "topics":         a.get("topics", []),
                "entities":       [e["name"] for e in a.get("entities", [])[:5]],
                "relevance_score": a.get("relevance_score"),
            }
            for a in news
        ],

        "bps_context": bundle.get("context_bundle", {}).get("stats", []) if req.include_bps else [],

        "market_context": bundle.get("context_bundle", {}).get("market_signals", {}) if req.include_market else {},

        "entity_graph": bundle.get("context_bundle", {}).get("entity_graph", {}),

        "attribution": {
            "sources":    bundle.get("metadata", {}).get("sources", []),
            "disclaimer": "Data sourced from public APIs and approved RSS feeds. Not financial/legal advice.",
        },

        "metadata": bundle.get("metadata", {}),
    }

    await cache_set(cache_key, payload, ttl=BUNDLE_CACHE_TTL)
    return payload


@router.get("/export")
async def export_get(q: str, max_articles: int = 10, include_bps: bool = True, include_market: bool = True):
    """GET convenience wrapper for /export."""
    req = ExportRequest(query=q, max_articles=max_articles, include_bps=include_bps, include_market=include_market)
    return await export_for_llm(req)
