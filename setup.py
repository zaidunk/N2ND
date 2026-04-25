"""
setup.py — One-time setup for surveilencemaxxing.
Installs requirements, creates empty cache files,
runs initial diagnostics, and opens the browser.
"""

import subprocess
import sys
import os
import json
import webbrowser
import time
from pathlib import Path

BASE_DIR = Path(__file__).parent
CACHE_DIR = BASE_DIR / "cache"

print("=" * 50)
print("  SURVEILENCEMAXXING — First-Time Setup")
print("=" * 50)
print()

# ── 1. Install requirements ────────────────────────────────
print("[1/4] Installing Python requirements...")
result = subprocess.run(
    [sys.executable, "-m", "pip", "install", "-r", "requirements.txt", "-q"],
    capture_output=False
)
if result.returncode != 0:
    print("  ⚠  pip install returned a non-zero exit code. Check errors above.")
else:
    print("  ✅  Requirements installed.")
print()

# ── 2. Create cache directory and empty files ──────────────
print("[2/4] Creating cache directory and empty cache files...")
CACHE_DIR.mkdir(parents=True, exist_ok=True)

CACHE_FILES = {
    "forex_cache.json":      {"data": {}, "updated_at": None},
    "crypto_cache.json":     {"data": {}, "updated_at": None},
    "trends_cache.json":     {"data": {}, "updated_at": None},
    "news_cache.json":       {"data": {}, "updated_at": None},
    "indicators_cache.json": {"data": {}, "updated_at": None},
    "diagnostics_log.json":  [],
}

for fname, empty in CACHE_FILES.items():
    fpath = CACHE_DIR / fname
    if not fpath.exists():
        with open(fpath, "w") as f:
            json.dump(empty, f)
        print(f"  ✅  Created {fname}")
    else:
        print(f"  ⏩  {fname} already exists, skipping.")
print()

# ── 3. Run initial diagnostics ─────────────────────────────
print("[3/4] Running initial health checks (this may take ~30s)...")
try:
    sys.path.insert(0, str(BASE_DIR))
    from diagnostics import check_all_modules, save_diagnostics
    results = check_all_modules()
    save_diagnostics(results)

    ok_count    = sum(1 for r in results.values() if r.get("status") == "OK")
    warn_count  = sum(1 for r in results.values() if r.get("status") == "WARNING")
    error_count = sum(1 for r in results.values() if r.get("status") == "ERROR")

    print(f"\n  Health Check Results:")
    print(f"  {'Module':<18} {'Status':<10} {'Response'}")
    print(f"  {'-'*45}")
    for mod, res in results.items():
        status = res.get("status", "?")
        icon   = {"OK":"✅","WARNING":"⚠","ERROR":"❌"}.get(status, "?")
        ms     = f"{res.get('response_time_ms','?')}ms"
        err    = f" — {res.get('error_message','')[:40]}" if res.get('error_message') else ""
        print(f"  {icon} {mod:<16} {status:<10} {ms}{err}")

    print(f"\n  Summary: {ok_count} OK  |  {warn_count} WARNINGS  |  {error_count} ERRORS")
except Exception as e:
    print(f"  ⚠  Diagnostics failed to run: {e}")
    print("     This is normal on first run if dependencies just installed.")
print()

# ── 4. Open browser ────────────────────────────────────────
print("[4/4] Setup complete! Starting dashboard...")
print()
print("  ➡  http://localhost:5050")
print()
print("  Run with:  python app.py")
print("  Windows:   run.bat")
print("  Linux/Mac: bash run.sh")
print()
print("=" * 50)
