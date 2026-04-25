"""
ingestion/gdelt.py — GDELT Project API client.
Free, no auth required. Provides global news + named entity extraction.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Optional

from processing.cache import KEY_GDELT, cache_set, safe_request_async

logger = logging.getLogger(__name__)

GDELT_DOC_API = "https://api.gdeltproject.org/api/v2/doc/doc"
GDELT_GKG_API = "https://api.gdeltproject.org/api/v2/gkg/gkg"


def _normalize_sentiment(tone: Optional[float]) -> Optional[float]:
    """GDELT tone is -100..+100. Normalize to -1..1."""
    if tone is None:
        return None
    return max(-1.0, min(1.0, tone / 100.0))


def _normalize_gdelt_article(raw: dict) -> dict:
    return {
        "title":       raw.get("title", ""),
        "link":        raw.get("url", ""),
        "summary":     "",
        "published":   raw.get("seendate", datetime.now(timezone.utc).isoformat()),
        "source":      raw.get("domain", "GDELT"),
        "source_id":   "gdelt",
        "source_type": "gdelt",
        "lang":        raw.get("language", "en"),
        "country":     raw.get("sourcecountry", ""),
        "themes":      raw.get("themes", "").split(";") if raw.get("themes") else [],
        "sentiment":   _normalize_sentiment(raw.get("tone")),
    }


async def fetch_gdelt_indonesia(
    query: str = "Indonesia",
    mode: str = "ArtList",
    max_records: int = 25,
    timespan: str = "1h",
) -> list[dict]:
    params = {
        "query":      query,
        "mode":       mode,
        "maxrecords": max_records,
        "timespan":   timespan,
        "format":     "json",
        "sort":       "DateDesc",
    }
    try:
        data     = await safe_request_async(GDELT_DOC_API, params=params, timeout=15.0)
        articles = data.get("articles", [])
        return [_normalize_gdelt_article(a) for a in articles]
    except Exception as exc:
        logger.warning("fetch_gdelt_indonesia(%s): %s", query, exc)
        return []


async def fetch_gdelt_entities(
    query: str = "Indonesia",
    timespan: str = "24h",
) -> list[dict]:
    params = {
        "query":    query,
        "mode":     "EntityCountry",
        "timespan": timespan,
        "format":   "json",
    }
    try:
        data     = await safe_request_async(GDELT_GKG_API, params=params, timeout=15.0)
        entities = data.get("entities", [])
        return [
            {
                "name":      e.get("name", ""),
                "type":      e.get("type", "UNKNOWN"),
                "count":     int(e.get("count", 0)),
                "sentiment": _normalize_sentiment(e.get("tone")),
            }
            for e in entities
        ]
    except Exception as exc:
        logger.warning("fetch_gdelt_entities(%s): %s", query, exc)
        return []


async def fetch_all_gdelt() -> dict:
    import asyncio
    articles, entities = await asyncio.gather(
        fetch_gdelt_indonesia(),
        fetch_gdelt_entities(),
        return_exceptions=True,
    )
    data = {
        "articles":   articles  if not isinstance(articles, Exception)  else [],
        "entities":   entities  if not isinstance(entities, Exception)  else [],
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }
    await cache_set(KEY_GDELT, data, ttl=3600)
    return data
