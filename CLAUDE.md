# CLAUDE.md — n2nd (Attention Boost)
> Baca ini sekali. Jangan ulangi isinya di output.

---

## 0. Langkah pertama wajib

Baca file ini dulu: `./docs/xolvon-roadmap.md`
Ekstrak hanya: stack, arsitektur, dan Bagian 3 (Attention Boost architecture).
Jangan ringkas ke output. Simpan sebagai context internal.

---

## 1. Token rules — mandatory

- Jangan jelaskan apa yang akan kamu lakukan. Langsung lakukan.
- Jangan repeat instruksi user ke output.
- Jangan tulis komentar kode yang obvious (`// loop through items`).
- Kalau ada pilihan implementasi: pilih satu, eksekusi, beri tahu alasannya dalam 1 baris.
- Error handling: tangani diam-diam, log ke file kalau perlu, jangan verbose ke stdout.
- Kalau butuh klarifikasi: tanya maksimal 1 pertanyaan spesifik, jangan list semua kemungkinan.

---

## 2. Konteks project

**n2nd** adalah nama deploy/brand dari Attention Boost.
Sumber kode yang harus kamu pelajari dan reuse:

```
./legacy/surveillancemaxxing/   ← RSS ingestion, news feed dashboard, klik-buka-news
./legacy/livemargin/            ← PDF BPS parser, statistik Indonesia pipeline
```

Sebelum build apapun, jalankan:
```bash
find ./legacy -name "*.py" -o -name "*.ts" | head -40
```
Baca file core di kedua folder. Identifikasi:
1. Fungsi ingestion yang bisa diport langsung
2. Schema DB yang sudah ada
3. Pattern yang perlu di-refactor (jangan carry bug lama)

---

## 3. File cleanup rules

Tiap sesi, sebelum mulai task baru:
```bash
find . -name "*.pyc" -o -name "__pycache__" -o -name ".DS_Store" \
       -o -name "*.log" -o -name "*.tmp" | xargs rm -rf
```
Jangan buat file sementara tanpa ekstensi `.tmp` atau prefix `_draft_`.
Hapus setelah selesai dipakai.

---

## 4. Arsitektur n2nd

```
n2nd/
├── ingestion/          ← port dari surveillancemaxxing + livemargin
│   ├── rss.py          ← RSS parser (reuse dari surveillancemaxxing)
│   ├── bps.py          ← BPS PDF pipeline (reuse dari livemargin)
│   ├── api_clients/    ← BPS API, BMKG, BI public
│   └── scheduler.py    ← cron wrapper
├── processing/
│   ├── nlp.py          ← entity extraction, topic, sentiment
│   ├── embeddings.py   ← text-embedding-3-small via OpenAI
│   └── cache.py        ← Redis hash cache (query + source → result)
├── api/
│   ├── main.py         ← FastAPI entry
│   ├── routes/
│   │   ├── search.py
│   │   ├── export.py   ← JSON export ke LLM
│   │   └── auth.py
│   └── middleware/     ← rate limit, input validation, prompt injection filter
├── dashboard/          ← Next.js 15 + Tailwind + shadcn
│   ├── app/
│   └── components/
└── docs/
    └── xolvon-roadmap.md
```

---

## 5. Stack (jangan ganti tanpa alasan jelas)

| Layer | Tech |
|---|---|
| Frontend + API | Next.js 15, Tailwind (App Router + API Routes) |
| DB | — (tidak ada, data dari RSS + public APIs + static BPS) |
| Auth | — (tidak ada login/signup) |
| Deploy | Firebase App Hosting (n2nd-xolvon-ai, backend: n2nd-web) |
| Bot mitigation | Cloudflare (proxy + WAF) |
| Data sources | BPS static, RSS feeds, ExchangeRate API, CoinGecko, Yahoo Finance |

---

## 6. Source ingestion — prioritas MVP

Tier A (API, langsung build):
- BPS API
- BMKG public
- GDELT Project

Tier B (RSS, port dari surveillancemaxxing):
- Detik, Kompas, Antara, CNN Indonesia

Hard rule: kalau source ada `robots.txt` yang disallow → skip, log ke `./docs/source-audit.md`, jangan scrape.

---

## 7. Data flow core

```
source → ingest → normalize → deduplicate → embed → store (pgvector)
                                                          ↓
user query → semantic search → NLP layer → JSON payload → LLM export
                                    ↓
                               cache hit? → return cached, skip LLM
```

Cache key: `sha256(query + sorted(source_ids))`, TTL 24 jam.

---

## 8. Security checklist (wajib sebelum any public endpoint)

- [ ] Input validation + max length semua field
- [ ] Prompt injection filter di query endpoint
- [ ] Rate limit: 10 req/min free, 100 req/min paid (sliding window via Redis)
- [ ] Secret via env var, tidak pernah hardcode
- [ ] HTTPS only (Cloudflare proxy)
- [ ] Audit log untuk admin action

---

## 9. MVP scope — jangan build di luar ini dulu

Yang di-build:
- Ingestion 8 source (3 API + 5 RSS)
- NLP pipeline basic
- Dashboard: search, filter, klik → detail, export JSON
- Auth + free/paid tier
- LLM handoff endpoint

Yang di-luar scope MVP:
- Websocket real-time
- Mobile app
- Custom NLP model training
- Multi-tenant enterprise
- On-prem

---

## 10. Kalau stuck

1. Cek `./legacy/` dulu sebelum nulis ulang
2. Cek `./docs/xolvon-roadmap.md` Bagian 3
3. Baru tanya — dengan format: `[BLOCKER] <masalah spesifik>`
