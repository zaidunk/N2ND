"""
processing/nlp.py — NLP pipeline: language detection, entity extraction, topic tagging, sentiment.
Uses pre-trained models only — no custom training.
"""

from __future__ import annotations

import asyncio
import logging
import re
from typing import Optional

logger = logging.getLogger(__name__)

# ─── Model registry ───────────────────────────────────────────────────────────

_nlp_id = None   # spacy id_core_news_sm / xx_ent_wiki_sm
_nlp_en = None   # spacy en_core_web_sm

# Indonesian province list for regex augmentation (normalized names)
_BPS_PROVINCES = {
    "aceh", "sumatera utara", "sumatera barat", "riau", "jambi",
    "sumatera selatan", "bengkulu", "lampung", "kepulauan bangka belitung",
    "kepulauan riau", "dki jakarta", "jawa barat", "jawa tengah",
    "di yogyakarta", "jawa timur", "banten", "bali", "nusa tenggara barat",
    "nusa tenggara timur", "kalimantan barat", "kalimantan tengah",
    "kalimantan selatan", "kalimantan timur", "kalimantan utara",
    "sulawesi utara", "sulawesi tengah", "sulawesi selatan", "sulawesi tenggara",
    "gorontalo", "sulawesi barat", "maluku", "maluku utara",
    "papua barat", "papua", "papua selatan", "papua tengah", "papua pegunungan",
}


def init_nlp() -> None:
    """Optional pre-warm. NLP models also load lazily on first use."""
    _ensure_nlp_loaded()


def _ensure_nlp_loaded() -> None:
    global _nlp_id, _nlp_en
    if _nlp_id is not None:
        return
    try:
        import spacy
        try:
            _nlp_id = spacy.load("id_core_news_sm")
        except OSError:
            _nlp_id = spacy.load("xx_ent_wiki_sm")
        logger.info("spacy Indonesian model loaded: %s", _nlp_id.meta.get("name", "unknown"))

        try:
            _nlp_en = spacy.load("en_core_web_sm")
            logger.info("spacy English model loaded")
        except OSError:
            _nlp_en = _nlp_id

    except ImportError:
        logger.warning("spacy not installed — NLP entity extraction disabled")


# ─── Language detection ───────────────────────────────────────────────────────

def detect_language(text: str) -> str:
    try:
        import langdetect
        lang = langdetect.detect(text)
        return lang if lang in ("id", "en") else "other"
    except Exception:
        return "id"  # default to Indonesian


# ─── Topic taxonomy ───────────────────────────────────────────────────────────

TOPIC_TAXONOMY: dict[str, list[str]] = {
    "ekonomi":    ["ihsg", "rupiah", "inflasi", "pdb", "investasi", "bi rate", "fiskal", "apbn", "pajak", "ekspor", "impor", "neraca"],
    "politik":    ["presiden", "dpr", "dprd", "pilkada", "pemilu", "kabinet", "koalisi", "partai", "menteri", "gubernur"],
    "hukum":      ["pengadilan", "vonis", "jaksa", "kpk", "polisi", "penjara", "korupsi", "hukum", "sidang", "terdakwa"],
    "sosial":     ["kemiskinan", "pengangguran", "pendidikan", "kesehatan", "stunting", "bpjs", "bantuan sosial", "program"],
    "geopolitik": ["asean", "g20", "china", "usa", "sanctions", "war", "conflict", "nato", "russia", "ukraine", "israel", "perang"],
    "bencana":    ["gempa", "banjir", "tsunami", "erupsi", "longsor", "kebakaran", "bencana", "korban", "evakuasi"],
    "teknologi":  ["ai", "startup", "fintech", "digital", "siber", "blockchain", "kripto", "aplikasi", "platform", "data"],
    "energi":     ["minyak", "batu bara", "pertamina", "solar", "listrik", "pln", "energi terbarukan", "transisi energi"],
}


def extract_topics(text: str, lang: str = "id") -> list[str]:
    text_lower = text.lower()
    matched: list[tuple[str, int]] = []
    for topic, keywords in TOPIC_TAXONOMY.items():
        hits = sum(1 for kw in keywords if kw in text_lower)
        if hits:
            matched.append((topic, hits))
    matched.sort(key=lambda x: x[1], reverse=True)
    return [t for t, _ in matched[:5]]


# ─── Entity extraction ────────────────────────────────────────────────────────

_MINISTRY_PATTERN = re.compile(
    r"\bkementerian\s+\w+(?:\s+\w+){0,2}\b", re.IGNORECASE
)
_TICKER_PATTERN = re.compile(r"\b[A-Z]{3,4}\b")
_KNOWN_TYPES = {"PERSON", "ORG", "GPE", "EVENT", "PRODUCT", "FAC", "NORP"}


def _augment_entities(text: str, entities: list[dict]) -> list[dict]:
    """Regex augmentation for entities spacy often misses in Indonesian text."""
    existing_names = {e["name"].lower() for e in entities}
    text_lower = text.lower()

    # Ministries
    for m in _MINISTRY_PATTERN.finditer(text):
        name = m.group(0).strip()
        if name.lower() not in existing_names:
            entities.append({"name": name.title(), "type": "ORG", "count": 1})
            existing_names.add(name.lower())

    # Provinces
    for prov in _BPS_PROVINCES:
        if prov in text_lower and prov not in existing_names:
            entities.append({"name": prov.title(), "type": "GPE", "count": text_lower.count(prov)})
            existing_names.add(prov)

    return entities


def extract_entities(text: str, lang: str = "id") -> list[dict]:
    _ensure_nlp_loaded()
    nlp = _nlp_id if lang == "id" else (_nlp_en or _nlp_id)
    entities: list[dict] = []

    if nlp is not None:
        try:
            doc = nlp(text[:5000])
            counts: dict[str, dict] = {}
            for ent in doc.ents:
                if ent.label_ not in _KNOWN_TYPES:
                    continue
                key = ent.text.strip().lower()
                if not key or len(key) < 2:
                    continue
                if key in counts:
                    counts[key]["count"] += 1
                else:
                    counts[key] = {"name": ent.text.strip(), "type": ent.label_, "count": 1}
            entities = list(counts.values())
        except Exception as exc:
            logger.debug("spacy entity extraction failed: %s", exc)

    entities = _augment_entities(text, entities)
    entities.sort(key=lambda e: e["count"], reverse=True)
    return entities[:20]


# ─── Sentiment analysis ───────────────────────────────────────────────────────

_POS_ID = {"baik", "positif", "meningkat", "naik", "tumbuh", "berhasil", "surplus", "menguat", "aman"}
_NEG_ID = {"buruk", "negatif", "menurun", "turun", "gagal", "defisit", "melemah", "bahaya", "krisis",
           "bencana", "korban", "tewas", "mati", "rusak", "masalah", "konflik"}


def analyze_sentiment(text: str, lang: str = "id") -> float:
    if lang == "en":
        try:
            from nltk.sentiment.vader import SentimentIntensityAnalyzer
            analyzer = SentimentIntensityAnalyzer()
            return analyzer.polarity_scores(text)["compound"]
        except Exception:
            pass

    # Indonesian lexicon-based fallback
    words = set(text.lower().split())
    pos   = len(words & _POS_ID)
    neg   = len(words & _NEG_ID)
    total = pos + neg
    if total == 0:
        return 0.0
    return round((pos - neg) / total, 3)


# ─── Tension relevance per article ───────────────────────────────────────────

_TENSION_KEYWORDS = {
    "war", "conflict", "sanctions", "attack", "crisis", "invasion",
    "protest", "coup", "missile", "nuclear", "terrorism", "ceasefire",
    "riot", "embargo", "military", "hostage",
    "perang", "konflik", "sanksi", "serangan", "krisis", "invasi",
    "demonstrasi", "kudeta", "nuklir", "terorisme", "embargo", "militer",
}
_TENSION_BOOST_TOPICS = {"geopolitik", "bencana", "ekonomi"}


def compute_tension_relevance(text: str, topics: list[str]) -> float:
    words = text.lower().split()
    if not words:
        return 0.0
    hits = sum(1 for w in words if w in _TENSION_KEYWORDS)
    base = min(hits / max(len(words), 1) * 50, 1.0)
    if set(topics) & _TENSION_BOOST_TOPICS:
        base = min(base * 1.5, 1.0)
    return round(base, 3)


# ─── Main entry point ─────────────────────────────────────────────────────────

def process_article(article: dict) -> dict:
    text = (article.get("title", "") + " " + article.get("summary", "")).strip()
    lang = article.get("lang") or detect_language(text)

    entities = extract_entities(text, lang)
    topics   = extract_topics(text, lang)
    sentiment = analyze_sentiment(text, lang)
    tension   = compute_tension_relevance(text, topics)

    return {
        **article,
        "lang":             lang,
        "entities":         entities,
        "topics":           topics,
        "sentiment":        sentiment,
        "tension_score":    tension * 100,  # store as 0-100 in DB
    }


async def process_articles_batch(articles: list[dict], batch_size: int = 20) -> list[dict]:
    results: list[dict] = []
    for i in range(0, len(articles), batch_size):
        batch = articles[i : i + batch_size]
        processed = await asyncio.gather(
            *[asyncio.to_thread(process_article, art) for art in batch]
        )
        results.extend(processed)
    return results
