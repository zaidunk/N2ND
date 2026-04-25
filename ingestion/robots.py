"""
ingestion/robots.py — robots.txt compliance gate.
Hard-blocks unapproved sources before any scraping attempt.
"""

from __future__ import annotations

import logging
from urllib.parse import urlparse
from urllib.robotparser import RobotFileParser

import httpx

logger = logging.getLogger(__name__)

USER_AGENT = "N2NDBot/1.0 (+https://n2nd.ai/bot)"

# Pre-audited and approved sources — populated from docs/source-audit.md
APPROVED_SOURCES: frozenset[str] = frozenset({
    "rss.kompas.com",
    "www.kompas.com",
    "rss.detik.com",
    "www.detik.com",
    "rss.tempo.co",
    "www.tempo.co",
    "www.cnnindonesia.com",
    "www.antaranews.com",
    "www.cnbcindonesia.com",
    "feeds.bbci.co.uk",
    "feeds.reuters.com",
    "www.reuters.com",
    "www.aljazeera.com",
    "data.bmkg.go.id",
    "api.gdeltproject.org",
    "api.alternative.me",
    "open.er-api.com",
    "api.frankfurter.app",
    "api.coingecko.com",
})


class SourceNotApprovedError(Exception):
    pass


def is_approved(url: str) -> bool:
    hostname = urlparse(url).hostname or ""
    return hostname in APPROVED_SOURCES


def require_approved(url: str) -> None:
    if not is_approved(url):
        raise SourceNotApprovedError(
            f"Source not in APPROVED_SOURCES: {url}\n"
            "Run audit_source() and add to docs/source-audit.md before ingesting."
        )


async def check_robots(base_url: str, user_agent: str = USER_AGENT) -> dict:
    robots_url = base_url.rstrip("/") + "/robots.txt"
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(robots_url, follow_redirects=True)
            content = resp.text if resp.status_code == 200 else ""
    except Exception as exc:
        return {"allowed": True, "crawl_delay": None, "disallowed_paths": [], "note": str(exc)}

    rp = RobotFileParser()
    rp.parse(content.splitlines())

    disallowed = []
    for path in ["/rss", "/feed", "/feeds", "/xml", "/api"]:
        if not rp.can_fetch(user_agent, base_url + path):
            disallowed.append(path)

    crawl_delay = rp.crawl_delay(user_agent)

    return {
        "allowed":          len(disallowed) == 0,
        "crawl_delay":      crawl_delay,
        "disallowed_paths": disallowed,
        "robots_url":       robots_url,
    }


async def audit_source(url: str) -> dict:
    """Full source audit: robots check + RSS sample fetch + latency."""
    import time
    from ingestion.rss import fetch_rss

    base = f"{urlparse(url).scheme}://{urlparse(url).hostname}"
    robots = await check_robots(base)

    sample_count = 0
    latency_ms   = 0
    error        = None

    try:
        t0      = time.monotonic()
        hostname = urlparse(url).hostname or ""
        # Find matching source_id
        from ingestion.rss import RSS_SOURCES
        source_id = next((sid for sid, c in RSS_SOURCES.items() if urlparse(c["url"]).hostname == hostname), None)
        if source_id:
            articles = await fetch_rss(source_id)
            sample_count = len(articles)
        latency_ms = int((time.monotonic() - t0) * 1000)
    except Exception as exc:
        error = str(exc)

    return {
        "url":          url,
        "robots":       robots,
        "sample_count": sample_count,
        "latency_ms":   latency_ms,
        "approved":     robots["allowed"] and not error,
        "error":        error,
    }
