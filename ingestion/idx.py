"""
ingestion/idx.py — IDX (Bursa Efek Indonesia) public market data.
Uses IDX public endpoints (same as idx.co.id website, no auth required).
Fetches: composite index, top movers, market summary.
"""

from __future__ import annotations

import logging

from processing.cache import KEY_IDX, cache_set, safe_request_async

logger = logging.getLogger(__name__)

IDX_TTL = 300  # 5min — live market data

_IDX_BASE  = "https://www.idx.co.id/primary"
_IDX_SNAP  = "https://www.idx.co.id/primary/StockData"
_IDX_TRADE = "https://www.idx.co.id/primary/TradingSummary"

_HEADERS = {
    "Referer":    "https://www.idx.co.id/",
    "Accept":     "application/json",
    "User-Agent": "N2NDBot/1.0 (n2nd.ai)",
}


async def fetch_composite_index() -> dict:
    """IHSG (Indeks Harga Saham Gabungan) real-time snapshot."""
    try:
        data = await safe_request_async(
            f"{_IDX_SNAP}/GetIndexData",
            params={"length": "1", "start": "0", "indexId": "COMPOSITE"},
            headers=_HEADERS,
            timeout=10.0,
        )
        items = data.get("data", [])
        if items:
            item = items[0]
            return {
                "index_id":   item.get("IndexCode", "COMPOSITE"),
                "close":      _to_float(item.get("Close")),
                "change":     _to_float(item.get("Change")),
                "change_pct": _to_float(item.get("ChangePercent")),
                "open":       _to_float(item.get("Open")),
                "high":       _to_float(item.get("High")),
                "low":        _to_float(item.get("Low")),
                "volume":     item.get("Volume"),
                "date":       item.get("Date"),
            }
    except Exception as exc:
        logger.warning("IDX composite index failed: %s", exc)
    return {}


async def fetch_market_summary() -> dict:
    """Total market: volume, value, frequency, market cap."""
    try:
        data = await safe_request_async(
            f"{_IDX_TRADE}/GetMarketSummary",
            headers=_HEADERS,
            timeout=10.0,
        )
        s = data.get("data", {})
        return {
            "total_volume":    s.get("TotalVolume"),
            "total_value":     s.get("TotalValue"),
            "total_frequency": s.get("TotalFrequency"),
            "market_cap":      s.get("MarketCap"),
            "date":            s.get("Date"),
        }
    except Exception as exc:
        logger.warning("IDX market summary failed: %s", exc)
    return {}


async def fetch_top_movers(n: int = 5) -> dict:
    """Top gainers and losers by % change."""
    try:
        data = await safe_request_async(
            f"{_IDX_TRADE}/GetStockSummary",
            params={"start": "0", "length": str(n * 4), "exchange": "idx_all", "language": "id"},
            headers=_HEADERS,
            timeout=10.0,
        )
        stocks = data.get("data", [])

        def parse(s: dict) -> dict:
            return {
                "code":       s.get("StockCode"),
                "name":       s.get("StockName"),
                "close":      _to_float(s.get("Close")),
                "change_pct": _to_float(s.get("ChangePercent")),
                "volume":     s.get("Volume"),
            }

        sorted_stocks = sorted(
            [parse(s) for s in stocks if s.get("ChangePercent") is not None],
            key=lambda x: x["change_pct"] or 0,
            reverse=True,
        )
        return {
            "top_gainers": sorted_stocks[:n],
            "top_losers":  list(reversed(sorted_stocks[-n:])),
        }
    except Exception as exc:
        logger.warning("IDX top movers failed: %s", exc)
    return {"top_gainers": [], "top_losers": []}


def _to_float(val) -> float | None:
    try:
        return float(val)
    except (TypeError, ValueError):
        return None


async def fetch_idx_data() -> dict:
    """Fetch + cache all IDX market data."""
    import asyncio
    composite, summary, movers = await asyncio.gather(
        fetch_composite_index(),
        fetch_market_summary(),
        fetch_top_movers(),
        return_exceptions=True,
    )

    result = {
        "composite":      composite if isinstance(composite, dict) else {},
        "market_summary": summary   if isinstance(summary, dict)   else {},
        "top_movers":     movers    if isinstance(movers, dict)     else {},
        "source":         "idx",
    }
    await cache_set(KEY_IDX, result, IDX_TTL)
    logger.info("IDX data cached (TTL %ds)", IDX_TTL)
    return result
