"""
ingestion/scheduler.py — AsyncIOScheduler for all ingestion jobs.
All jobs: max_instances=1 (no overlap), failures logged but never crash server.
"""

from __future__ import annotations

import logging
import os
from datetime import datetime, timezone

from apscheduler.events import EVENT_JOB_ERROR, EVENT_JOB_EXECUTED
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from processing.cache import KEY_HEALTH_JOB, cache_set

logger = logging.getLogger(__name__)

_scheduler: AsyncIOScheduler = None


def _get_interval(env_key: str, default: int) -> int:
    return int(os.environ.get(env_key, default))


# ─── Job wrappers ─────────────────────────────────────────────────────────────

async def _job_ingest_rss() -> None:
    from ingestion.rss import fetch_all_rss, update_news_cache
    from processing.dedup import run_full_dedup
    from processing.nlp import process_articles_batch
    from processing.summarize import summarize_batch

    t0 = datetime.now(timezone.utc)
    try:
        raw       = await fetch_all_rss()
        deduped   = run_full_dedup(raw)
        processed = await process_articles_batch(deduped)
        processed = await summarize_batch(processed)
        await update_news_cache(processed)

        await _try_embed_and_store(processed, source="rss")
        _log_job("ingest_rss", t0, len(processed))
    except Exception as exc:
        logger.error("_job_ingest_rss failed: %s", exc, exc_info=True)


async def _job_ingest_market() -> None:
    from ingestion.market import fetch_all_market_signals, calculate_global_tension_score
    from processing.cache import KEY_TENSION, cache_get, KEY_NEWS_FEED, cache_set as cs

    t0 = datetime.now(timezone.utc)
    try:
        signals = await fetch_all_market_signals()

        # Compute tension from latest news feed
        news_cached = await cache_get(KEY_NEWS_FEED)
        news_data = {"all": {"General News": news_cached["data"]}} if news_cached else {}
        tension = calculate_global_tension_score(news_data)
        await cs(KEY_TENSION, tension, ttl=900)

        _log_job("ingest_market", t0, 1)
    except Exception as exc:
        logger.error("_job_ingest_market failed: %s", exc, exc_info=True)


async def _job_ingest_crypto() -> None:
    from ingestion.market import fetch_crypto_prices

    t0 = datetime.now(timezone.utc)
    try:
        await fetch_crypto_prices()
        _log_job("ingest_crypto", t0, 1)
    except Exception as exc:
        logger.error("_job_ingest_crypto failed: %s", exc, exc_info=True)


async def _job_ingest_forex() -> None:
    from ingestion.market import fetch_latest_forex

    t0 = datetime.now(timezone.utc)
    try:
        for base in ("USD", "EUR", "CNY"):
            await fetch_latest_forex(base)
        _log_job("ingest_forex", t0, 3)
    except Exception as exc:
        logger.error("_job_ingest_forex failed: %s", exc, exc_info=True)


async def _job_ingest_bmkg() -> None:
    from ingestion.bmkg import fetch_bmkg_data

    t0 = datetime.now(timezone.utc)
    try:
        await fetch_bmkg_data()
        _log_job("ingest_bmkg", t0, 1)
    except Exception as exc:
        logger.error("_job_ingest_bmkg failed: %s", exc, exc_info=True)


async def _job_ingest_gdelt() -> None:
    from ingestion.gdelt import fetch_all_gdelt
    from processing.summarize import summarize_batch

    t0 = datetime.now(timezone.utc)
    try:
        data = await fetch_all_gdelt()
        articles = data.get("articles", [])
        if articles:
            articles = await summarize_batch(articles)
            await _try_embed_and_store(articles, source="gdelt")
        _log_job("ingest_gdelt", t0, len(articles))
    except Exception as exc:
        logger.error("_job_ingest_gdelt failed: %s", exc, exc_info=True)


async def _job_ingest_ojk() -> None:
    from ingestion.ojk import fetch_ojk_stats

    t0 = datetime.now(timezone.utc)
    try:
        await fetch_ojk_stats()
        _log_job("ingest_ojk", t0, 1)
    except Exception as exc:
        logger.error("_job_ingest_ojk failed: %s", exc, exc_info=True)


async def _job_ingest_idx() -> None:
    from ingestion.idx import fetch_idx_data

    t0 = datetime.now(timezone.utc)
    try:
        await fetch_idx_data()
        _log_job("ingest_idx", t0, 1)
    except Exception as exc:
        logger.error("_job_ingest_idx failed: %s", exc, exc_info=True)


async def _job_refresh_bps() -> None:
    from ingestion.bps import refresh_bps_weekly

    t0 = datetime.now(timezone.utc)
    try:
        await refresh_bps_weekly()
        _log_job("refresh_bps", t0, 9)
    except Exception as exc:
        logger.error("_job_refresh_bps failed: %s", exc, exc_info=True)


async def _job_health_check() -> None:
    from processing.cache import KEY_HEALTH, cache_get, cache_set as cs

    checks = {}
    for key_name, redis_key in [
        ("news",       "n2nd:news:feed"),
        ("crypto",     "n2nd:market:crypto"),
        ("indicators", "n2nd:market:indicators"),
        ("bmkg",       "n2nd:intel:bmkg"),
        ("bps",        "n2nd:bps:national"),
    ]:
        cached = await cache_get(redis_key)
        checks[key_name] = "ok" if cached else "missing"

    errors = sum(1 for v in checks.values() if v == "missing")
    if errors == 0:
        status = "ALL_OK"
    elif errors >= len(checks) // 2:
        status = "CRITICAL"
    else:
        status = "DEGRADED"

    await cs(KEY_HEALTH, {"status": status, "checks": checks}, ttl=120)


# ─── Shared embed + store helper ──────────────────────────────────────────────

async def _try_embed_and_store(articles: list[dict], source: str) -> None:
    """Embed articles and upsert to Supabase. Non-fatal on failure."""
    try:
        from processing.embeddings import embed_articles
        from api.main import get_db_client

        embedded = await embed_articles(articles)
        db = get_db_client()

        rows = []
        for a in embedded:
            row = {
                "content_hash":   a.get("content_hash"),
                "source_id":      a.get("source_id"),
                "source_type":    a.get("source_type", "rss_id"),
                "content_type":   a.get("content_type", "article"),
                "title":          a.get("title"),
                "body":           a.get("summary") or a.get("body"),
                "published_at":   a.get("published"),
                "lang":           a.get("lang", "id"),
                "entities":       a.get("entities", []),
                "topics":         a.get("topics", []),
                "sentiment":      a.get("sentiment"),
                "tension_score":  a.get("tension_score"),
                "authority_score": a.get("authority_score", 0.7),
                "embedding":      a.get("embedding"),
                "raw":            {k: v for k, v in a.items() if k not in ("embedding",)},
            }
            if row["content_hash"]:
                rows.append(row)

        if rows:
            db.table("documents").upsert(rows, on_conflict="content_hash").execute()
            logger.info("_try_embed_and_store(%s): upserted %d docs", source, len(rows))

            # R2 archive — fire-and-forget, never blocks pipeline
            from ingestion.r2 import archive_documents
            import asyncio
            asyncio.create_task(archive_documents(rows, source=source))

    except Exception as exc:
        logger.warning("_try_embed_and_store(%s) non-fatal: %s", source, exc)


# ─── Scheduler lifecycle ──────────────────────────────────────────────────────

def _on_job_event(event):
    if event.exception:
        logger.error("Scheduler job %s failed: %s", event.job_id, event.exception)
    else:
        logger.debug("Scheduler job %s completed", event.job_id)


def _log_job(job_id: str, started: datetime, records: int) -> None:
    duration_ms = int((datetime.now(timezone.utc) - started).total_seconds() * 1000)
    logger.info("Job %-20s finished in %4dms | records: %d", job_id, duration_ms, records)
    import asyncio
    asyncio.create_task(
        cache_set(
            KEY_HEALTH_JOB.format(job_id=job_id),
            {"ran_at": started.isoformat(), "duration_ms": duration_ms, "records": records},
            ttl=120,
        )
    )


def start_scheduler() -> AsyncIOScheduler:
    global _scheduler
    _scheduler = AsyncIOScheduler(timezone="UTC")
    _scheduler.add_listener(_on_job_event, EVENT_JOB_ERROR | EVENT_JOB_EXECUTED)

    common = {"max_instances": 1, "misfire_grace_time": 60}
    _scheduler.add_job(_job_ingest_rss,     "interval", seconds=_get_interval("RSS_INTERVAL",    900),     id="ingest_rss",     **common, next_run_time=_offset(30))
    _scheduler.add_job(_job_ingest_market,  "interval", seconds=_get_interval("MARKET_INTERVAL", 600),     id="ingest_market",  **common, next_run_time=_offset(10))
    _scheduler.add_job(_job_ingest_crypto,  "interval", seconds=_get_interval("CRYPTO_INTERVAL", 300),     id="ingest_crypto",  **common, next_run_time=_offset(15))
    _scheduler.add_job(_job_ingest_forex,   "interval", seconds=_get_interval("FOREX_INTERVAL",  3600),    id="ingest_forex",   **common, next_run_time=_offset(20))
    _scheduler.add_job(_job_ingest_bmkg,    "interval", seconds=_get_interval("BMKG_INTERVAL",   1800),    id="ingest_bmkg",    **common, next_run_time=_offset(25))
    _scheduler.add_job(_job_ingest_gdelt,   "interval", seconds=_get_interval("GDELT_INTERVAL",  3600),    id="ingest_gdelt",   **common, next_run_time=_offset(60))
    _scheduler.add_job(_job_ingest_ojk,     "interval", seconds=_get_interval("OJK_INTERVAL",    86400),   id="ingest_ojk",     **common, next_run_time=_offset(45))
    _scheduler.add_job(_job_ingest_idx,     "interval", seconds=_get_interval("IDX_INTERVAL",    300),     id="ingest_idx",     **common, next_run_time=_offset(20))
    _scheduler.add_job(_job_refresh_bps,    "interval", seconds=_get_interval("BPS_INTERVAL",    604800),  id="refresh_bps",    **common, next_run_time=_offset(0))
    _scheduler.add_job(_job_health_check,   "interval", seconds=_get_interval("HEALTH_INTERVAL", 120),     id="health_check",   **common, next_run_time=_offset(5))

    _scheduler.start()
    logger.info("Scheduler started with %d jobs", len(_scheduler.get_jobs()))
    return _scheduler


def stop_scheduler() -> None:
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped")


def _offset(seconds: int) -> datetime:
    from datetime import timedelta
    return datetime.now(timezone.utc) + timedelta(seconds=seconds)
