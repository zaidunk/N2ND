"""
processing/dedup.py — Deduplication pipeline.
Port of surveilencemaxxing/modules/news.py dedup functions + DB hash check.
"""

from __future__ import annotations

import hashlib
import logging

logger = logging.getLogger(__name__)


def compute_content_hash(title: str, link: str) -> str:
    canonical = (link or title).strip().lower()
    return hashlib.sha256(canonical.encode()).hexdigest()[:32]


def word_overlap_similarity(a: str, b: str) -> float:
    """Direct port of _similarity() from news.py."""
    a_words = set(a.lower().split())
    b_words = set(b.lower().split())
    if not a_words or not b_words:
        return 0.0
    return len(a_words & b_words) / max(len(a_words), len(b_words))


def deduplicate_by_title(articles: list[dict], threshold: float = 0.7) -> list[dict]:
    """Direct port of deduplicate_news() from news.py."""
    seen_titles: list[str] = []
    unique: list[dict] = []
    for article in articles:
        title = article.get("title", "")
        is_dup = any(word_overlap_similarity(title, seen) > threshold for seen in seen_titles)
        if not is_dup:
            seen_titles.append(title)
            unique.append(article)
    return unique


async def deduplicate_against_db(
    articles: list[dict],
    db_client,
    window_hours: int = 48,
) -> list[dict]:
    """
    Filter articles that already exist in Supabase documents table.
    Single batch SELECT — no N+1. Returns only truly new articles.
    """
    if not articles:
        return []

    hashes = [a.get("content_hash") or compute_content_hash(a.get("title", ""), a.get("link", ""))
              for a in articles]

    try:
        result = (
            db_client.table("documents")
            .select("content_hash")
            .in_("content_hash", hashes)
            .execute()
        )
        existing = {row["content_hash"] for row in (result.data or [])}
        new_articles = [
            a for a in articles
            if (a.get("content_hash") or compute_content_hash(a.get("title", ""), a.get("link", "")))
            not in existing
        ]
        logger.debug("dedup_against_db: %d/%d articles are new", len(new_articles), len(articles))
        return new_articles
    except Exception as exc:
        logger.warning("deduplicate_against_db failed (skipping DB check): %s", exc)
        return articles


def run_full_dedup(articles: list[dict], threshold: float = 0.7) -> list[dict]:
    """Pass 1: word-overlap title dedup (fast, in-memory)."""
    before = len(articles)
    result = deduplicate_by_title(articles, threshold)
    logger.debug("dedup pass1: %d → %d", before, len(result))
    return result
