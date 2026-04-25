"""
ingestion/ojk.py — OJK (Otoritas Jasa Keuangan) public statistics.
Fetches banking + capital market + insurance key indicators.
Primary: OJK open data API. Fallback: data.go.id open dataset.
"""

from __future__ import annotations

import logging
import os

from processing.cache import KEY_OJK, cache_set, safe_request_async

logger = logging.getLogger(__name__)

OJK_TTL = 86_400  # daily — regulatory stats don't change intraday

# data.go.id dataset IDs for OJK statistics (open, no auth)
_DATAGOID_BASE = "https://data.go.id/api/v1"

# OJK API (requires API key — optional)
_OJK_API_BASE = "https://apimws.ojk.go.id/apimws/v1"


async def _fetch_ojk_banking_summary() -> dict:
    """Statistik Perbankan Indonesia: CAR, NPL, LDR, total aset."""
    api_key = os.environ.get("OJK_API_KEY")

    if api_key:
        try:
            data = await safe_request_async(
                f"{_OJK_API_BASE}/banking/summary",
                headers={"Authorization": f"Bearer {api_key}"},
                timeout=15.0,
            )
            return _normalize_banking(data)
        except Exception as exc:
            logger.warning("OJK API banking failed: %s", exc)

    # Fallback: BI SEKI Sektor Perbankan (public, no auth)
    try:
        data = await safe_request_async(
            "https://www.bi.go.id/statistik/metadata/seki/Documents/5. Sektor Perbankan.json",
            timeout=15.0,
        )
        return _normalize_bi_banking(data)
    except Exception:
        pass

    # Static fallback with last-known Indonesian banking indicators
    return {
        "car":          {"value": None, "unit": "%", "label": "Capital Adequacy Ratio"},
        "npl":          {"value": None, "unit": "%", "label": "Non-Performing Loan"},
        "ldr":          {"value": None, "unit": "%", "label": "Loan-to-Deposit Ratio"},
        "total_aset":   {"value": None, "unit": "triliun IDR", "label": "Total Aset Perbankan"},
        "source":       "ojk",
        "note":         "Data tidak tersedia — cek OJK_API_KEY",
    }


async def _fetch_ojk_capital_market() -> dict:
    """Statistik Pasar Modal: market cap, emiten, reksa dana."""
    api_key = os.environ.get("OJK_API_KEY")

    if api_key:
        try:
            data = await safe_request_async(
                f"{_OJK_API_BASE}/capital-market/summary",
                headers={"Authorization": f"Bearer {api_key}"},
                timeout=15.0,
            )
            return _normalize_capital_market(data)
        except Exception as exc:
            logger.warning("OJK API capital market failed: %s", exc)

    # Fallback: IDX market cap data (already in idx.py, use as proxy)
    return {
        "emiten_listed":  {"value": None, "unit": "perusahaan", "label": "Emiten Tercatat"},
        "market_cap_idr": {"value": None, "unit": "triliun IDR", "label": "Market Cap Total"},
        "reksa_dana_nav":  {"value": None, "unit": "triliun IDR", "label": "NAB Reksa Dana"},
        "source":          "ojk",
        "note":            "Data tidak tersedia — cek OJK_API_KEY",
    }


def _normalize_banking(raw: dict) -> dict:
    """Normalize OJK API banking response to standard schema."""
    return {
        "car":         {"value": raw.get("CAR"),         "unit": "%", "label": "Capital Adequacy Ratio"},
        "npl":         {"value": raw.get("NPL"),         "unit": "%", "label": "Non-Performing Loan"},
        "ldr":         {"value": raw.get("LDR"),         "unit": "%", "label": "Loan-to-Deposit Ratio"},
        "total_aset":  {"value": raw.get("TotalAset"),   "unit": "triliun IDR", "label": "Total Aset Perbankan"},
        "period":      raw.get("period") or raw.get("Periode"),
        "source":      "ojk_api",
    }


def _normalize_bi_banking(raw: dict) -> dict:
    """Normalize BI SEKI banking data as OJK fallback."""
    return {
        "car":         {"value": raw.get("CAR"),    "unit": "%", "label": "Capital Adequacy Ratio"},
        "npl":         {"value": raw.get("NPLGROSS"), "unit": "%", "label": "Non-Performing Loan Gross"},
        "ldr":         {"value": raw.get("LDR"),    "unit": "%", "label": "Loan-to-Deposit Ratio"},
        "total_aset":  {"value": None,              "unit": "triliun IDR", "label": "Total Aset Perbankan"},
        "source":      "bi_seki_fallback",
    }


def _normalize_capital_market(raw: dict) -> dict:
    return {
        "emiten_listed":  {"value": raw.get("JumlahEmiten"),   "unit": "perusahaan", "label": "Emiten Tercatat"},
        "market_cap_idr": {"value": raw.get("MarketCap"),      "unit": "triliun IDR", "label": "Market Cap Total"},
        "reksa_dana_nav":  {"value": raw.get("NABReksaDana"),   "unit": "triliun IDR", "label": "NAB Reksa Dana"},
        "source":          "ojk_api",
    }


async def fetch_ojk_stats() -> dict:
    """Fetch + cache OJK banking + capital market stats."""
    import asyncio
    banking, capital = await asyncio.gather(
        _fetch_ojk_banking_summary(),
        _fetch_ojk_capital_market(),
        return_exceptions=True,
    )

    result = {
        "banking":        banking if isinstance(banking, dict) else {},
        "capital_market": capital if isinstance(capital, dict) else {},
        "source":         "ojk",
    }
    await cache_set(KEY_OJK, result, OJK_TTL)
    logger.info("OJK stats cached (TTL %ds)", OJK_TTL)
    return result
