# Roadmap Konkret: Xolvon Group
*Working document — versi 1.0*

---

## Bagian 1 — Prioritisasi Produk

### Resource allocation (founder time + capital)
**60% Attention Boost · 30% cafemargin.id · 10% sisanya**

Logikanya: cafemargin generate cash flow yang bisa fund Attention Boost. Attention Boost adalah scaling bet dengan TAM paling besar dan defensibility paling tinggi (via data partnership). Sisanya jangan dimatiin tapi jangan dijadiin distraction.

---

### Tier 1 — Active Focus

**cafemargin.id (Revenue Engine)**
- **Peran**: cash flow generator + proof of concept "data analytics murah works"
- **Target 6 bulan**: ARR IDR 300–500 juta
- **Milestone**: 20 paying café di bulan 3, 50 di bulan 6
- **Pricing tier saran**:
  - Starter IDR 99k/bulan (dashboard basic)
  - Pro IDR 299k/bulan (analytics + alert)
  - Consult IDR 1.5jt/bulan (Pro + monthly call)
- **Risk**: kalau founder pegang sales sendiri → bottleneck. Plan untuk part-time SDR atau partner channel di bulan 4.

**Attention Boost (Scaling Bet)**
- **Peran**: produk flagship, target raise pre-seed
- **Target 6 bulan**: MVP launch bulan 4, 1000 free user + 50 paid di bulan 6
- **Milestone**:
  - Bulan 1: ingestion 10–15 source jalan
  - Bulan 2: NLP pipeline basic (entity + topic)
  - Bulan 3: dashboard + JSON export ke LLM
  - Bulan 4: public launch + paid tier
- **North star metric**: query yang berakhir di-export ke LLM (proxy "ada value yang dipakai")

---

### Tier 2 — Maintenance / Opportunistic

**selangkahmulai**
- Mode: organic, max 4 jam/minggu
- Boleh terus jualan modul, tapi **no new product development**
- Strategic value: jadiin top-of-funnel untuk Attention Boost (audience overlap = orang yang belajar AI/data)

**xolvon.ai (B2B Services)**
- Mode: **inbound only**, accept hanya deal >IDR 50jt
- Justifikasi: cash flow tambahan, tapi services tidak scalable — jangan jadi distraction
- **Mandatory**: brief screening sebelum accept (lihat Bagian 2)

---

### Tier 3 — Fold or Rebrand

**Surveillance Maxing → fold ke Attention Boost**
- Jadikan feature di Attention Boost (rename: "News Pulse" atau sejenisnya)
- Nama "Surveillance" itu PR/legal red flag, terutama untuk pitch B2B/gov
- Tidak ada brand effort terpisah

**lifemargin / livemargin → internal data sources**
- Jadikan data pipeline untuk Attention Boost dan cafemargin (consumer behavior layer)
- Bukan produk standalone, no separate brand

---

### Decision points yang harus difinalisasi minggu ini
1. **lifemargin vs livemargin** — itu dua produk berbeda atau typo? Klarifikasi dulu sebelum brand effort apapun.
2. **Co-founder/team** — solo founder dengan 3 produk aktif = burnout risk dalam 6 bulan. Cari technical co-founder atau senior contractor untuk Attention Boost.
3. **Runway** — berapa bulan bisa survive tanpa revenue? Kalau <6 bulan, gas cafemargin sales sebelum start Attention Boost serius.

---

## Bagian 2 — Legal Roadmap Konkret

### Bulan 0–3: Foundation

**Engage legal counsel part-time**
- Budget: IDR 3–5 juta/bulan retainer
- Cari yang punya track record startup digital + UU PDP
- Alternative kalau budget ketat: subscription Hukumonline Pro atau LegalHub

**Trademark filing di DJKI**
| Mark | Kelas | Estimasi cost |
|---|---|---|
| Xolvon | 9, 35, 42 | ~IDR 6 juta |
| cafemargin | 9, 35, 42 | ~IDR 6 juta |
| Attention Boost | 9, 42 | ~IDR 4 juta (cek availability dulu) |

Proses ~6–12 bulan. File sebelum public launch besar.

**Draft & publish dokumen wajib**
- Privacy Policy (compliant UU PDP 27/2022)
- Terms of Service per produk
- Cookie Policy
- Disclaimer Attention Boost: "informational only, not financial/legal/medical advice"

**xolvon.ai compliance framework (ini paling urgent)**

Policy untuk clipper / UGC creator — wajib ada di kontrak:
- Mandatory disclosure tag (#ad, #sponsored, #partnership) di semua post
- No fake account / sock puppet / bot amplification
- No hate speech, hoax, atau defamasi terhadap individu spesifik
- Audit trail: semua post harus bisa di-tracking ke creator + brief

Brief screening checklist sebelum accept klien:
- [ ] Bukan attack individu spesifik tanpa basis fakta
- [ ] Bukan promosi produk illegal/scam/MLM gelap
- [ ] Kalau political campaign: harus full transparency + lapor sesuai UU Pemilu
- [ ] Klien sign disclaimer bahwa narrative-nya bertanggung jawab

---

### Bulan 3–6: Compliance Operations

**UU PDP 27/2022 compliance**
- Data inventory: list semua data point yang dikumpulkan per produk (apa, kenapa, berapa lama disimpan)
- Appoint DPO (di awal bisa double-hat dari founder, tapi declare publicly)
- Privacy by design: minimize data collection, opt-in consent untuk non-essential
- Data Processing Agreement (DPA) dengan vendor: Supabase, OpenAI, Anthropic, Google, dll

**Standard contract templates**
- Clipper / UGC creator agreement
- B2B service agreement (xolvon.ai dan cafemargin Consult)
- Mutual NDA
- Data sharing agreement (untuk partnership)

**Attention Boost source audit (per source, dokumentasikan)**
- Sumber + owner
- Method (API / RSS / scraping)
- ToS compliance status
- Attribution requirement
- License (CC, public domain, proprietary)

Hard rule: **kalau ToS forbid scraping, jangan scrape**. Cari API alternative atau license.

---

### Bulan 6–12: Scaling Readiness

**Corporate structure**
- Konversi PT Perorangan → PT biasa
  - Trigger: saat raise pre-seed (investor wajib minta)
  - Butuh minimum 2 pemegang saham
  - Cost: IDR 5–10 juta legal + notaris
  - Timeline: 4–6 minggu
- Cap table: ESOP pool 10–15% sebelum raise

**Security & certification**
- Basic pentest sebelum public launch besar (IDR 15–25 juta untuk web app scope)
- Mulai prep ISMS framework (ISO 27001 lite) — target apply tahun ke-2 untuk deal gov/enterprise

**Data partnership moat**
- MoU template siap
- Target pre-seed: 1 partnership data eksklusif dengan lembaga publik
- Approach: via accelerator atau warm intro, bukan cold email

---

### Budget total legal Year 1
| Item | Range |
|---|---|
| Counsel retainer (12 bln) | IDR 36–60 juta |
| Trademark (3–4 marks) | IDR 16–20 juta |
| PT conversion | IDR 5–10 juta |
| Pentest | IDR 15–25 juta |
| Misc (notaris, drafting) | IDR 5–10 juta |
| **Total** | **IDR 77–125 juta/tahun** |

---

### Risiko spesifik & mitigasi
| Risiko | Mitigasi konkret |
|---|---|
| Astroturfing accusation (xolvon.ai) | Mandatory disclosure policy + brief screening + audit trail |
| Scraping ToS violation | API-first, source audit per onboarding, fallback documented |
| Misinformation di Attention Boost | Source attribution wajib, no editorial commentary, disclaimer prominent |
| Data breach UU PDP | Encryption at rest, access control, incident response plan |
| Trademark squatting | File trademark sebelum launch besar |
| Big-fish lawsuit (T di SWOT) | Legal counsel review sebelum launch fitur kontroversial |

---

## Bagian 3 — Arsitektur Teknis Attention Boost

### Prinsip desain
1. **Cost-conscious** — target <IDR 5 juta/bulan infra di MVP, scale linear
2. **Modular** — tiap layer bisa swap tanpa rewrite (data source, NLP, LLM provider)
3. **Cache aggressively** — LLM call adalah cost driver utama
4. **Legal-by-default** — ToS check di ingestion, attribution wajib di output

---

### Diagram arsitektur

```
┌─────────────────────────────────────────────────────────┐
│              FRONTEND (Next.js + Tailwind)              │
│  Dashboard | Filter/Sort UI | Export to LLM | Auth UI   │
└──────────────────────┬──────────────────────────────────┘
                       │ REST / SSE
┌──────────────────────▼──────────────────────────────────┐
│           API LAYER (FastAPI / Hono)                    │
│  Auth | Rate Limit | Query Router | LLM Orchestration   │
└──────┬─────────────────┬──────────────────┬─────────────┘
       │                 │                  │
┌──────▼──────┐  ┌───────▼────────┐  ┌──────▼──────────┐
│  STORAGE    │  │  PROCESSING    │  │  LLM PROVIDERS  │
│  Postgres   │  │  NLP Pipeline  │  │  OpenAI/Claude/ │
│  pgvector   │  │  Reasoning Eng │  │  Gemini         │
│  Redis      │  │                │  │  (abstracted)   │
│  R2/S3      │  └────────────────┘  └─────────────────┘
└─────────────┘
       ▲
       │
┌──────┴──────────────────────────────────────────────────┐
│           INGESTION LAYER (cron / Airflow)              │
│  RSS Parsers | API Clients | Scrapers (last resort)     │
└─────────────────────────────────────────────────────────┘
```

---

### Stack recommendation (MVP)

**Frontend**: Next.js 15 + Tailwind + shadcn/ui
- Vercel free tier untuk MVP
- Move ke Cloudflare Pages saat scale (lebih murah egress)

**Backend**: FastAPI (Python) — lebih natural untuk NLP/data work
- Deploy: Railway atau Fly.io ($5–20/bulan MVP)

**Database**:
- Primary: **Supabase** (managed Postgres, generous free tier, built-in auth + RLS)
- Vector: **pgvector** extension di Supabase (no separate DB)
- Cache: **Upstash Redis** (serverless, free tier 10k commands/day)
- Object storage: **Cloudflare R2** (free egress, $0.015/GB)

**Ingestion**:
- RSS: feedparser
- Scheduler: Railway cron, atau GitHub Actions cron (gratis untuk light load)
- Scale-up: Apache Airflow self-hosted atau Prefect Cloud

**NLP pipeline**:
- Language detection: lingua-py
- Entity extraction: spaCy + xx_ent_wiki_sm (multilingual) atau IndoBERT-base via HuggingFace
- Topic classification: zero-shot via gpt-4o-mini ($0.15/1M input)
- Summarization: gpt-4o-mini atau Gemini Flash
- Embedding: text-embedding-3-small ($0.02/1M tokens)

**LLM layer**:
- Abstract via LiteLLM atau custom adapter
- Pre-reasoning: gpt-4o-mini (cheap, fast)
- Final reasoning: user choice (GPT-4o, Claude Sonnet, Gemini Pro)
- **Cache**: hash query+sources, cache 24 jam di Redis. Target hit rate >60%.

**Auth**: Supabase Auth (built-in, free tier cukup untuk MVP)
**Monitoring**: Sentry (free) + PostHog (free analytics)
**CI/CD**: GitHub Actions

---

### Estimasi cost infrastructure (MVP: 1000 free + 100 paid user)

| Komponen | Cost/bulan |
|---|---|
| Vercel / Pages | $0–20 |
| Railway (API) | $20–50 |
| Supabase Pro | $25 |
| Upstash Redis | $0–10 |
| Cloudflare R2 | $5–15 |
| Sentry / PostHog | $0 |
| Domain / email | $5 |
| **Subtotal infra** | **~$55–125 (~IDR 900k–2jt)** |
| LLM API (estimate) | $200–500 (~IDR 3.2–8jt) |
| **TOTAL** | **~IDR 4–10 juta/bulan** |

LLM cost adalah variable utama. Cache hit rate 70% bisa drop cost 60%+.

---

### Data source strategy (MVP: 10–15 source)

**Tier A — Public API (utama, paling aman legal)**
- BPS API (statistik resmi)
- Bank Indonesia public data
- OJK statistik
- IDX public data
- BMKG (cuaca, gempa)
- GDELT Project (global news, free, well-structured)

**Tier B — RSS Feeds**
- Detik, Kompas, Tempo, CNN Indonesia, Antara
- Reuters Indonesia, Bloomberg Indonesia (cek lisensi)
- Cek robots.txt + ToS satu per satu, log ke source audit doc

**Tier C — Authorized Scrape (last resort)**
- Hanya kalau Tier A & B tidak cukup
- Playwright + rotating proxy
- Respect robots.txt + rate limit

**Yang harus DIHINDARI di MVP**
- Google Trends scraping → ToS violation. Pakai SerpAPI atau pytrends dengan rate limit ketat.
- Twitter/X scraping → rate limit ekstrem + legal risk. Official API saja.
- Instagram/TikTok content → jangan, bisa kena Meta/ByteDance lawsuit.

---

### MVP timeline (4 bulan)

**Bulan 1 — Ingestion + storage**
- 5 source RSS, 3 source API
- Supabase setup, schema design
- Basic dedup + normalization

**Bulan 2 — NLP pipeline**
- Entity extraction (Indonesian + English)
- Topic clustering
- Vector embedding + semantic search

**Bulan 3 — User-facing layer**
- Dashboard with filter/sort
- Keyword click → fetch related items
- JSON export builder
- Auth + free tier (5 query/day)

**Bulan 4 — Launch + iterate**
- Public launch (waitlist → open)
- Paid tier (IDR 99k/bulan untuk 100 query/day)
- Marketing video production
- Lite version untuk SEO play

---

### Security checklist (sebelum public launch)
- [ ] HTTPS only via Cloudflare
- [ ] Rate limit per IP + per user (sliding window)
- [ ] Input validation + prompt injection filter
- [ ] Secret management (Doppler atau Railway env vars)
- [ ] DB backup harian (Supabase auto)
- [ ] Audit log untuk admin action
- [ ] CSP headers
- [ ] Dependabot enabled
- [ ] Pentest report clean

---

### Sengaja DI-LUAR scope MVP
- Real-time websocket → polling dulu
- Mobile native app → web responsive cukup
- Multi-tenant enterprise → single tenant dulu
- On-prem deployment → cloud-only
- Custom NLP model training → pakai pre-trained

---

## Bagian 4 — 90-Day Execution Sprint

Focus: week-by-week execution plan. Asumsi start = Week 1 Senin. Setiap hari alokasi realistic untuk founder tunggal: 40% build, 30% sell, 20% learn, 10% admin.

### Week 1–2: Foundation

**cafemargin**
- Finalisasi pricing tier + landing page copy
- Sales target list: 50 café (Bandung + Jakarta), manual dari Google Maps + IG
- Demo script + deck 8 slide
- Setup payment gateway (Midtrans atau Xendit)

**Attention Boost**
- Source audit: 15 target source, status ToS masing-masing, log di spreadsheet
- Infrastructure bootstrap: domain, Supabase project, GitHub repo, Vercel deploy hello world
- Tech decision finalized: stack dari Bagian 3

**Legal**
- Engage counsel part-time (kalau belum)
- Draft: privacy policy, ToS, clipper contract template xolvon.ai
- Trademark application brief → counsel

### Week 3–4: First revenue

**cafemargin**
- Target: 5 paying customer signed
- Onboarding manual: live demo + setup on-site atau Zoom
- Daily feedback log per customer
- Case study prep dimulai

**Attention Boost**
- Ingestion jalan: 5 RSS + 3 API (pilih yang paling stabil: BPS, BMKG, 1 berita besar)
- Storage schema + dedup logic
- Internal admin dashboard (belum user-facing)

**Legal**
- Trademark filing submitted (Xolvon + cafemargin dulu, Attention Boost later setelah availability check)
- Vendor DPA: Supabase, OpenAI, Anthropic

### Week 5–8: Product + scale

**cafemargin**
- Target: total 10–15 paying
- Hire decision: part-time SDR atau VA (IDR 3–5jt/bulan part-time, freelancer)
- 3 case study published (Instagram + landing page)
- Referral hook: existing customer dapat 1 bulan free kalau refer yang convert

**Attention Boost**
- NLP pipeline hidup: entity + topic + sentiment dasar
- Vector embedding + semantic search works
- Ekspansi source: 12–15 aktif
- Alpha tester private (10 orang dari network), feedback loop mingguan
- Marketing video: produksi batch 1 (5 video, topic "break the pattern")

**Legal**
- xolvon.ai: 2 brief klien pertama (kalau ada), full screening process berjalan
- UU PDP data inventory mapping

### Week 9–12: Launch prep

**cafemargin**
- Target: 20 paying customer, ARR ~IDR 70–100 juta annualized
- SOP onboarding document (untuk nanti scale via hire)

**Attention Boost**
- User-facing dashboard MVP
- JSON export ke LLM workflow smooth
- Waitlist landing page live
- Marketing video batch 2 (5 video, organic post ke 4 platform)
- Private beta: 50 tester aktif, NPS survey

**Capital & growth**
- Accelerator application: Antler, Iterative, SSI batch berikutnya
- Warm intro mapping: list 20 angel, 5 VC yang align
- Grant: Kominfo DigiTAL submission
- PT conversion prep (cari co-shareholder, siapin dokumen)

**End of Day 90 checkpoint**
- cafemargin: proof of unit economics, 20+ logo, 1 case study polished
- Attention Boost: working MVP, 50 engaged beta, waitlist 500+
- Runway extended via revenue atau ready to raise

---

## Bagian 5 — Unit Economics

### cafemargin.id — kalkulasi detail

Asumsi konservatif:
- Blended ARPU bulanan: IDR 200k (mix 50% Starter, 40% Pro, 10% Consult)
- CAC early stage: IDR 300k (founder-led, mostly opportunity cost waktu)
- Churn bulanan: 5% (target, early stage SaaS SMB)
- Gross margin: 80% (infra minimal, support manual)

Unit economics result:
- LTV = 200k × (1/0.05) × 0.8 = **IDR 3.2 juta**
- LTV:CAC = **10.6x** (sehat, target >3x)
- Payback period: **1.9 bulan**

Growth projection 12 bulan:
| Bulan | Customer | MRR | ARR |
|---|---|---|---|
| 3 | 20 | 4jt | 48jt |
| 6 | 50 | 10jt | 120jt |
| 9 | 90 | 18jt | 216jt |
| 12 | 150 | 30jt | 360jt |

Kunci: jaga churn <7%. Kalau ternyata churn 10%+, ada PMF issue — stop scaling, fix product dulu.

### Attention Boost — kalkulasi detail

Pricing tier:
| Tier | Price | Quota | Target segment |
|---|---|---|---|
| Free | 0 | 5 query/day, no export | Viral + lead gen |
| Lite | IDR 99k/bln | 100 query/day, JSON export | Individual (student, analyst) |
| Pro | IDR 299k/bln | Unlimited query, priority source | Professional (researcher, PM) |
| Team | IDR 1.5jt/bln | 5 seat, API access | SME, agency, konsultan |

Cost per query realistic:
- Cache hit: ~IDR 0 (DB only)
- Cache miss: IDR 50–200 (tergantung LLM provider)
- Target cache hit rate: 70%
- Blended: IDR 30–60/query

Actual usage (bukan max limit):
- Lite user typical: 20–40 query/day actual → 600–1200/bulan
- Cost per Lite user/bulan: IDR 18–72k
- Revenue IDR 99k → **margin 27–82%**

Scale projection end-of-Y1:
| Tier | Users | MRR |
|---|---|---|
| Free (conversion base) | 10,000 aktif | — |
| Lite | 400 | 40jt |
| Pro | 100 | 30jt |
| Team | 20 | 30jt |
| **Paid total** | **520** | **~100jt MRR = 1.2 miliar ARR** |

Conversion assumption: 5% free → paid. Aggressive but achievable kalau content marketing works.

### Total Year 1 target blended
| Revenue line | ARR |
|---|---|
| cafemargin.id | 360jt |
| Attention Boost | 1.2 miliar |
| xolvon.ai services (opportunistic) | 300–500jt |
| **Total** | **~1.8–2.1 miliar ARR** |

Cash realized kemungkinan 50–70% dari ARR karena sebagian belum genap setahun → **~900jt–1.3 miliar cash Y1**.

---

## Bagian 6 — Pre-Seed Pitch Narrative

Target raise: **USD 300–500k** di bulan 9–12 (setelah ada traction data dari Q1 2026).

### Narrative arc (template untuk deck + investor meeting)

**Problem**
Di Indonesia, decision-maker (SME owner, analyst, researcher, marketing lead) punya akses ke banyak data publik — BPS, berita, trend, sosial media — tapi semua terpisah. Cari insight lintas-source = manual, lambat, mahal. Yang punya akses cepat hanya institusi besar dengan tim research.

**Insight**
Dengan LLM cost drop signifikan (10x+ dalam 18 bulan) dan maturity NLP bahasa Indonesia, orkestrasi multi-source yang dulunya butuh tim 5–10 orang sekarang bisa di-automate. Kita tidak bikin model baru — kita bikin layer orkestrasi yang pintar, murah, dan legal-first.

**Solution**
Attention Boost: data companion dengan 100+ legal source, NLP reasoning layer, dan export ke LLM favorit user. Tagline: "Break the pattern."

**Why now**
- UU PDP 27/2022 enforcement → barrier masuk naik, player yang legal-first punya moat
- LLM API cost turun drastis → unit economics sekarang works
- Indonesia digital economy menuju USD 130B di 2025 → demand untuk data tooling spike

**Why us**
- Founder: data science + cybersecurity + finance background
- Track record: ship 2 produk, cafemargin revenue-positive
- Approach: legal-first, berbeda dari competitor yang banyak grey-area

**Traction slide (target Q1 2026)**
- cafemargin: IDR 100jt+ ARR, 50+ paying customer
- Attention Boost: 1000+ free user, 50+ paying, retention D30 >40%
- 1 data partnership LOI (lembaga publik)
- Team: founder + 1 senior eng

**Use of funds (USD 500k contoh alokasi)**
| Alokasi | % | USD |
|---|---|---|
| Engineering hire (2 senior) | 40% | 200k |
| GTM + marketing | 25% | 125k |
| Infrastructure + LLM cost | 15% | 75k |
| Legal + compliance + partnership | 10% | 50k |
| Operating buffer | 10% | 50k |

Runway target: **18–24 bulan** dari closing.

**Ask & fit**
Lead check USD 150–250k, syndicate fill sisanya. Prioritas: investor yang bisa buka pintu ke data partnership (lembaga publik, enterprise) > money aja.

### Target investor archetypes Indonesia
1. **Angel data/SaaS track record** — Ferry Unardi (Traveloka), Willix Halim (Xendit), Pandu Sjahrir (SEA Group ex), dan circle mereka
2. **Syndicate pre-seed** — Init 6, Angin, Kopital Ventures, Skystar Capital
3. **Accelerator** — Antler Indonesia (paling aktif pre-seed), Iterative (SEA), Alpha JWC Prelude, Startup Studio Indonesia
4. **Grant (non-dilutive)** — Kominfo DigiTAL, Google for Startups, Microsoft for Startups Founders Hub, NVIDIA Inception (free GPU credits)

Urutan eksekusi:
1. Grant + accelerator aplikasi dulu — validation + cheap capital + network
2. Accelerator demo day = forcing function untuk angel round
3. Angel round close → baru think about seed

---

## Bagian 7 — Team Building Roadmap

### State sekarang: bottleneck

Solo founder dengan 3 produk aktif tidak scalable. Risk: burnout di bulan 4–6. Plan hire sequence wajib ada sebelum ship MVP kedua.

### Hire priority (by urgency & impact)

**Hire #1 — Senior Full-Stack Engineer (Bulan 3–4)**
- Focus: Attention Boost engineering
- Kompensasi: IDR 15–25jt/bulan + 0.5–1.5% equity (setelah PT conversion)
- Profile: 4+ yr pengalaman, TypeScript/Python, pernah ship produk consumer
- Alternative kalau budget sempit: senior freelancer (Upwork/Toptal/local network) di IDR 800k–1.5jt/hari, engage 10 hari/bulan

**Hire #2 — Growth/Sales Lead (Bulan 5–6)**
- Focus: cafemargin scale + Attention Boost GTM prep
- Kompensasi: IDR 10–15jt base + 10% komisi ARR closed
- Profile: pengalaman B2B SaaS SME, bonus kalau punya network F&B atau analyst community

**Hire #3 — Data/ML Engineer (Bulan 7–9)**
- Focus: NLP pipeline scale, ingestion reliability, Indonesian language optimization
- Kompensasi: IDR 18–30jt/bulan + 0.3–1% equity
- Trigger: hanya hire kalau Attention Boost paid >50 user (validated traction)

**Hire #4 — Operations/Customer Success (Bulan 9–12)**
- Focus: onboarding, support, retention untuk kedua produk
- Kompensasi: IDR 8–12jt/bulan

### Advisor board (lean, equity-based)
- **Legal advisor** — formal engagement, equity 0.25–0.5% vesting 2 tahun monthly
- **Data/AI advisor** — academic atau senior practitioner
- **Growth advisor** — idealnya founder exit track record

### Ownership philosophy
- ESOP pool: 10–15% sebelum seed round
- Vesting standard: 4 tahun, 1 tahun cliff, monthly after cliff
- Founder ownership trajectory: 60–70% pre-seed → 40–50% post-seed → 25–35% post-Series A

### Budget total team Year 1

Asumsi hire #1 M3, #2 M5, #3 M8 (M = Month):
| Pos | Monthly | Bulan aktif Y1 | Total |
|---|---|---|---|
| Founder salary | 15jt | 12 | 180jt |
| Hire #1 (Eng) | 20jt | 10 | 200jt |
| Hire #2 (Sales) | 12jt | 8 | 96jt |
| Hire #3 (Data) | 22jt | 5 | 110jt |
| **Total team** | | | **~586jt** |

Total burn Y1 estimate:
- Team: 586jt
- Infra + LLM: 100jt
- Legal: 100jt
- Marketing: 150jt
- Misc + buffer: 100jt
- **Total: ~IDR 1.05 miliar**

Revenue cash Y1: ~900jt–1.3 miliar
**Net position Y1**: breakeven sampai +IDR 250jt skenario baik, atau –IDR 150jt skenario buruk

Kesimpulan: kalau raise USD 300k = IDR 4.5 miliar, runway 18–24 bulan aman walau worst case.

---

## Lampiran — Decision points untuk founder

Sebelum eksekusi:
1. **Co-founder/team strategy** — solo founder + 3 produk aktif tidak sustainable. Plan B: hire senior contractor untuk Attention Boost engineering.
2. **Capital runway** — berapa bulan tanpa revenue? Sub-6-bulan = gas cafemargin dulu.
3. **First data partnership** — pilih SATU lembaga untuk approach pertama. Saran: BPS (paling open) atau OJK (paling valuable untuk fintech angle).
4. **Free tier UX** — gratis tanpa login (SEO + viral) atau gratis dengan login (lead capture)? Saran: login-required untuk waitlist + email collection sebelum launch besar.
5. **Branding consolidation** — apakah semua produk di-branding "by Xolvon" atau standalone? Konsistensi penting untuk "branding sustain" di mitigation T.

---

*Dokumen ini living document — update tiap kuartal atau setelah milestone besar.*
