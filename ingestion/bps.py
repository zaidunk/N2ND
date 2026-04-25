"""
ingestion/bps.py — BPS Indonesia static data loader.
Reads LIVEMARGIN CSVs at startup, caches to Redis weekly.
"""

from __future__ import annotations

import csv
import logging
from pathlib import Path
from typing import Optional

from processing.cache import (
    KEY_BPS_NATIONAL,
    KEY_BPS_PROVINCE,
    cache_get,
    cache_set,
)

logger = logging.getLogger(__name__)

BASE = Path(__file__).parent.parent / "LIVEMARGIN"

BPS_FILES: dict[str, Path] = {
    "key_statistics": BASE / "01_key_statistics_2016_2025.csv",
    "unemployment":   BASE / "02_unemployment_by_province_2024_2025.csv",
    "ump":            BASE / "04_ump_by_province_2023_2025.csv",
    "poverty":        BASE / "05_poverty_data_2017_2025.csv",
    "hdi":            BASE / "06_hdi_by_province_2021_2025.csv",
    "smoking":        BASE / "07_smoking_rate_province_age_2025.csv",
    "divorce":        BASE / "09_divorce_causes_2025.csv",
    "internet":       BASE / "12_internet_access_household_2022_2025.csv",
    "fdi":            BASE / "16_fdi_by_country_2023_2025.csv",
}

BPS_TTL = 604_800  # 7 days

# Province name normalization — CSVs use inconsistent spellings
PROVINCE_ALIASES: dict[str, str] = {
    "di yogyakarta":          "DI Yogyakarta",
    "daerah istimewa yogyakarta": "DI Yogyakarta",
    "dki jakarta":            "DKI Jakarta",
    "jakarta":                "DKI Jakarta",
    "kalimantan timur":       "Kalimantan Timur",
    "sulawesi tenggara":      "Sulawesi Tenggara",
    "nusa tenggara barat":    "Nusa Tenggara Barat",
    "nusa tenggara timur":    "Nusa Tenggara Timur",
    "papua barat":            "Papua Barat",
    "maluku utara":           "Maluku Utara",
    "kepulauan riau":         "Kepulauan Riau",
    "kepulauan bangka belitung": "Kepulauan Bangka Belitung",
}

_bps_cache: dict[str, list[dict]] = {}
_province_index: dict[str, dict[str, dict]] = {}  # {dataset: {norm_province: row}}


def normalize_province(name: str) -> str:
    return PROVINCE_ALIASES.get(name.strip().lower(), name.strip())


def load_csv_to_records(filepath: Path) -> list[dict]:
    records = []
    try:
        with open(filepath, encoding="utf-8-sig", newline="") as f:
            reader = csv.DictReader(f)
            for row in reader:
                cleaned = {k.strip(): v.strip() for k, v in row.items() if k}
                records.append(cleaned)
    except Exception as exc:
        logger.error("Failed to load %s: %s", filepath.name, exc)
    return records


def load_all_bps() -> dict[str, list[dict]]:
    global _bps_cache, _province_index
    result: dict[str, list[dict]] = {}
    for name, path in BPS_FILES.items():
        rows = load_csv_to_records(path)
        result[name] = rows
        logger.info("BPS loaded: %s (%d rows)", name, len(rows))
    _bps_cache = result
    _build_province_index()
    return result


def _build_province_index() -> None:
    global _province_index
    idx: dict[str, dict[str, dict]] = {}
    for dataset, rows in _bps_cache.items():
        prov_col = _detect_province_column(rows)
        if not prov_col:
            continue
        idx[dataset] = {}
        for row in rows:
            norm = normalize_province(row.get(prov_col, "")).lower()
            if norm:
                idx[dataset][norm] = row
    _province_index = idx


async def load_bps_to_redis() -> None:
    data = load_all_bps()
    for dataset, rows in data.items():
        key = KEY_BPS_PROVINCE.format(dataset=dataset)
        await cache_set(key, rows, BPS_TTL)
        logger.info("Redis cached: %s (%d rows, TTL %ds)", key, len(rows), BPS_TTL)

    national = get_national_summary()
    await cache_set(KEY_BPS_NATIONAL, national, BPS_TTL)
    logger.info("Redis cached: %s", KEY_BPS_NATIONAL)


def get_national_summary() -> dict:
    rows = _bps_cache.get("key_statistics", [])
    if not rows:
        rows = load_csv_to_records(BPS_FILES["key_statistics"])

    summary: dict[str, dict] = {}
    years = [str(y) for y in range(2016, 2026)]

    for row in rows:
        category  = row.get("Category", "")
        indicator = row.get("Indicator", "")
        unit      = row.get("Unit", "")
        latest_year = None
        latest_val  = None
        series: list[dict] = []

        for yr in years:
            raw = row.get(yr, "")
            if raw and raw not in ("-", "N/A", ""):
                try:
                    val = float(raw.replace(",", "").replace(" ", ""))
                    series.append({"year": yr, "value": val})
                    latest_year = yr
                    latest_val  = val
                except ValueError:
                    pass

        key = f"{category}::{indicator}"
        summary[key] = {
            "category":  category,
            "indicator": indicator,
            "unit":      unit,
            "latest_year": latest_year,
            "latest_value": latest_val,
            "series": series,
        }
    return summary


async def get_bps_dataset(dataset: str) -> list[dict]:
    key = KEY_BPS_PROVINCE.format(dataset=dataset)
    cached = await cache_get(key)
    if cached:
        return cached["data"]
    rows = _bps_cache.get(dataset, load_csv_to_records(BPS_FILES[dataset]))
    await cache_set(key, rows, BPS_TTL)
    return rows


def query_bps_by_province(dataset: str, province: str) -> Optional[dict]:
    norm = normalize_province(province).lower()
    if _province_index:
        return _province_index.get(dataset, {}).get(norm)
    # fallback: linear scan if index not built yet
    rows = _bps_cache.get(dataset, [])
    prov_col = _detect_province_column(rows)
    if not prov_col:
        return None
    for row in rows:
        if normalize_province(row.get(prov_col, "")).lower() == norm:
            return row
    return None


def query_bps_all_provinces(dataset: str) -> list[dict]:
    rows = _bps_cache.get(dataset, [])
    prov_col = _detect_province_column(rows)
    if not prov_col:
        return rows
    return [{**r, "province_normalized": normalize_province(r.get(prov_col, ""))} for r in rows]


def get_bps_trend(dataset: str, indicator: str) -> list[dict]:
    if dataset == "key_statistics":
        rows = _bps_cache.get("key_statistics", [])
        years = [str(y) for y in range(2016, 2026)]
        for row in rows:
            if indicator.lower() in row.get("Indicator", "").lower():
                series = []
                for yr in years:
                    raw = row.get(yr, "")
                    if raw and raw not in ("-", "N/A", ""):
                        try:
                            series.append({"year": yr, "value": float(raw.replace(",", ""))})
                        except ValueError:
                            pass
                return series
    return []


def _detect_province_column(rows: list[dict]) -> Optional[str]:
    if not rows:
        return None
    for col in rows[0].keys():
        if "province" in col.lower() or "provinsi" in col.lower():
            return col
    return None


async def refresh_bps_weekly() -> None:
    logger.info("Refreshing BPS data from CSV files")
    await load_bps_to_redis()
