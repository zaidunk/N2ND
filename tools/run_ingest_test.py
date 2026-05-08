"""Run an end-to-end ingestion test locally.

Usage:
    python tools/run_ingest_test.py

This script will:
- load .env
- init Redis and embeddings client
- fetch RSS, dedupe, run NLP, summarize, cache, embed
- print a short report and sample processed article
"""

import asyncio
import logging
import os
import sys
import pathlib

from dotenv import load_dotenv

# Ensure repo root is on sys.path so `processing`, `ingestion`, `api` packages import correctly
ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

load_dotenv()

# Prevent Sentry auto-init during local test runs when placeholder DSN present
os.environ["SENTRY_DSN"] = ""

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ingest-test")


async def main():
    # Lazy imports so script can fail gracefully if deps missing
    try:
        from processing.cache import init_redis
        from ingestion.rss import fetch_all_rss, update_news_cache
        from processing.dedup import run_full_dedup
        from processing.nlp import process_articles_batch
        from processing.summarize import summarize_batch
        from processing.embeddings import init_embeddings, embed_articles
        from api.main import get_db_client
    except Exception as exc:
        logger.error("Missing module or import error: %s", exc)
        raise

    # Init Redis
    try:
        await init_redis()
    except Exception as exc:
        logger.warning("Redis init failed (continuing): %s", exc)

    # Init embeddings
    try:
        init_embeddings()
    except Exception as exc:
        logger.warning("Embeddings init failed (continuing): %s", exc)

    # Avoid initializing external monitoring in test runs if DSN placeholder present
    os.environ.setdefault("SENTRY_DSN", "")

    # Try DB client
    try:
        db = get_db_client()
        logger.info("DB client available")
    except Exception as exc:
        logger.warning("DB client not available: %s", exc)
        db = None

    # Fetch RSS
    raw = []
    try:
        raw = await fetch_all_rss()
    except Exception as exc:
        logger.error("fetch_all_rss failed: %s", exc)
        return

    if not raw:
        logger.info("No articles fetched from RSS sources")
        return

    logger.info("Fetched %d raw articles", len(raw))

    # Dedup
    try:
        deduped = run_full_dedup(raw)
        logger.info("Deduped -> %d articles", len(deduped))
    except Exception as exc:
        logger.error("Dedup failed: %s", exc)
        deduped = raw

    # NLP processing
    try:
        processed = await process_articles_batch(deduped, batch_size=10)
        logger.info("NLP processed %d articles", len(processed))
    except Exception as exc:
        logger.error("NLP processing failed: %s", exc)
        processed = deduped

    # Summarize
    try:
        processed = await summarize_batch(processed)
        logger.info("Summarization done")
    except Exception as exc:
        logger.warning("Summarize batch failed (continuing): %s", exc)

    # Cache
    try:
        await update_news_cache(processed)
        logger.info("News cache updated")
    except Exception as exc:
        logger.warning("update_news_cache failed: %s", exc)

    # Embed
    try:
        embedded = await embed_articles(processed[:20])
        logger.info("Embedded %d articles (sample)", len(embedded))
    except Exception as exc:
        logger.warning("Embedding failed: %s", exc)
        embedded = processed

    # Report
    print("\n=== INGEST TEST REPORT ===")
    print(f"raw: {len(raw)} | deduped: {len(deduped)} | processed: {len(processed)} | embedded_sample: {len(embedded)}")
    if embedded:
        sample = embedded[0]
        print("\nSample article:")
        for k in ("title", "link", "summary", "ai_summary", "entities", "topics", "sentiment"):
            if k in sample:
                print(f"- {k}: {sample.get(k)}")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as e:
        logger.exception("Ingest test failed: %s", e)
        sys.exit(1)
