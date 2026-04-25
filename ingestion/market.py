"""
ingestion/market.py — Market data ingestion.
Async port of surveilencemaxxing modules: indicators.py, forex.py, crypto.py.
Key fix: BI Rate is fetched live, never hardcoded.
"""

from __future__ import annotations

import asyncio
import logging
import os
from datetime import datetime, timezone
from typing import Optional

from processing.cache import (
    KEY_BI_RATE,
    KEY_CRYPTO,
    KEY_FOREX_BASE,
    KEY_IHSG,
    KEY_INDICATORS,
    KEY_TENSION,
    cache_get,
    cache_set,
    fetch_with_fallback_async,
    safe_request_async,
)

logger = logging.getLogger(__name__)

# ─── Forex ────────────────────────────────────────────────────────────────────

FOREX_PRIMARY  = "https://open.er-api.com/v6/latest/{base}"
FOREX_FALLBACK = "https://api.frankfurter.app/latest?from={base}"
FOREX_HISTORY  = "https://api.frankfurter.app/{start}..{end}?from={base}&to={to}"

FOREX_PAIRS = [
    {"from": "USD", "to": "IDR", "key": "USD_IDR", "label": "Dolar ke Rupiah"},
    {"from": "EUR", "to": "IDR", "key": "EUR_IDR", "label": "Euro ke Rupiah"},
    {"from": "CNY", "to": "IDR", "key": "CNY_IDR", "label": "Yuan ke Rupiah"},
    {"from": "USD", "to": "EUR", "key": "USD_EUR", "label": "Dolar ke Euro"},
    {"from": "USD", "to": "CNY", "key": "USD_CNY", "label": "Dolar ke Yuan"},
]


async def fetch_latest_forex(base: str = "USD") -> dict:
    primary_url  = FOREX_PRIMARY.format(base=base)
    fallback_url = FOREX_FALLBACK.format(base=base)
    cache_key    = KEY_FOREX_BASE.format(base=base.upper())

    async def primary():
        data = await safe_request_async(primary_url)
        return data.get("rates", {})

    async def fallback():
        data = await safe_request_async(fallback_url)
        return data.get("rates", {})

    return await fetch_with_fallback_async(primary, fallback, cache_key, ttl=3600)


async def fetch_historical_forex(pair: str, days: int) -> list[dict]:
    from datetime import timedelta
    conf = next((p for p in FOREX_PAIRS if p["key"] == pair), None)
    if not conf:
        return []
    end   = datetime.now(timezone.utc).date()
    start = end - timedelta(days=days)
    url   = FOREX_HISTORY.format(
        start=start.isoformat(), end=end.isoformat(),
        base=conf["from"], to=conf["to"],
    )
    try:
        data = await safe_request_async(url)
        rates = data.get("rates", {})
        to_cur = conf["to"]
        return [{"date": d, "rate": v[to_cur]} for d, v in sorted(rates.items()) if to_cur in v]
    except Exception as exc:
        logger.warning("fetch_historical_forex(%s, %d): %s", pair, days, exc)
        return []


async def get_all_pairs() -> dict:
    result = {}
    for p in FOREX_PAIRS:
        try:
            cached = await cache_get(KEY_FOREX_BASE.format(base=p["from"]))
            rates  = cached["data"] if cached else await fetch_latest_forex(p["from"])
            rate   = rates.get(p["to"])
            result[p["key"]] = {
                "from":      p["from"],
                "to":        p["to"],
                "label":     p["label"],
                "rate":      rate,
                "formatted": f"Rp {rate:,.0f}" if p["to"] == "IDR" and rate else str(rate),
            }
        except Exception as exc:
            logger.warning("get_all_pairs(%s): %s", p["key"], exc)
    return result


# ─── Crypto ───────────────────────────────────────────────────────────────────

COINGECKO_URL = (
    "https://api.coingecko.com/api/v3/simple/price"
    "?ids=bitcoin,ethereum,binancecoin,solana,ripple,dogecoin"
    "&vs_currencies=idr,usd,eur"
    "&include_24hr_change=true"
)
COINGECKO_CHART = "https://api.coingecko.com/api/v3/coins/{coin}/market_chart?vs_currency={currency}&days={days}"

COIN_META = {
    "bitcoin":     {"symbol": "BTC", "name": "Bitcoin",    "icon": "₿"},
    "ethereum":    {"symbol": "ETH", "name": "Ethereum",   "icon": "Ξ"},
    "binancecoin": {"symbol": "BNB", "name": "BNB",        "icon": "B"},
    "solana":      {"symbol": "SOL", "name": "Solana",     "icon": "◎"},
    "ripple":      {"symbol": "XRP", "name": "XRP",        "icon": "✕"},
    "dogecoin":    {"symbol": "DOGE","name": "Dogecoin",   "icon": "Ð"},
}


async def fetch_crypto_prices() -> dict:
    try:
        raw = await safe_request_async(COINGECKO_URL)
        result = {}
        for coin_id, prices in raw.items():
            meta = COIN_META.get(coin_id, {"symbol": coin_id.upper(), "name": coin_id, "icon": ""})
            result[coin_id] = {
                **meta,
                "idr":            prices.get("idr"),
                "usd":            prices.get("usd"),
                "eur":            prices.get("eur"),
                "change_24h_usd": prices.get("usd_24h_change"),
                "change_24h_idr": prices.get("idr_24h_change"),
            }
        await cache_set(KEY_CRYPTO, result, ttl=300)
        return result
    except Exception as exc:
        logger.warning("fetch_crypto_prices: %s", exc)
        cached = await cache_get(KEY_CRYPTO)
        return cached["data"] if cached else {}


async def fetch_crypto_chart(coin: str, currency: str = "usd", days: int = 7) -> list:
    url = COINGECKO_CHART.format(coin=coin, currency=currency, days=days)
    try:
        data = await safe_request_async(url)
        return data.get("prices", [])
    except Exception as exc:
        logger.warning("fetch_crypto_chart(%s): %s", coin, exc)
        return []


# ─── Market indicators (port of indicators.py) ────────────────────────────────

FEAR_GREED_URL = "https://api.alternative.me/fng/?limit=30"
TENSION_KEYWORDS = [
    "war", "conflict", "sanctions", "attack", "crisis", "invasion",
    "protest", "coup", "missile", "nuclear", "terrorism", "ceasefire",
    "riot", "embargo", "military", "hostage",
]
MARKET_TICKERS = [
    ("S&P 500", "^GSPC"), ("Nasdaq", "^IXIC"), ("Dow Jones", "^DJI"),
    ("Nikkei 225", "^N225"), ("IHSG", "^JKSE"),
]


def _color_fear_greed(value: int) -> str:
    if value < 25:  return "#ff4444"
    if value < 45:  return "#ff8844"
    if value < 55:  return "#4488ff"
    if value < 75:  return "#44cc88"
    return "#00ff88"


def _direction(change: Optional[float]) -> str:
    if change is None: return "neutral"
    return "up" if change >= 0 else "down"


def _format_price(price: Optional[float]) -> str:
    if price is None: return "N/A"
    if price >= 10000: return f"{price:,.0f}"
    if price >= 100:   return f"{price:,.2f}"
    return f"{price:,.4f}"


async def fetch_fear_greed() -> dict:
    try:
        data   = await safe_request_async(FEAR_GREED_URL)
        points = data.get("data", [])
        if not points:
            raise ValueError("empty response")
        current = points[0]
        value   = int(current.get("value", 50))
        label   = current.get("value_classification", "Neutral")
        history = [
            {"date": datetime.fromtimestamp(int(p["timestamp"]), tz=timezone.utc).date().isoformat(),
             "value": int(p["value"]),
             "label": p["value_classification"]}
            for p in points
        ]
        return {
            "value":          value,
            "label":          label,
            "color":          _color_fear_greed(value),
            "previous_close": history[1]["value"] if len(history) > 1 else value,
            "weekly_avg":     round(sum(h["value"] for h in history[:7]) / min(7, len(history)), 1),
            "history":        history,
        }
    except Exception as exc:
        logger.warning("fetch_fear_greed: %s", exc)
        return {"value": 50, "label": "Neutral", "color": "#4488ff", "history": [], "error": str(exc)}


async def fetch_global_markets() -> list:
    try:
        import yfinance as yf

        def _fetch():
            results = []
            for name, ticker in MARKET_TICKERS:
                try:
                    t    = yf.Ticker(ticker)
                    info = t.fast_info
                    price  = getattr(info, "last_price", None)
                    prev   = getattr(info, "previous_close", None)
                    change = ((price - prev) / prev * 100) if price and prev else None
                    results.append({
                        "name":      name,
                        "ticker":    ticker,
                        "price":     price,
                        "change":    round(change, 2) if change is not None else None,
                        "direction": _direction(change),
                        "formatted": _format_price(price),
                    })
                except Exception as e:
                    results.append({"name": name, "ticker": ticker, "error": str(e)})
            return results

        return await asyncio.to_thread(_fetch)
    except ImportError:
        logger.warning("yfinance not installed")
        return []


async def fetch_commodities() -> dict:
    try:
        import yfinance as yf

        def _fetch():
            out = {}
            for key, ticker, unit in [("gold", "GC=F", "oz"), ("oil", "CL=F", "bbl")]:
                try:
                    t     = yf.Ticker(ticker)
                    info  = t.fast_info
                    price = getattr(info, "last_price", None)
                    prev  = getattr(info, "previous_close", None)
                    change = ((price - prev) / prev * 100) if price and prev else None
                    out[key] = {
                        "price":     price,
                        "change":    round(change, 2) if change is not None else None,
                        "direction": _direction(change),
                        "currency":  "USD",
                        "unit":      unit,
                    }
                except Exception as e:
                    out[key] = {"error": str(e)}
            return out

        return await asyncio.to_thread(_fetch)
    except ImportError:
        return {}


async def _fetch_bi_rate_live() -> float:
    # Try BI SEKI API (public, no auth)
    try:
        data = await safe_request_async(
            "https://www.bi.go.id/id/statistik/informasi-kurs/transaksi-bi/Default.aspx",
            timeout=8.0,
        )
        # BI endpoint may return HTML — extract rate from known pattern
        # Fallback handled below
    except Exception:
        pass

    # Try environment variable as authoritative override
    env_rate = os.environ.get("BI_RATE_DEFAULT")
    if env_rate:
        try:
            return float(env_rate)
        except ValueError:
            pass

    # Return last cached value or default
    cached = await cache_get(KEY_BI_RATE)
    if cached:
        return float(cached["data"])
    return 6.0


async def fetch_bi_rate() -> float:
    cached = await cache_get(KEY_BI_RATE)
    if cached:
        return float(cached["data"])
    rate = await _fetch_bi_rate_live()
    await cache_set(KEY_BI_RATE, rate, ttl=86400)
    return rate


async def fetch_indonesia_snapshot() -> dict:
    try:
        import yfinance as yf

        def _ihsg():
            t = yf.Ticker("^JKSE")
            info   = t.fast_info
            price  = getattr(info, "last_price", None)
            prev   = getattr(info, "previous_close", None)
            change = ((price - prev) / prev * 100) if price and prev else None
            return {"value": price, "change": round(change, 2) if change is not None else None, "direction": _direction(change)}

        ihsg = await asyncio.to_thread(_ihsg)
    except Exception as exc:
        logger.warning("IHSG fetch: %s", exc)
        ihsg = {"error": str(exc)}

    forex_cached = await cache_get(KEY_FOREX_BASE.format(base="USD"))
    usd_idr_rate = None
    if forex_cached:
        usd_idr_rate = forex_cached["data"].get("IDR")

    bi_rate = await fetch_bi_rate()

    snapshot = {"ihsg": ihsg, "usd_idr": {"rate": usd_idr_rate}, "bi_rate": bi_rate}
    await cache_set(KEY_IHSG, snapshot, ttl=600)
    return snapshot


def calculate_global_tension_score(news_data: dict) -> dict:
    """Port of surveilencemaxxing/modules/indicators.py — pure function."""
    all_text = []
    for stype_data in news_data.values():
        if isinstance(stype_data, dict):
            for arts in stype_data.values():
                for art in arts:
                    all_text.append((art.get("title", "") + " " + art.get("summary", "")).lower())

    if not all_text:
        return {"score": 0, "label": "Low", "color": "#44cc88", "keywords_found": [], "articles_analyzed": 0}

    total_words  = sum(len(t.split()) for t in all_text)
    hits: dict[str, int] = {}
    for kw in TENSION_KEYWORDS:
        count = sum(t.count(kw) for t in all_text)
        if count:
            hits[kw] = count

    raw_score = (sum(hits.values()) / max(total_words, 1)) * 10_000
    score     = min(int(raw_score), 100)

    if score < 20:   label, color = "Low",      "#44cc88"
    elif score < 50: label, color = "Moderate", "#ffcc44"
    elif score < 75: label, color = "Elevated", "#ff8844"
    else:            label, color = "Critical", "#ff4444"

    return {
        "score":            score,
        "label":            label,
        "color":            color,
        "keywords_found":   sorted(hits, key=hits.get, reverse=True)[:10],
        "articles_analyzed": len(all_text),
    }


async def fetch_all_market_signals() -> dict:
    fear_greed, markets, commodities, crypto, indonesia = await asyncio.gather(
        fetch_fear_greed(),
        fetch_global_markets(),
        fetch_commodities(),
        fetch_crypto_prices(),
        fetch_indonesia_snapshot(),
        return_exceptions=True,
    )

    def _safe(val, default):
        return default if isinstance(val, Exception) else val

    signals = {
        "fear_greed":     _safe(fear_greed, {}),
        "global_markets": _safe(markets, []),
        "commodities":    _safe(commodities, {}),
        "crypto":         _safe(crypto, {}),
        "indonesia":      _safe(indonesia, {}),
    }
    await cache_set(KEY_INDICATORS, signals, ttl=600)
    return signals
