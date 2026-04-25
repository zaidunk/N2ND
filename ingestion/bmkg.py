"""
ingestion/bmkg.py — BMKG (Indonesia Meteorology Agency) earthquake data.
Public API, no key required. TTL 1800s.
"""

from __future__ import annotations

import logging
import re
from datetime import datetime, timezone

from processing.cache import KEY_BMKG, cache_set, safe_request_async

logger = logging.getLogger(__name__)

BMKG_LATEST_URL   = "https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json"
BMKG_LIST_URL     = "https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json"

# BMKG month abbreviations (Indonesian)
_MONTH_ID = {
    "Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4, "Mei": 5, "Jun": 6,
    "Jul": 7, "Agu": 8, "Sep": 9, "Okt": 10, "Nov": 11, "Des": 12,
}


def _parse_bmkg_datetime(date_str: str, time_str: str) -> str:
    """Convert BMKG date '25 Apr 2026' + time '14:30:00 WIB' → ISO 8601 UTC+7."""
    try:
        parts = date_str.strip().split()
        day, month_abbr, year = int(parts[0]), parts[1], int(parts[2])
        month = _MONTH_ID.get(month_abbr, 1)
        time_clean = re.sub(r"\s*(WIB|WITA|WIT).*", "", time_str).strip()
        t_parts = time_clean.split(":")
        hour, minute, second = int(t_parts[0]), int(t_parts[1]), int(t_parts[2]) if len(t_parts) > 2 else 0
        dt = datetime(year, month, day, hour, minute, second, tzinfo=timezone.utc)
        # WIB = UTC+7, subtract 7h to get UTC
        from datetime import timedelta
        dt_utc = dt - timedelta(hours=7)
        return dt_utc.isoformat()
    except Exception:
        return datetime.now(timezone.utc).isoformat()


def _parse_bmkg_earthquake(raw: dict) -> dict:
    gempa = raw.get("Infogempa", {}).get("gempa", raw.get("gempa", raw))
    return {
        "magnitude":       gempa.get("Magnitude", gempa.get("magnitude")),
        "depth_km":        gempa.get("Kedalaman", gempa.get("depth", "")).replace(" km", "").strip(),
        "location":        gempa.get("Wilayah", gempa.get("wilayah", "")),
        "coordinates":     {
            "lat": gempa.get("Lintang",  gempa.get("lat", "")),
            "lon": gempa.get("Bujur",    gempa.get("lon", "")),
        },
        "datetime_iso":    _parse_bmkg_datetime(
            gempa.get("Tanggal", ""), gempa.get("Jam", "")
        ),
        "tsunami_warning": gempa.get("Potensi", "Tidak ada potensi tsunami"),
        "shakemap_url":    f"https://data.bmkg.go.id/DataMKG/TEWS/{gempa.get('Shakemap', '')}",
    }


async def fetch_latest_earthquake() -> dict:
    try:
        raw = await safe_request_async(BMKG_LATEST_URL)
        return _parse_bmkg_earthquake(raw)
    except Exception as exc:
        logger.warning("fetch_latest_earthquake: %s", exc)
        return {"error": str(exc)}


async def fetch_earthquake_list(limit: int = 15) -> list[dict]:
    try:
        raw    = await safe_request_async(BMKG_LIST_URL)
        gempa_list = raw.get("Infogempa", {}).get("gempa", [])
        return [_parse_bmkg_earthquake({"gempa": g}) for g in gempa_list[:limit]]
    except Exception as exc:
        logger.warning("fetch_earthquake_list: %s", exc)
        return []


async def fetch_bmkg_data() -> dict:
    latest, recent = await __import__("asyncio").gather(
        fetch_latest_earthquake(),
        fetch_earthquake_list(),
        return_exceptions=True,
    )
    data = {
        "latest_earthquake":  latest  if not isinstance(latest, Exception)  else {},
        "recent_earthquakes": recent  if not isinstance(recent, Exception)  else [],
        "fetched_at":         datetime.now(timezone.utc).isoformat(),
    }
    await cache_set(KEY_BMKG, data, ttl=1800)
    return data
