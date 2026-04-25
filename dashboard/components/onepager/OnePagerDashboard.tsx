"use client"

import { useMemo, useState } from "react"
import type { Article, MacroSnapshotResponse, MarketResponse, TrendsResponse } from "@/lib/types"
import SearchBar from "@/components/search/SearchBar"
import AskAIButton from "@/components/actions/AskAIButton"
import ArticleCard from "@/components/feed/ArticleCard"
import Load30DaysButton from "@/components/actions/Load30DaysButton"
import { formatNumber, formatPct } from "@/lib/utils"
import LazyYouTubeEmbed from "@/components/onepager/LazyYouTubeEmbed"

interface Props {
  query: string
  market: MarketResponse | null
  forex: Record<string, { rate?: number; label?: string }>
  news: Article[]
  trends: TrendsResponse | null
  macro: MacroSnapshotResponse | null
}

const PROGRAMS = [
  "Kedokteran", "Teknik Informatika", "Sistem Informasi", "Ilmu Komputer", "Data Science", "Teknik Elektro",
  "Teknik Mesin", "Teknik Industri", "Teknik Sipil", "Arsitektur", "Manajemen", "Akuntansi", "Ilmu Ekonomi",
  "Psikologi", "Ilmu Komunikasi", "Hubungan Internasional", "Ilmu Hukum", "Ilmu Politik", "Sosiologi", "Antropologi",
  "Pendidikan Matematika", "Pendidikan Bahasa Inggris", "Pendidikan Guru SD", "Biologi", "Kimia", "Fisika",
  "Matematika", "Statistika", "Farmasi", "Kesehatan Masyarakat", "Keperawatan", "Gizi", "Kedokteran Gigi",
  "Teknik Kimia", "Teknik Lingkungan", "Perencanaan Wilayah Kota", "Geografi", "Geologi", "Kelautan", "Perikanan",
  "Peternakan", "Agribisnis", "Agroteknologi", "Desain Komunikasi Visual", "Seni Musik", "Sastra Inggris",
  "Sastra Indonesia", "Bahasa Jepang", "Pariwisata", "Administrasi Bisnis",
]

const BASE_KEYWORDS = [
  "ai tools", "prompt engineering", "critical thinking", "public speaking", "statistical literacy",
  "research method", "digital ethics", "project management", "problem solving", "portfolio building",
  "internship", "entrepreneurship", "financial literacy", "cybersecurity basics", "data visualization",
  "networking", "career roadmap", "industry trends", "writing skill", "presentation skill",
  "leadership", "global economy", "policy analysis", "innovation", "startup case study",
  "indonesia market", "geopolitics", "time management", "academic productivity", "future jobs",
]

const LIVE_STREAMS = [
  {
    name: "CNN Indonesia Live",
    url: "https://www.youtube.com/@CNNindonesiaOfficial/live",
    channelId: "UCZ4AMrDcNrfy3X6nsU8-rPg",
  },
  {
    name: "Kompas TV Live",
    url: "https://www.youtube.com/@KompasTV/live",
    channelId: "UCER4rvDnRBPr_ncYW4UCg5A",
  },
  {
    name: "CNBC Indonesia Live",
    url: "https://www.youtube.com/@CNBCIndonesia/live",
    channelId: "UCrh2Y7Hgg2Z8w3a_d4jR3dQ",
  },
]

function buildProgramKeywords(program: string) {
  return BASE_KEYWORDS.map((keyword) => `${program.toLowerCase()} ${keyword}`)
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-extrabold text-text">{title}</h2>
        <p className="text-xs font-bold text-muted">{subtitle}</p>
      </div>
    </div>
  )
}

export default function OnePagerDashboard({ query, market, forex, news, trends, macro }: Props) {
  const [newsLimit, setNewsLimit] = useState(9)
  const [trendLimit, setTrendLimit] = useState(3)
  const [programLimit, setProgramLimit] = useState(8)

  const topPrograms = useMemo(
    () => PROGRAMS.slice(0, programLimit).map((name) => ({ name, keywords: buildProgramKeywords(name) })),
    [programLimit],
  )

  const trendEntries = Object.entries(trends?.categories ?? {})
  const visibleTrends = trendEntries.slice(0, trendLimit)
  const floatingTrendTokens = trendEntries.flatMap(([category, payload]) =>
    payload.keywords.slice(0, 4).map((keyword) => `${category.replaceAll("_", " ")}: ${keyword}`),
  )
  const floatingNewsTokens = news.slice(0, 20).map((article) => article.title)

  const marketIndicators = market?.indicators ?? {}
  const btc = market?.crypto?.bitcoin
  const ihsg = (marketIndicators as Record<string, { value?: number; change_pct?: number }>).ihsg
  const usd = (marketIndicators as Record<string, { value?: number }>).usd_idr?.value ?? forex?.USD_IDR?.rate

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <section className="mb-8 rounded-2xl border border-border bg-surface p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-primary">N2ND by Xolvon.ai</p>
            <h1 className="text-3xl font-extrabold tracking-tight text-text sm:text-4xl">One Pager Intelligence Dashboard</h1>
            <p className="mt-1 text-xs font-bold text-muted">Finance, News, Trends, Program Studi, dan Macro Visual dalam satu halaman.</p>
          </div>
          <Load30DaysButton />
        </div>
        <SearchBar defaultValue={query} size="lg" />
      </section>

      <section className="mb-10">
        <SectionHeader title="Feature 1 · FinanceBoard" subtitle="Crypto, kurs rupiah, stocks, dan signal market live." />
        <div className="mb-3 grid gap-3 md:grid-cols-3">
          {LIVE_STREAMS.map((stream) => (
            <div key={stream.name} className="space-y-2">
              <LazyYouTubeEmbed title={stream.name} channelId={stream.channelId} sourceUrl={stream.url} />
              <a
                href={stream.url}
                target="_blank"
                rel="noopener noreferrer"
                className="badge-red w-fit whitespace-nowrap"
              >
                Open Source
              </a>
            </div>
          ))}
        </div>
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          {LIVE_STREAMS.map((stream) => (
            <a
              key={stream.name}
              href={stream.url}
              target="_blank"
              rel="noopener noreferrer"
              className="badge-red whitespace-nowrap"
            >
              {stream.name}
            </a>
          ))}
        </div>
        {floatingNewsTokens.length > 0 ? (
          <div className="auto-slide mb-3">
            <div className="auto-slide-track">
              {[...floatingNewsTokens, ...floatingNewsTokens].map((token, idx) => (
                <span key={`finance-news-${idx}`} className="auto-slide-chip">
                  {token}
                </span>
              ))}
            </div>
          </div>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card p-4">
            <p className="text-xs font-bold text-muted">IHSG</p>
            <p className="text-2xl font-extrabold text-text">{ihsg?.value ? formatNumber(ihsg.value, { decimals: 0 }) : "—"}</p>
            <p className={`text-xs font-bold ${(ihsg?.change_pct ?? 0) >= 0 ? "text-positive" : "text-negative"}`}>{formatPct(ihsg?.change_pct)}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs font-bold text-muted">USD / IDR</p>
            <p className="text-2xl font-extrabold text-text">{usd ? `Rp ${formatNumber(usd, { decimals: 0 })}` : "—"}</p>
            <p className="text-xs font-bold text-muted">FX Live</p>
          </div>
          <div className="card p-4">
            <p className="text-xs font-bold text-muted">Bitcoin</p>
            <p className="text-2xl font-extrabold text-text">{btc?.usd ? `$${formatNumber(btc.usd, { decimals: 0 })}` : "—"}</p>
            <p className="text-xs font-bold text-muted">Crypto Live</p>
          </div>
          <div className="card p-4">
            <p className="text-xs font-bold text-muted">BI Proxy</p>
            <p className="text-2xl font-extrabold text-text">
              {typeof (marketIndicators as { bi_rate?: number }).bi_rate === "number"
                ? `${(marketIndicators as { bi_rate?: number }).bi_rate}%`
                : "—"}
            </p>
            <p className="text-xs font-bold text-muted">Monetary Signal</p>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <SectionHeader title="Feature 2 · News (30 Hari)" subtitle="Semua sumber legal, klik berita untuk buka sumber, klik ? untuk tanya GPT." />
        {news.length ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {news.slice(0, newsLimit).map((article, idx) => (
                <ArticleCard key={article.id ?? idx} article={article} />
              ))}
            </div>
            {newsLimit < news.length ? (
              <button className="btn-ghost mt-4 text-xs" onClick={() => setNewsLimit((prev) => prev + 9)}>
                Full More
              </button>
            ) : null}
          </>
        ) : (
          <div className="card p-6 text-sm font-bold text-muted">Belum ada data news, klik `Load 30 Hari` dulu.</div>
        )}
      </section>

      <section className="mb-10">
        <SectionHeader title="Feature 3 · Trends Legal API" subtitle="Kategori trends dengan floating slide keywords + satu klik ke GPT." />
        {floatingTrendTokens.length > 0 ? (
          <div className="auto-slide mb-3">
            <div className="auto-slide-track">
              {[...floatingTrendTokens, ...floatingTrendTokens].map((token, idx) => (
                <span key={`trend-token-${idx}`} className="auto-slide-chip">
                  {token}
                </span>
              ))}
            </div>
          </div>
        ) : null}
        <div className="space-y-3">
          {visibleTrends.map(([category, payload]) => (
            <div key={category} className="card p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-extrabold capitalize text-text">{category.replaceAll("_", " ")}</p>
                <AskAIButton subject={`tren ${category} minggu ini`} compact />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {payload.keywords.slice(0, 12).map((keyword) => (
                  <span key={keyword} className="badge-blue whitespace-nowrap">{keyword}</span>
                ))}
                {payload.live_signals.slice(0, 8).map((signal) => (
                  <span key={`${category}-${signal}`} className="badge-amber whitespace-nowrap">{signal}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
        {trendLimit < trendEntries.length ? (
          <button className="btn-ghost mt-4 text-xs" onClick={() => setTrendLimit((prev) => prev + 2)}>
            Full More
          </button>
        ) : null}
      </section>

      <section className="mb-10">
        <SectionHeader title="Feature 4 · Program Studi (50+)" subtitle="Setiap program studi punya 30 keyword penting/happening + tanya GPT." />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {topPrograms.map((program) => (
            <div key={program.name} className="card p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-extrabold text-text">{program.name}</p>
                <AskAIButton subject={`hal penting untuk mahasiswa ${program.name}`} compact />
              </div>
              <div className="flex max-h-24 flex-wrap gap-1 overflow-hidden">
                {program.keywords.map((keyword) => (
                  <span key={keyword} className="badge-gray text-[10px]">{keyword}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
        {programLimit < PROGRAMS.length ? (
          <button className="btn-ghost mt-4 text-xs" onClick={() => setProgramLimit((prev) => prev + 10)}>
            Full More
          </button>
        ) : null}
      </section>

      <section>
        <SectionHeader title="Feature 5 · Macro Visual (Ringan)" subtitle="BPS, OJK, BI, IMF, World Bank untuk konteks political & business." />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card p-4">
            <p className="text-xs font-bold text-muted">World Bank GDP Growth</p>
            <p className="text-2xl font-extrabold text-text">{macro?.world_bank?.gdp_growth != null ? `${macro.world_bank.gdp_growth}%` : "—"}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs font-bold text-muted">World Bank Inflation</p>
            <p className="text-2xl font-extrabold text-text">{macro?.world_bank?.inflation != null ? `${macro.world_bank.inflation}%` : "—"}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs font-bold text-muted">IMF Real GDP Growth</p>
            <p className="text-2xl font-extrabold text-text">{macro?.imf?.real_gdp_growth_latest != null ? `${macro.imf.real_gdp_growth_latest}%` : "—"}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs font-bold text-muted">IDX/OJK/BPS/BI</p>
            <p className="text-sm font-extrabold text-text">Live Aggregated</p>
            <p className="text-xs font-bold text-muted">source-ready for business and policy context</p>
          </div>
        </div>
      </section>
    </div>
  )
}
