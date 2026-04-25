"""
api/routes/feed.py — News feed + market data endpoints.
Patterns ported from surveilencemaxxing Flask routes.
"""

from __future__ import annotations

import asyncio

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


_CC_FEED   = "public, max-age=300"   # 5min — matches RSS ingest interval
_CC_MARKET = "public, max-age=60"    # 1min — market data changes frequently
_CC_INTEL  = "public, max-age=600"   # 10min — bmkg/gdelt


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
