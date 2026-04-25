# Source Audit Log — n2nd (Attention Boost)

Hard rule: jika source ada `robots.txt` yang disallow fetch/rss → skip dan log di sini.
API sources yang tidak punya robots.txt restriction langsung approved.

---

## Approved Sources

| Source | Type | URL | Robots Status | ToS | Auth Required | Notes |
|--------|------|-----|---------------|-----|---------------|-------|
| Antara | RSS | `antaranews.com` | ✅ Allowed | Public | No | Tier A, Indonesian official news |
| Kompas | RSS | `kompas.com` | ✅ Allowed | Public | No | Tier A |
| Detik | RSS | `detik.com` | ✅ Allowed | Public | No | Tier B |
| CNN Indonesia | RSS | `cnnindonesia.com` | ✅ Allowed | Public | No | Tier B |
| Tempo | RSS | `tempo.co` | ✅ Allowed | Public | No | Tier B |
| CNBC Indonesia | RSS | `cnbcindonesia.com` | ✅ Allowed | Public | No | Tier B |
| Reuters | RSS | `reuters.com` | ✅ Allowed | Public | No | Tier A, Global |
| BBC News | RSS | `bbc.co.uk` | ✅ Allowed | Public | No | Tier A, Global |
| Al Jazeera | RSS | `aljazeera.com` | ✅ Allowed | Public | No | Tier B, Global |
| BMKG | API | `data.bmkg.go.id` | ✅ N/A | Public Govt | No | Official Indonesian weather/earthquake data |
| GDELT Project | API | `api.gdeltproject.org` | ✅ N/A | CC0 Public Domain | No | Global news events, free |
| BPS Indonesia | CSV | Static files | ✅ N/A | Public Govt | No | 9 datasets loaded from LIVEMARGIN/ |
| Open ER API | API | `open.er-api.com` | ✅ N/A | Free tier | No | Forex primary source |
| Frankfurter | API | `api.frankfurter.app` | ✅ N/A | Open Source | No | Forex fallback |
| CoinGecko | API | `api.coingecko.com` | ✅ N/A | Free tier | No | Crypto prices |
| Alternative.me | API | `api.alternative.me` | ✅ N/A | Free | No | Fear & Greed Index |

---

## Rejected / Skipped Sources

| Source | Reason | Date | Alternative |
|--------|--------|------|-------------|
| Google Trends | ToS forbids scraping | 2026-04-25 | Not implemented (out of scope MVP) |
| Twitter/X | Rate limit + legal risk | 2026-04-25 | Official API only if needed |
| Instagram | Meta ToS | 2026-04-25 | Skip entirely |
| TikTok | ByteDance ToS | 2026-04-25 | Skip entirely |

---

## Pending Audit

Sources to audit before adding:

- [ ] Bloomberg Indonesia — check RSS feed ToS
- [ ] Reuters Indonesia specific feed — separate from global
- [ ] OJK statistik — check API availability
- [ ] IDX public data — check API structure
- [ ] Bank Indonesia SEKI — check API availability for BI Rate live fetch

---

## Audit Process

```bash
# Run audit for a new source:
python -c "
import asyncio
from ingestion.robots import audit_source
result = asyncio.run(audit_source('https://example.com/rss'))
print(result)
"
```

If `approved: true` → add to `APPROVED_SOURCES` in `ingestion/robots.py` and this table.
