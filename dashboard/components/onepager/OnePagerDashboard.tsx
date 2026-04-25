"use client"

import { useMemo, useState } from "react"
import type { Article, MacroSnapshotResponse, MarketResponse, TrendsResponse } from "@/lib/types"
import SearchBar from "@/components/search/SearchBar"
import Load30DaysButton from "@/components/actions/Load30DaysButton"
import ArticleCard from "@/components/feed/ArticleCard"
import { formatNumber, formatPct } from "@/lib/utils"

interface Props {
  query: string
  market: MarketResponse | null
  forex: Record<string, { rate?: number; label?: string }>
  news: Article[]
  trends: TrendsResponse | null
  macro: MacroSnapshotResponse | null
}

const PROGRAMS = [
  "Kedokteran","Teknik Informatika","Sistem Informasi","Ilmu Komputer","Data Science",
  "Teknik Elektro","Teknik Mesin","Teknik Industri","Teknik Sipil","Arsitektur",
  "Manajemen","Akuntansi","Ilmu Ekonomi","Psikologi","Ilmu Komunikasi",
  "Hubungan Internasional","Ilmu Hukum","Ilmu Politik","Sosiologi","Statistika",
  "Farmasi","Kesehatan Masyarakat","Keperawatan","Gizi","Kedokteran Gigi",
  "Teknik Kimia","Teknik Lingkungan","Geografi","Geologi","Agribisnis",
  "DKV","Sastra Inggris","Sastra Indonesia","Pariwisata","Administrasi Bisnis",
]

const LIVE_STREAMS = [
  { name: "CNN Indonesia", url: "https://www.youtube.com/@CNNindonesiaOfficial/live" },
  { name: "Kompas TV",     url: "https://www.youtube.com/@KompasTV/live" },
  { name: "CNBC Indonesia",url: "https://www.youtube.com/@CNBCIndonesia/live" },
]

function openGPT(prompt: string) {
  window.open(`https://chat.openai.com/?q=${encodeURIComponent(prompt)}`, "_blank", "noopener,noreferrer")
}

function KeywordChip({ keyword, category }: { keyword: string; category: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 badge-blue text-[10px] leading-none py-0.5">
      {keyword}
      <button
        onClick={() => openGPT(`Jelaskan tren "${keyword}" dalam konteks ${category.replaceAll("_"," ")} di Indonesia saat ini. Berikan insight singkat dan implikasinya dalam 3 poin.`)}
        className="ml-0.5 text-[9px] font-extrabold text-muted hover:text-primary transition-colors"
        title={`Tanya GPT tentang "${keyword}"`}
      >?</button>
    </span>
  )
}

function StatRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-border last:border-0">
      <span className="text-[10px] text-muted truncate pr-2">{label}</span>
      <div className="text-right shrink-0">
        <span className="text-xs font-extrabold text-text">{value}</span>
        {sub && <span className="ml-1 text-[9px] text-muted">{sub}</span>}
      </div>
    </div>
  )
}

export default function OnePagerDashboard({ query, market, forex, news, trends, macro }: Props) {
  const [showAllPrograms, setShowAllPrograms] = useState(false)
  const [showAllNews,     setShowAllNews]     = useState(false)

  const indicators = market?.indicators ?? {} as Record<string, { value?: number; change_pct?: number }>
  const btc    = market?.crypto?.bitcoin
  const ihsg   = (indicators as Record<string, { value?: number; change_pct?: number }>).ihsg
  const usdIdr = (indicators as Record<string, { value?: number }>).usd_idr?.value ?? forex?.USD_IDR?.rate
  const biRate = (indicators as Record<string, number | undefined>).bi_rate

  const trendEntries = useMemo(() => Object.entries(trends?.categories ?? {}), [trends])
  const visibleNews  = showAllNews ? news : news.slice(0, 8)
  const visibleProgs = showAllPrograms ? PROGRAMS : PROGRAMS.slice(0, 18)

  return (
    <div className="mx-auto w-full max-w-[1400px] px-3 py-3">

      {/* ── TOP BAR: search + load ─────────────────────────────────── */}
      <div className="mb-2 flex items-center gap-2">
        <div className="flex-1">
          <SearchBar defaultValue={query} size="sm" />
        </div>
        <Load30DaysButton />
      </div>

      {/* ── MARKET TICKER STRIP ───────────────────────────────────── */}
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-border bg-surface px-3 py-1.5">
        <span className="text-[9px] font-extrabold uppercase tracking-widest text-muted">Market</span>
        <span className="text-xs font-extrabold text-text">
          IHSG <span className="ml-1">{ihsg?.value ? formatNumber(ihsg.value, { decimals: 0 }) : "—"}</span>
          {ihsg?.change_pct != null && (
            <span className={`ml-1 text-[10px] ${ihsg.change_pct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {formatPct(ihsg.change_pct)}
            </span>
          )}
        </span>
        <span className="text-xs text-text">
          USD/IDR <span className="ml-1 font-extrabold">{usdIdr ? `Rp ${formatNumber(usdIdr, { decimals: 0 })}` : "—"}</span>
        </span>
        <span className="text-xs text-text">
          BTC <span className="ml-1 font-extrabold">{btc?.usd ? `$${formatNumber(btc.usd, { decimals: 0 })}` : "—"}</span>
        </span>
        <span className="text-xs text-text">
          BI Rate <span className="ml-1 font-extrabold">{typeof biRate === "number" ? `${biRate}%` : "—"}</span>
        </span>
        {macro?.world_bank?.gdp_growth != null && (
          <span className="text-xs text-text">
            WB GDP <span className="ml-1 font-extrabold">{macro.world_bank.gdp_growth}%</span>
          </span>
        )}
        <span className="ml-auto flex gap-3">
          {LIVE_STREAMS.map(s => (
            <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
              className="text-[9px] font-extrabold text-red-400 hover:text-red-300 transition-colors">
              ● {s.name}
            </a>
          ))}
        </span>
      </div>

      {/* ── MAIN 3-COL GRID ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[2fr_2fr_1fr]">

        {/* COL 1 — News ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="section-title">News · {news.length} artikel</span>
            <button
              onClick={() => openGPT("Berikan ringkasan headline berita Indonesia hari ini beserta implikasinya untuk ekonomi, politik, dan bisnis.")}
              className="text-[9px] text-muted hover:text-primary transition-colors"
              title="Rangkum semua berita di GPT"
            >? Rangkum semua</button>
          </div>

          {news.length === 0 ? (
            <div className="card p-4 text-center text-xs text-muted">
              Belum ada data — klik <span className="text-primary">Load 30 Hari</span>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                {visibleNews.map((a, i) => (
                  <div key={a.id ?? i} className="group flex items-start gap-2 rounded-lg border border-border bg-surface px-2.5 py-1.5 hover:border-primary/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <a href={a.link} target="_blank" rel="noopener noreferrer"
                        className="block text-xs font-extrabold text-text leading-tight hover:text-primary transition-colors line-clamp-2">
                        {a.title}
                      </a>
                      <div className="mt-0.5 flex items-center gap-2 text-[9px] text-muted">
                        <span className="uppercase">{a.source_id}</span>
                        {a.published_at && (
                          <span>{new Date(a.published_at).toLocaleDateString("id-ID", { day:"numeric", month:"short" })}</span>
                        )}
                        {a.topics?.slice(0,2).map(t => (
                          <span key={t} className="rounded bg-blue-500/10 px-1 text-blue-400">{t}</span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => openGPT(`Berikan analisis singkat tentang berita ini dalam 3 poin: "${a.title}". Sumber: ${a.source_id}. Apa implikasinya untuk Indonesia?`)}
                      className="shrink-0 text-[10px] font-extrabold text-muted hover:text-primary opacity-0 group-hover:opacity-100 transition-all"
                      title="Tanya GPT"
                    >?</button>
                  </div>
                ))}
              </div>
              {news.length > 8 && (
                <button onClick={() => setShowAllNews(p => !p)}
                  className="text-[10px] text-muted hover:text-primary transition-colors text-left">
                  {showAllNews ? "↑ Sembunyikan" : `↓ Lihat ${news.length - 8} lagi`}
                </button>
              )}
            </>
          )}
        </div>

        {/* COL 2 — Trends ───────────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <span className="section-title">Trends · per kategori</span>
          {trendEntries.length === 0 ? (
            <div className="card p-4 text-center text-xs text-muted">Belum ada data trends</div>
          ) : (
            trendEntries.map(([category, payload]) => (
              <div key={category} className="rounded-lg border border-border bg-surface px-2.5 py-2">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary">
                    {category.replaceAll("_", " ")}
                  </span>
                  <button
                    onClick={() => openGPT(`Jelaskan tren besar dalam kategori ${category.replaceAll("_"," ")} di Indonesia minggu ini. Keyword utama: ${payload.keywords.slice(0,5).join(", ")}. Berikan insight dan implikasi.`)}
                    className="text-[9px] text-muted hover:text-primary transition-colors"
                    title="Tanya GPT tentang kategori ini"
                  >? kategori</button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {payload.keywords.map(kw => (
                    <KeywordChip key={kw} keyword={kw} category={category} />
                  ))}
                  {payload.live_signals?.slice(0, 5).map(sig => (
                    <span key={`sig-${sig}`}
                      className="inline-flex items-center gap-0.5 badge-amber text-[10px] leading-none py-0.5">
                      {sig}
                      <button
                        onClick={() => openGPT(`Jelaskan "${sig}" yang sedang trending saat ini. Apa konteksnya dan implikasinya?`)}
                        className="ml-0.5 text-[9px] text-muted hover:text-amber-300 transition-colors"
                        title="Tanya GPT"
                      >?</button>
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* COL 3 — Macro + Programs ─────────────────────────────── */}
        <div className="flex flex-col gap-3">

          {/* Macro stats */}
          <div className="rounded-lg border border-border bg-surface px-2.5 py-2">
            <span className="section-title">Macro · Indonesia</span>
            <div className="mt-1.5">
              <StatRow label="WB GDP Growth" value={macro?.world_bank?.gdp_growth != null ? `${macro.world_bank.gdp_growth}%` : "—"} />
              <StatRow label="WB Inflation" value={macro?.world_bank?.inflation != null ? `${macro.world_bank.inflation}%` : "—"} />
              <StatRow label="IMF Real GDP" value={macro?.imf?.real_gdp_growth_latest != null ? `${macro.imf.real_gdp_growth_latest}%` : "—"} sub={macro?.imf?.year ?? ""} />
              <StatRow label="BI Rate" value={typeof biRate === "number" ? `${biRate}%` : "—"} />
              <StatRow label="USD/IDR" value={usdIdr ? `Rp ${formatNumber(usdIdr, { decimals: 0 })}` : "—"} />
              <StatRow label="BPS + OJK + IDX" value="Live" sub="aggregated" />
            </div>
          </div>

          {/* Program Studi */}
          <div className="rounded-lg border border-border bg-surface px-2.5 py-2">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="section-title">Program Studi</span>
              <button
                onClick={() => openGPT("Jelaskan 5 skill paling penting yang dibutuhkan mahasiswa Indonesia di era AI saat ini, lintas jurusan.")}
                className="text-[9px] text-muted hover:text-primary transition-colors"
              >? skill era AI</button>
            </div>
            <div className="flex flex-wrap gap-1">
              {visibleProgs.map(prog => (
                <button
                  key={prog}
                  onClick={() => openGPT(`Saya mahasiswa ${prog} di Indonesia. Jelaskan 5 hal paling penting dan happening yang harus saya pelajari atau pantau saat ini untuk karir dan riset.`)}
                  className="inline-flex items-center rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-extrabold text-muted hover:bg-primary/10 hover:text-primary transition-colors border border-border"
                >
                  {prog}
                </button>
              ))}
            </div>
            {PROGRAMS.length > 18 && (
              <button onClick={() => setShowAllPrograms(p => !p)}
                className="mt-1.5 text-[9px] text-muted hover:text-primary transition-colors">
                {showAllPrograms ? "↑ Sembunyikan" : `↓ +${PROGRAMS.length - 18} lagi`}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
