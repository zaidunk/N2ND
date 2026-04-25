"""
ingestion/rss.py — Async RSS feed ingestion.
Ported from surveilencemaxxing/modules/news.py with async wrapper + source metadata.
"""

from __future__ import annotations

import asyncio
import hashlib
import logging
import re
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from typing import TypedDict

import feedparser

from processing.cache import (
    KEY_NEWS_FEED,
    KEY_NEWS_HEADLINES,
    KEY_NEWS_SOURCE,
    cache_set,
)

logger = logging.getLogger(__name__)

AUTHORITY_SCORES: dict[str, float] = {"A": 0.9, "B": 0.7, "C": 0.5}

RSS_SOURCES: dict[str, dict] = {
    "antara":       {"url": "https://www.antaranews.com/rss/terkini.xml",           "tier": "A", "lang": "id", "name": "Antara"},
    "kompas":       {"url": "https://rss.kompas.com/rss/xml/tag/topheadlines",      "tier": "A", "lang": "id", "name": "Kompas"},
    "detik":        {"url": "https://rss.detik.com/index.php/detikcom",             "tier": "B", "lang": "id", "name": "Detik"},
    "cnnindonesia": {"url": "https://www.cnnindonesia.com/rss",                     "tier": "B", "lang": "id", "name": "CNN Indonesia"},
    "tempo":        {"url": "https://rss.tempo.co/",                                "tier": "B", "lang": "id", "name": "Tempo"},
    "cnbcid":       {"url": "https://www.cnbcindonesia.com/rss",                    "tier": "B", "lang": "id", "name": "CNBC Indonesia"},
    "reuters":      {"url": "https://feeds.reuters.com/reuters/topNews",            "tier": "A", "lang": "en", "name": "Reuters"},
    "bbc":          {"url": "http://feeds.bbci.co.uk/news/rss.xml",                 "tier": "A", "lang": "en", "name": "BBC News"},
    "aljazeera":    {"url": "https://www.aljazeera.com/xml/rss/all.xml",            "tier": "B", "lang": "en", "name": "Al Jazeera"},
}


class RawArticle(TypedDict):
    title: str
    link: str
    summary: str
    published: str
    source: str
    source_id: str
    source_type: str
    authority_score: float
    lang: str
    content_hash: str


# ─── Port from surveilencemaxxing/modules/news.py ─────────────────────────────

def _clean_html(text: str) -> str:
    return re.sub(r"<[^>]+>", "", text).strip()


def _parse_date(entry) -> str:
    for field in ("published", "updated", "created"):
        value = entry.get(field)
        if value:
            try:
                return parsedate_to_datetime(value).isoformat()
            except Exception:
                return value
    return datetime.now(timezone.utc).isoformat()


def compute_content_hash(title: str, link: str) -> str:
    canonical = (link or title).strip().lower()
    return hashlib.sha256(canonical.encode()).hexdigest()[:32]


# ─── Async fetch ─────────────────────────────────────────────────────────────

async def fetch_rss(source_id: str, timeout: int = 10) -> list[RawArticle]:
    conf = RSS_SOURCES.get(source_id)
    if not conf:
        logger.warning("Unknown source_id: %s", source_id)
        return []

    url   = conf["url"]
    tier  = conf["tier"]
    lang  = conf["lang"]
    name  = conf["name"]
    auth  = AUTHORITY_SCORES.get(tier, 0.7)
    stype = "rss_id" if lang == "id" else "rss_global"

    try:
        feed = await asyncio.to_thread(
            feedparser.parse, url,
            agent="N2NDBot/1.0",
            request_headers={"Accept": "application/rss+xml,application/xml,text/xml"},
        )
        if feed.bozo and not feed.entries:
            raise ValueError(f"feedparser bozo: {feed.bozo_exception}")

        articles: list[RawArticle] = []
        for entry in feed.entries[:30]:
            title   = entry.get("title", "").strip()
            link    = entry.get("link", "").strip()
            summary = _clean_html(
                entry.get("summary", entry.get("description", "")).strip()
            )[:300]
            published = _parse_date(entry)

            if not title or not link:
                continue

            articles.append({
                "title":          title,
                "link":           link,
                "summary":        summary,
                "published":      published,
                "source":         name,
                "source_id":      source_id,
                "source_type":    stype,
                "authority_score": auth,
                "lang":           lang,
                "content_hash":   compute_content_hash(title, link),
            })

        logger.debug("fetch_rss(%s): %d articles", source_id, len(articles))
        return articles

    except Exception as exc:
        logger.warning("fetch_rss(%s) failed: %s", source_id, exc)
        return []


async def fetch_all_rss(source_ids: list[str] = None) -> list[RawArticle]:
    ids = source_ids or list(RSS_SOURCES.keys())
    results = await asyncio.gather(*[fetch_rss(sid) for sid in ids])
    flat = [art for batch in results for art in batch]
    logger.info("fetch_all_rss: %d total articles from %d sources", len(flat), len(ids))
    return flat


async def update_news_cache(articles: list[RawArticle]) -> None:
    if not articles:
        return

    sorted_arts = sorted(articles, key=lambda a: a.get("published", ""), reverse=True)

    await cache_set(KEY_NEWS_FEED, sorted_arts[:50], ttl=900)
    await cache_set(KEY_NEWS_HEADLINES, sorted_arts[:10], ttl=900)

    by_source: dict[str, list] = {}
    for art in sorted_arts:
        sid = art["source_id"]
        by_source.setdefault(sid, []).append(art)

    for sid, arts in by_source.items():
        await cache_set(KEY_NEWS_SOURCE.format(source_id=sid), arts[:20], ttl=900)
