"""
api/routes/feed.py — News feed + market data endpoints.
Patterns ported from surveilencemaxxing Flask routes.
"""

from __future__ import annotations

import asyncio
import logging
import time
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse

from processing.cache import (
    KEY_BMKG,
    KEY_CRYPTO,
    KEY_GDELT,
    KEY_IDX,
    KEY_INDICATORS,
    KEY_NEWS_FEED,
    KEY_NEWS_HEADLINES,
    KEY_NEWS_SOURCE,
    KEY_OJK,
    KEY_TENSION,
    cache_get,
)

router = APIRouter(tags=["feed"])
logger = logging.getLogger(__name__)


_CC_FEED   = "public, max-age=300"   # 5min — matches RSS ingest interval
_CC_MARKET = "public, max-age=60"    # 1min — market data changes frequently
_CC_INTEL  = "public, max-age=600"   # 10min — bmkg/gdelt


async def _run_30d_backfill() -> dict:
    from ingestion.bps import refresh_bps_weekly
    from ingestion.bmkg import fetch_bmkg_data
    from ingestion.gdelt import fetch_gdelt_indonesia
    from ingestion.market import fetch_all_market_signals
    from ingestion.rss import fetch_all_rss, update_news_cache
    from processing.dedup import run_full_dedup
    from processing.nlp import process_articles_batch
    from processing.summarize import summarize_batch
    from ingestion.scheduler import _try_embed_and_store
    from processing.cache import cache_set, KEY_GDELT

    t0 = time.monotonic()
    rss_raw = await fetch_all_rss()
    gdelt_raw = await fetch_gdelt_indonesia(
        query="Indonesia economy OR Indonesia politics OR Indonesia technology",
        timespan="30d",
        max_records=250,
    )

    merged = []
    merged.extend(rss_raw)
    merged.extend(gdelt_raw)

    deduped = run_full_dedup(merged)
    processed = await process_articles_batch(deduped)
    processed = await summarize_batch(processed)
    await update_news_cache(processed)
    await _try_embed_and_store(processed, source="load_30d")

    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    recent_30d = [
        article for article in processed
        if datetime.fromisoformat((article.get("published") or datetime.now(timezone.utc).isoformat()).replace("Z", "+00:00")) >= thirty_days_ago
    ]

    await cache_set(
        KEY_GDELT,
        {
            "articles": gdelt_raw,
            "entities": [],
            "fetched_at": datetime.now(timezone.utc).isoformat(),
            "timespan": "30d",
        },
        ttl=3600,
    )

    market_data, bmkg_data, _ = await asyncio.gather(
        fetch_all_market_signals(),
        fetch_bmkg_data(),
        refresh_bps_weekly(),
    )

    return {
        "ingested_total": len(processed),
        "last_30_days": len(recent_30d),
        "gdelt_articles": len(gdelt_raw),
        "rss_articles": len(rss_raw),
        "market_keys": len(market_data.keys()) if isinstance(market_data, dict) else 0,
        "bmkg_recent": len((bmkg_data or {}).get("recent_earthquakes", [])) if isinstance(bmkg_data, dict) else 0,
        "elapsed_ms": int((time.monotonic() - t0) * 1000),
    }


async def _fetch_world_bank_snapshot() -> dict:
    from processing.cache import safe_request_async

    indicators = {
        "gdp_growth": "NY.GDP.MKTP.KD.ZG",
        "inflation": "FP.CPI.TOTL.ZG",
        "unemployment": "SL.UEM.TOTL.ZS",
    }
    out: dict[str, float | None] = {}

    for key, indicator in indicators.items():
        try:
            url = f"https://api.worldbank.org/v2/country/IDN/indicator/{indicator}"
            payload = await safe_request_async(url, params={"format": "json", "per_page": 8}, timeout=10.0)
            series = payload[1] if isinstance(payload, list) and len(payload) > 1 else []
            latest = next((item.get("value") for item in series if item.get("value") is not None), None)
            out[key] = latest
        except Exception:
            out[key] = None
    return out


async def _fetch_imf_snapshot() -> dict:
    from processing.cache import safe_request_async

    try:
        payload = await safe_request_async(
            "https://www.imf.org/external/datamapper/api/v1/NGDP_RPCH?countries=ID",
            timeout=10.0,
        )
        values = (((payload or {}).get("values") or {}).get("NGDP_RPCH") or {}).get("ID", {})
        if isinstance(values, dict) and values:
            latest_year = sorted(values.keys())[-1]
            return {"real_gdp_growth_latest": values.get(latest_year), "year": latest_year}
    except Exception:
        pass
    return {"real_gdp_growth_latest": None, "year": None}


@router.get("/feed")
async def get_feed(
    source: str = Query(default=None, description="Filter by source_id"),
    limit:  int = Query(default=20, ge=1, le=50),
):
    if source:
        cached = await cache_get(KEY_NEWS_SOURCE.format(source_id=source))
    else:
        cached = await cache_get(KEY_NEWS_FEED)

    articles = cached["data"][:limit] if cached else []
    return JSONResponse(
        content={"articles": articles, "count": len(articles), "updated_at": cached.get("updated_at") if cached else None},
        headers={"Cache-Control": _CC_FEED},
    )


@router.get("/feed/headlines")
async def get_headlines(limit: int = Query(default=10, ge=1, le=20)):
    cached = await cache_get(KEY_NEWS_HEADLINES)
    return JSONResponse(
        content={"headlines": (cached["data"] or [])[:limit] if cached else [], "updated_at": cached.get("updated_at") if cached else None},
        headers={"Cache-Control": _CC_FEED},
    )


@router.post("/feed/load-30d")
async def load_30d():
    try:
        summary = await asyncio.wait_for(_run_30d_backfill(), timeout=300)
        return {
            "status": "ok",
            "max_wait_seconds": 300,
            "summary": summary,
        }
    except asyncio.TimeoutError:
        return JSONResponse(
            status_code=504,
            content={
                "status": "timeout",
                "detail": "Load data melebihi batas 5 menit",
            },
        )
    except Exception as exc:
        logger.error("load_30d failed: %s", exc, exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "detail": "Gagal memuat data 30 hari",
            },
        )


@router.get("/market")
async def get_market():
    indicators, crypto, tension = await asyncio.gather(
        cache_get(KEY_INDICATORS),
        cache_get(KEY_CRYPTO),
        cache_get(KEY_TENSION),
    )
    return JSONResponse(
        content={
            "indicators": indicators["data"] if indicators else {},
            "crypto":     crypto["data"]     if crypto     else {},
            "tension":    tension["data"]    if tension    else {},
        },
        headers={"Cache-Control": _CC_MARKET},
    )


@router.get("/market/crypto")
async def get_crypto():
    cached = await cache_get(KEY_CRYPTO)
    return JSONResponse(
        content=cached["data"] if cached else {},
        headers={"Cache-Control": _CC_MARKET},
    )


@router.get("/market/forex")
async def get_forex():
    from ingestion.market import get_all_pairs
    return await get_all_pairs()


@router.get("/market/forex/history")
async def get_forex_history(
    pair: str = Query(default="USD_IDR"),
    days: int = Query(default=7, ge=1, le=365),
):
    from ingestion.market import fetch_historical_forex
    return {"pair": pair, "days": days, "history": await fetch_historical_forex(pair, days)}


@router.get("/intel/bmkg")
async def get_bmkg():
    cached = await cache_get(KEY_BMKG)
    return JSONResponse(
        content=cached["data"] if cached else {},
        headers={"Cache-Control": _CC_INTEL},
    )


@router.get("/intel/gdelt")
async def get_gdelt():
    cached = await cache_get(KEY_GDELT)
    return JSONResponse(
        content=cached["data"] if cached else {},
        headers={"Cache-Control": _CC_INTEL},
    )


@router.get("/intel/trends")
async def get_trends():
    from ingestion.gdelt import fetch_gdelt_entities

    categories = {
        "economy": ["inflation", "bi rate", "rupiah", "stock market", "ihsg"],
        "psychology": ["mental health", "burnout", "focus", "dopamine", "habit"],
        "technology": ["ai agent", "gpt", "gemini", "cybersecurity", "automation"],
        "education": ["scholarship", "kuliah", "program studi", "research", "thesis"],
        "business": ["startup", "umkm", "marketing", "consumer trend", "pricing"],
        "politics": ["election", "policy", "parliament", "regulation", "geopolitics"],
        "global_8_major_economy": ["united states", "china", "japan", "germany", "india", "uk", "france", "italy"],
    }
    gdelt_entities = await fetch_gdelt_entities(query="Indonesia OR economy OR technology", timespan="7d")
    gdelt_titles = [entity.get("name", "") for entity in gdelt_entities if entity.get("name")]

    data = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "categories": {
            key: {
                "keywords": keywords,
                "live_signals": gdelt_titles[:10],
            }
            for key, keywords in categories.items()
        },
    }
    return JSONResponse(content=data, headers={"Cache-Control": "public, max-age=900"})


@router.get("/intel/macro-snapshot")
async def get_macro_snapshot():
    bps_cached, ojk_cached, idx_cached, indicators_cached, wb, imf = await asyncio.gather(
        cache_get("n2nd:bps:national"),
        cache_get(KEY_OJK),
        cache_get(KEY_IDX),
        cache_get(KEY_INDICATORS),
        _fetch_world_bank_snapshot(),
        _fetch_imf_snapshot(),
    )
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "bps": bps_cached["data"] if bps_cached else {},
        "ojk": ojk_cached["data"] if ojk_cached else {},
        "idx": idx_cached["data"] if idx_cached else {},
        "bank_indonesia_proxy": indicators_cached["data"] if indicators_cached else {},
        "world_bank": wb,
        "imf": imf,
    }


@router.get("/intel/free-sources")
async def get_free_sources():
    return {
        "sources": [
            {"name": "GDELT Project", "type": "news/events", "access": "free public API", "fit": "global event + media intelligence"},
            {"name": "BPS Open Data", "type": "official statistics", "access": "free public API", "fit": "macro economy + demography Indonesia"},
            {"name": "BMKG DataMKG", "type": "geospatial/disaster", "access": "free public API", "fit": "disaster and climate signal"},
            {"name": "Bank Indonesia Data", "type": "monetary indicators", "access": "free public endpoint", "fit": "rate and macro benchmark"},
            {"name": "Frankfurter / ER-API", "type": "forex", "access": "free API", "fit": "currency context and volatility"},
            {"name": "CoinGecko", "type": "crypto market", "access": "free API tier", "fit": "risk-on/risk-off proxy"},
            {"name": "Google Trends (pytrends)", "type": "trend interest", "access": "unofficial/free", "fit": "topic virality across categories"},
            {"name": "Wikipedia Pageviews", "type": "attention proxy", "access": "free API", "fit": "education/psychology/economy trend discovery"},
        ],
        "google_trends_note": "Gunakan pytrends dengan rate-limit konservatif dan fallback cache untuk hindari throttling.",
    }


@router.get("/intel/ojk")
async def get_ojk():
    cached = await cache_get(KEY_OJK)
    if not cached:
        from ingestion.ojk import fetch_ojk_stats
        data = await fetch_ojk_stats()
        return JSONResponse(content=data, headers={"Cache-Control": "public, max-age=3600"})
    return JSONResponse(
        content=cached["data"],
        headers={"Cache-Control": "public, max-age=3600"},
    )


@router.get("/market/idx")
async def get_idx():
    cached = await cache_get(KEY_IDX)
    if not cached:
        from ingestion.idx import fetch_idx_data
        data = await fetch_idx_data()
        return JSONResponse(content=data, headers={"Cache-Control": _CC_MARKET})
    return JSONResponse(
        content=cached["data"],
        headers={"Cache-Control": _CC_MARKET},
    )
