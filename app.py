"""
app.py — Main Flask application for surveilencemaxxing dashboard.
All routes, JSON API endpoints, and startup logic.
"""

import logging
import os
from datetime import datetime, timezone
from typing import Any

from flask import Flask, render_template, jsonify, request, redirect, url_for

from config import HOST, PORT, DEBUG, APP_NAME
from cache_utils import initialize_cache_files, load_cache, cache_age_display
from config import CACHE_FILES

# ─── Logging Setup ────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

# ─── App Init ─────────────────────────────────────────────────────────────────
app = Flask(__name__)
app.config["SECRET_KEY"] = "surveilencemaxxing-local-key"
app.config["TEMPLATES_AUTO_RELOAD"] = True

# ─── Template Helpers ────────────────────────────────────────────────────────

@app.template_filter("time_ago")
def time_ago_filter(iso_str):
    from modules.news import time_ago
    return time_ago(iso_str or "")

@app.template_filter("format_change")
def format_change_filter(value):
    if value is None:
        return "N/A"
    sign = "+" if value >= 0 else ""
    return f"{sign}{value:.2f}%"

@app.context_processor
def inject_globals():
    from diagnostics import get_system_health_badge
    badge = "UNKNOWN"
    try:
        badge = get_system_health_badge()
    except Exception:
        pass

    # Determine last updated from newest cache
    ages = []
    for key, fname in CACHE_FILES.items():
        if key == "diagnostics":
            continue
        c = load_cache(fname)
        age = c.get("age_minutes")
        if age is not None:
            ages.append(age)

    last_updated = f"{min(ages)}m ago" if ages else "Never"

    return {
        "app_name": APP_NAME,
        "health_badge": badge,
        "last_updated": last_updated,
        "current_year": datetime.now().year,
    }


# ─── Main Routes ──────────────────────────────────────────────────────────────

@app.route("/")
def dashboard():
    try:
        from modules.forex import get_all_pairs
        from modules.crypto import get_crypto_data, format_change
        from modules.indicators import get_indicators_data
        from modules.news import get_latest_headlines
        from modules.trends import get_trends_data

        pairs = get_all_pairs()
        crypto = get_crypto_data()
        indicators = get_indicators_data()
        headlines = get_latest_headlines(10)
        trends = get_trends_data()
        daily_trends = trends.get("_daily", [])

        # Get featured pair and coin for hero cards
        usd_idr = pairs.get("USD_IDR", {})
        btc = crypto.get("bitcoin", {})
        fear_greed = indicators.get("fear_greed", {})

        return render_template(
            "dashboard.html",
            usd_idr=usd_idr,
            btc=btc,
            fear_greed=fear_greed,
            headlines=headlines,
            daily_trends=daily_trends,
            trends=trends,
            pairs=pairs,
            crypto=crypto,
            indicators=indicators,
            format_change=format_change,
        )
    except Exception as e:
        logger.error(f"Dashboard error: {e}")
        return render_template("dashboard.html", error=str(e))


@app.route("/forex")
def forex_page():
    from modules.forex import get_all_pairs
    pairs = get_all_pairs()
    cached = load_cache(CACHE_FILES["forex"])
    return render_template("forex.html", pairs=pairs, cached=cached)


@app.route("/forex/data")
def forex_data():
    """JSON API for Chart.js — returns historical data for a pair."""
    from modules.forex import fetch_historical_rates, get_timeframe_days, get_all_pairs
    pair = request.args.get("pair", "USD_IDR")
    timeframe = request.args.get("timeframe", "7D")
    days = get_timeframe_days(timeframe)
    history = fetch_historical_rates(pair, days)
    pairs_data = get_all_pairs()
    return jsonify({
        "pair": pair,
        "timeframe": timeframe,
        "history": history,
        "current": pairs_data.get(pair, {}),
    })


@app.route("/crypto")
def crypto_page():
    from modules.crypto import get_crypto_data, format_change
    crypto = get_crypto_data()
    cached = load_cache(CACHE_FILES["crypto"])
    return render_template("crypto.html", crypto=crypto, cached=cached, format_change=format_change)


@app.route("/crypto/data")
def crypto_data():
    """JSON API for crypto chart data."""
    from modules.crypto import fetch_crypto_chart, get_crypto_data
    coin = request.args.get("coin", "bitcoin")
    currency = request.args.get("currency", "usd")
    days = int(request.args.get("days", 7))
    chart = fetch_crypto_chart(coin, currency, days)
    return jsonify({"coin": coin, "currency": currency, "days": days, "prices": chart})


@app.route("/trends")
def trends_page():
    from modules.trends import get_trends_data
    trends = get_trends_data()
    cached = load_cache(CACHE_FILES["trends"])
    return render_template("trends.html", trends=trends, cached=cached)


@app.route("/content-ideas")
def content_ideas_page():
    from modules.content_ideas import get_ideas_for_category, get_all_categories
    categories = get_all_categories()
    
    selected_category = request.args.get("category")
    if selected_category not in categories and categories:
        selected_category = categories[0]
        
    ideas = get_ideas_for_category(selected_category) if selected_category else []
    
    return render_template(
        "content_ideas.html", 
        categories=categories, 
        selected_category=selected_category, 
        ideas=ideas
    )


@app.route("/news")
def news_page():
    from modules.news import get_news_data, time_ago
    source = request.args.get("source", "all")
    cat_filter = request.args.get("cat", "")
    data = get_news_data(source)
    cached = load_cache(CACHE_FILES["news"])
    return render_template(
        "news.html",
        news_data=data,
        source=source,
        cat_filter=cat_filter,
        cached=cached,
        time_ago=time_ago,
    )


@app.route("/indicators")
def indicators_page():
    from modules.indicators import get_indicators_data
    indicators = get_indicators_data()
    cached = load_cache(CACHE_FILES["indicators"])
    return render_template("indicators.html", indicators=indicators, cached=cached)


@app.route("/diagnostics")
def diagnostics_page():
    from diagnostics import check_all_modules, get_diagnostics_history, get_latest_diagnostics, save_diagnostics
    run_now = request.args.get("run", "0") == "1"
    if run_now:
        results = check_all_modules()
        save_diagnostics(results)
    else:
        results = get_latest_diagnostics()
    history = get_diagnostics_history()
    return render_template("diagnostics.html", results=results, history=history)


# ─── JSON API Endpoints ───────────────────────────────────────────────────────

@app.route("/api/health")
def api_health():
    from diagnostics import get_system_health_badge, get_latest_diagnostics
    badge = get_system_health_badge()
    results = get_latest_diagnostics()
    return jsonify({"badge": badge, "results": results})


@app.route("/api/refresh/<module>")
def api_refresh(module: str):
    """Force refresh a specific module's cache."""
    allowed = {"forex", "crypto", "trends", "news", "indicators", "diagnostics"}
    if module not in allowed:
        return jsonify({"error": "Unknown module"}), 400
    try:
        if module == "forex":
            from modules.forex import fetch_latest_rates
            fetch_latest_rates("USD"); fetch_latest_rates("EUR"); fetch_latest_rates("CNY")
        elif module == "crypto":
            from modules.crypto import fetch_crypto_prices
            fetch_crypto_prices()
        elif module == "trends":
            from modules.trends import get_all_trends
            get_all_trends()
        elif module == "news":
            from modules.news import fetch_all_news
            fetch_all_news("all")
        elif module == "indicators":
            from modules.indicators import get_all_indicators
            get_all_indicators()
        elif module == "diagnostics":
            from diagnostics import check_all_modules, save_diagnostics
            results = check_all_modules()
            save_diagnostics(results)
        return jsonify({"status": "ok", "module": module})
    except Exception as e:
        logger.error(f"api_refresh({module}) failed: {e}")
        return jsonify({"status": "error", "module": module, "error": str(e)}), 500


@app.route("/api/diagnostics/export")
def api_diagnostics_export():
    from diagnostics import get_diagnostics_history
    return jsonify(get_diagnostics_history())


# ─── Error Handlers ───────────────────────────────────────────────────────────

@app.errorhandler(404)
def not_found(e):
    return render_template("error.html", code=404, title="Not Found", message="The page you're looking for doesn't exist."), 404

@app.errorhandler(500)
def server_error(e):
    return render_template("error.html", code=500, title="Server Error", message=str(e)), 500


# ─── Startup ──────────────────────────────────────────────────────────────────

def startup():
    """Initialize cache files and start scheduler."""
    logger.info(f"Starting {APP_NAME}...")
    initialize_cache_files()
    from scheduler import start_scheduler
    start_scheduler()
    logger.info(f"Dashboard available at http://{HOST}:{PORT}")


if __name__ == "__main__":
    startup()
    app.run(host=HOST, port=PORT, debug=DEBUG, use_reloader=False)
