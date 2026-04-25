"""
processing/scoring.py — Multi-signal relevance scoring and context bundle assembly.
Core differentiator: cross-source entity fusion + weighted relevance formula.
"""

from __future__ import annotations

import asyncio
import logging
import math
from datetime import datetime, timezone
from typing import Optional

logger = logging.getLogger(__name__)

# ─── Relevance formula weights ───────────────────────────────────────────────
# score = 0.4*semantic + 0.3*recency + 0.2*authority + 0.1*tension

SEMANTIC_WEIGHT  = 0.40
RECENCY_WEIGHT   = 0.30
AUTHORITY_WEIGHT = 0.20
TENSION_WEIGHT   = 0.10

# Source authority overrides (source_type → score)
_TYPE_AUTHORITY: dict[str, float] = {
    "bps":        1.0,
    "bmkg":       1.0,
    "rss_id":     None,  # use tier-based score
    "rss_global": None,
    "gdelt":      0.6,
    "gdelt_event": 0.6,
}

_TENSION_BOOST_TOPICS = {"geopolitik", "bencana", "ekonomi"}


# ─── Score components ─────────────────────────────────────────────────────────

def semantic_score(cosine_similarity: float) -> float:
    return max(0.0, min(1.0, cosine_similarity))


def recency_decay(published_at: str, content_type: str = "article", half_life_hours: float = 24.0) -> float:
    if content_type in ("bps_stat",):
        return 0.9  # static data always relevant

    try:
        dt = datetime.fromisoformat(published_at)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        age_hours = (datetime.now(timezone.utc) - dt).total_seconds() / 3600
        decay = math.exp(-math.log(2) / half_life_hours * age_hours)
        return max(0.01, round(decay, 4))
    except Exception:
        return 0.5


def authority_score_from_source(source_id: str, source_type: str, stored_score: float = 0.7) -> float:
    type_override = _TYPE_AUTHORITY.get(source_type)
    if type_override is not None:
        return type_override
    return stored_score  # from sources table / ingestion/rss.py AUTHORITY_SCORES


def tension_score_component(tension_score: float, topics: list[str]) -> float:
    base = max(0.0, min(1.0, tension_score / 100.0))
    if set(topics) & _TENSION_BOOST_TOPICS:
        base = min(base * 1.3, 1.0)
    return round(base, 4)


def compute_relevance_score(
    semantic_sim: float,
    published_at: str,
    source_id: str,
    source_type: str,
    tension_score: float,
    topics: list[str],
    authority_stored: float = 0.7,
    content_type: str = "article",
) -> float:
    s = (
        SEMANTIC_WEIGHT  * semantic_score(semantic_sim)
        + RECENCY_WEIGHT   * recency_decay(published_at, content_type)
        + AUTHORITY_WEIGHT * authority_score_from_source(source_id, source_type, authority_stored)
        + TENSION_WEIGHT   * tension_score_component(tension_score, topics)
    )
    return round(min(1.0, s), 4)


def rank_documents(documents: list[dict], query_vector: list[float] = None) -> list[dict]:
    """Attach relevance_score to each document, sort DESC."""
    for doc in documents:
        semantic_sim = doc.get("similarity", 0.5) if query_vector else 0.5
        doc["relevance_score"] = compute_relevance_score(
            semantic_sim     = semantic_sim,
            published_at     = doc.get("published_at") or doc.get("published", ""),
            source_id        = doc.get("source_id", ""),
            source_type      = doc.get("source_type", ""),
            tension_score    = doc.get("tension_score", 0),
            topics           = doc.get("topics", []),
            authority_stored = doc.get("authority_score", 0.7),
            content_type     = doc.get("content_type", "article"),
        )
    documents.sort(key=lambda d: d["relevance_score"], reverse=True)
    return documents


# ─── Entity graph ─────────────────────────────────────────────────────────────

def build_entity_graph(documents: list[dict]) -> dict:
    """
    Cross-source entity fusion — the moat.
    Entities appearing in 3+ sources get 2x prominence boost.
    """
    registry: dict[str, dict] = {}

    for doc in documents:
        source_id = doc.get("source_id", "unknown")
        for ent in doc.get("entities", []):
            name_key = ent.get("name", "").lower().strip()
            if not name_key or len(name_key) < 2:
                continue
            if name_key not in registry:
                registry[name_key] = {
                    "name":          ent["name"],
                    "type":          ent.get("type", "UNKNOWN"),
                    "mentions":      0,
                    "cross_sources": set(),
                    "prominence_score": 0,
                }
            registry[name_key]["mentions"]      += ent.get("count", 1)
            registry[name_key]["cross_sources"].add(source_id)

    result = []
    for data in registry.values():
        source_count     = len(data["cross_sources"])
        diversity_factor = 2.0 if source_count >= 3 else 1.0
        prominence       = data["mentions"] * source_count * diversity_factor
        result.append({
            "name":             data["name"],
            "type":             data["type"],
            "mentions":         data["mentions"],
            "cross_sources":    list(data["cross_sources"]),
            "source_count":     source_count,
            "prominence_score": round(prominence, 2),
        })

    result.sort(key=lambda e: e["prominence_score"], reverse=True)
    return {"entities": result[:30]}


# ─── BPS stat relevance ───────────────────────────────────────────────────────

def _find_relevant_bps(query: str, bps_national: dict) -> list[dict]:
    """Select BPS indicators mentioned or related to query."""
    query_lower = query.lower()
    relevant = []
    for key, stat in bps_national.items():
        indicator = stat.get("indicator", "").lower()
        category  = stat.get("category", "").lower()
        if any(term in query_lower for term in indicator.split() + category.split()):
            relevant.append(stat)
    return relevant[:5]


# ─── Context bundle assembly ──────────────────────────────────────────────────

async def assemble_context_bundle(
    query: str,
    query_vector: Optional[list[float]],
    news_docs: list[dict],
    bps_national: dict,
    market_signals: dict,
    tension: dict,
    cache_hit: bool = False,
) -> dict:
    ranked_news   = rank_documents(news_docs, query_vector)[:10]
    entity_graph  = build_entity_graph(news_docs)
    relevant_bps  = _find_relevant_bps(query, bps_national)

    sources_used = list({d.get("source_id", "") for d in ranked_news})

    def _strip_large(doc: dict) -> dict:
        return {k: v for k, v in doc.items() if k != "embedding"}

    return {
        "query": query,
        "context_bundle": {
            "news": [_strip_large(d) for d in ranked_news],
            "stats": relevant_bps,
            "market_signals": {
                "ihsg":       market_signals.get("indonesia", {}).get("ihsg"),
                "usd_idr":    market_signals.get("indonesia", {}).get("usd_idr"),
                "bi_rate":    market_signals.get("indonesia", {}).get("bi_rate"),
                "fear_greed": market_signals.get("fear_greed"),
                "tension":    tension,
            },
            "entity_graph": entity_graph,
            "tension": tension,
        },
        "metadata": {
            "sources":      sources_used,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "cache_hit":    cache_hit,
            "confidence":   round(
                sum(d.get("relevance_score", 0) for d in ranked_news) / max(len(ranked_news), 1),
                3,
            ),
            "result_count": len(ranked_news),
        },
    }
