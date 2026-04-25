"""
processing/cache.py — Redis cache layer + async HTTP utilities.
Foundation file: every other module imports from here.
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
from datetime import datetime, timezone
from typing import Any, Callable, Optional
from urllib.parse import urlparse

import httpx
from upstash_redis.asyncio import Redis

logger = logging.getLogger(__name__)

# ─── Redis singleton ──────────────────────────────────────────────────────────

_redis: Optional[Redis] = None


async def init_redis(url: str = None, token: str = None) -> Redis:
    global _redis
    url   = url   or os.environ["UPSTASH_REDIS_REST_URL"]
    token = token or os.environ["UPSTASH_REDIS_REST_TOKEN"]
    _redis = Redis(url=url, token=token)
    await _redis.ping()
    logger.info("Redis connected")
    return _redis


def get_redis() -> Redis:
    if _redis is None:
        raise RuntimeError("Redis not initialized — call init_redis() first")
    return _redis


# ─── Redis key constants ──────────────────────────────────────────────────────

KEY_NEWS_FEED        = "n2nd:news:feed"
KEY_NEWS_HEADLINES   = "n2nd:news:headlines"
KEY_NEWS_SOURCE      = "n2nd:news:source:{source_id}"

KEY_CRYPTO           = "n2nd:market:crypto"
KEY_FOREX_BASE       = "n2nd:market:forex:{base}"
KEY_INDICATORS       = "n2nd:market:indicators"
KEY_IHSG             = "n2nd:market:ihsg"

KEY_BI_RATE          = "n2nd:config:bi_rate"
KEY_SOURCES          = "n2nd:config:sources"

KEY_TENSION          = "n2nd:intel:tension"
KEY_BMKG             = "n2nd:intel:bmkg"
KEY_GDELT            = "n2nd:intel:gdelt"

KEY_BPS_NATIONAL     = "n2nd:bps:national"
KEY_BPS_PROVINCE     = "n2nd:bps:province:{dataset}"

KEY_SEARCH           = "n2nd:search:{hash}"
KEY_BUNDLE           = "n2nd:bundle:{hash}"
KEY_ENTITY           = "n2nd:entity:{slug}"

KEY_OJK              = "n2nd:intel:ojk"
KEY_IDX              = "n2nd:market:idx"

KEY_HEALTH           = "n2nd:health:status"
KEY_HEALTH_JOB       = "n2nd:health:ingestion:{job_id}"


# ─── Cache operations ─────────────────────────────────────────────────────────

async def cache_set(key: str, data: Any, ttl: int) -> None:
    payload = json.dumps({
        "data": data,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }, default=str)
    await get_redis().set(key, payload, ex=ttl)


async def cache_get(key: str) -> Optional[dict]:
    raw = await get_redis().get(key)
    if raw is None:
        return None
    try:
        return json.loads(raw)
    except Exception:
        return None


async def cache_get_or_set(key: str, fn: Callable, ttl: int) -> Any:
    cached = await cache_get(key)
    if cached is not None:
        return cached["data"]
    result = await fn()
    await cache_set(key, result, ttl)
    return result


async def cache_delete(key: str) -> None:
    await get_redis().delete(key)


# ─── Search key construction ──────────────────────────────────────────────────

def make_search_key(query: str, filters: dict = None) -> str:
    filters = filters or {}
    payload = query.strip().lower() + json.dumps(filters, sort_keys=True)
    digest  = hashlib.sha256(payload.encode()).hexdigest()[:16]
    return KEY_SEARCH.format(hash=digest)


def make_bundle_key(query: str, filters: dict = None) -> str:
    filters = filters or {}
    payload = query.strip().lower() + json.dumps(filters, sort_keys=True)
    digest  = hashlib.sha256(payload.encode()).hexdigest()[:16]
    return KEY_BUNDLE.format(hash=digest)


def make_entity_slug(name: str) -> str:
    return name.lower().strip().replace(" ", "_").replace("/", "_")


# ─── Async HTTP utilities ─────────────────────────────────────────────────────

_http_client: Optional[httpx.AsyncClient] = None


def get_http_client() -> httpx.AsyncClient:
    global _http_client
    if _http_client is None or _http_client.is_closed:
        _http_client = httpx.AsyncClient(
            timeout=httpx.Timeout(10.0),
            headers={"User-Agent": "N2NDBot/1.0 (n2nd.ai)"},
            follow_redirects=True,
        )
    return _http_client


async def safe_request_async(
    url: str,
    retries: int = 3,
    backoff: float = 2.0,
    params: dict = None,
    headers: dict = None,
    timeout: float = 10.0,
) -> dict | list:
    import asyncio
    client = get_http_client()
    last_exc: Exception = RuntimeError("No attempts made")

    for attempt in range(retries):
        try:
            resp = await client.get(url, params=params, headers=headers, timeout=timeout)
            if resp.status_code == 429:
                retry_after = float(resp.headers.get("Retry-After", backoff * (2 ** attempt)))
                await asyncio.sleep(retry_after)
                continue
            resp.raise_for_status()
            return resp.json()
        except Exception as exc:
            last_exc = exc
            if attempt < retries - 1:
                await asyncio.sleep(backoff * (2 ** attempt))

    logger.warning("safe_request_async(%s) failed after %d retries: %s", url, retries, last_exc)
    raise last_exc


async def fetch_with_fallback_async(
    primary_fn: Callable,
    fallback_fn: Callable,
    cache_key: str,
    ttl: int,
) -> Any:
    try:
        result = await primary_fn()
        await cache_set(cache_key, result, ttl)
        return result
    except Exception as primary_exc:
        logger.warning("Primary fetch failed (%s), trying fallback: %s", cache_key, primary_exc)
        try:
            result = await fallback_fn()
            await cache_set(cache_key, result, ttl)
            return result
        except Exception as fallback_exc:
            logger.warning("Fallback failed (%s): %s", cache_key, fallback_exc)
            stale = await cache_get(cache_key)
            if stale is not None:
                logger.info("Returning stale cache for %s", cache_key)
                return stale["data"]
            raise fallback_exc
