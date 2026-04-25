"""
api/routes/stats.py — BPS Indonesia statistics endpoints.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse

from processing.cache import KEY_BPS_NATIONAL, KEY_BPS_PROVINCE, cache_get

router = APIRouter(tags=["stats"])

_CC_BPS = "public, max-age=3600"  # 1h — BPS data refreshes weekly


@router.get("/bps")
async def list_bps_datasets():
    return {
        "datasets": [
            "key_statistics", "unemployment", "ump", "poverty",
            "hdi", "smoking", "divorce", "internet", "fdi",
        ]
    }


@router.get("/bps/national")
async def get_national_summary():
    cached = await cache_get(KEY_BPS_NATIONAL)
    return JSONResponse(
        content=cached["data"] if cached else {},
        headers={"Cache-Control": _CC_BPS},
    )


@router.get("/bps/{dataset}")
async def get_bps_dataset(
    dataset: str,
    province: str = Query(default=None, description="Filter by province name"),
):
    valid = {"key_statistics", "unemployment", "ump", "poverty", "hdi", "smoking", "divorce", "internet", "fdi"}
    if dataset not in valid:
        raise HTTPException(status_code=404, detail=f"Unknown dataset: {dataset}")

    cached = await cache_get(KEY_BPS_PROVINCE.format(dataset=dataset))
    rows   = cached["data"] if cached else []

    if province:
        from ingestion.bps import normalize_province, _detect_province_column
        norm = normalize_province(province).lower()
        prov_col = _detect_province_column(rows)
        if prov_col:
            rows = [r for r in rows if normalize_province(r.get(prov_col, "")).lower() == norm]
        else:
            rows = []

    return JSONResponse(
        content={"dataset": dataset, "rows": rows, "count": len(rows)},
        headers={"Cache-Control": _CC_BPS},
    )


@router.get("/bps/province/{province}")
async def get_province_profile(province: str):
    """All BPS indicators for a specific province across all datasets."""
    from ingestion.bps import query_bps_by_province

    profile = {}
    for dataset in ["unemployment", "ump", "poverty", "hdi", "smoking", "divorce", "internet"]:
        row = query_bps_by_province(dataset, province)
        if row:
            profile[dataset] = row

    if not profile:
        raise HTTPException(status_code=404, detail=f"No data for province: {province}")

    return JSONResponse(
        content={"province": province, "profile": profile},
        headers={"Cache-Control": _CC_BPS},
    )
