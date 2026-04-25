/**
 * Universal LLM export formula — Glasp-style.
 * Top: system prompt (what AI should do)
 * Bottom: structured intelligence brief (metadata + content blocks)
 *
 * Works for ALL content types: article, bundle, bps, market, general.
 */

import type { SearchBundle, UseCase, AITarget, Article, BPSStat, MarketSignals, EntityGraphItem } from "./types"
import { formatDate, formatNumber, formatPct } from "./utils"

// ─── System Prompts ───────────────────────────────────────────────────────────

export const USE_CASE_META: Record<UseCase, { label: string; description: string; prompt: string }> = {
  analisis_berita: {
    label: "Analisis Berita",
    description: "5 poin utama + implikasi kebijakan",
    prompt: `Kamu adalah analis intelijen data senior Indonesia.

TUGAS: Analisis konten berita dan data berikut, kemudian berikan:
1. RINGKASAN EKSEKUTIF (2-3 kalimat)
2. 5 FAKTA UTAMA (dengan nomor, urutan kepentingan)
3. IMPLIKASI KEBIJAKAN (untuk pemerintah/regulator)
4. DAMPAK BISNIS (untuk pelaku usaha)
5. RISIKO JANGKA PENDEK (30-90 hari ke depan)

Format: terstruktur, padat, berbasis fakta. Tidak ada opini tanpa dasar data.`,
  },

  riset_ekonomi: {
    label: "Riset Ekonomi",
    description: "Tren + proyeksi 3-6 bulan",
    prompt: `Kamu adalah ekonom senior dengan spesialisasi ekonomi makro Indonesia.

TUGAS: Berdasarkan data ekonomi berikut, berikan:
1. KONDISI TERKINI (snapshot makroekonomi)
2. TREN DOMINAN (3-5 tren yang terbaca dari data)
3. PROYEKSI 3-6 BULAN (dengan asumsi yang jelas)
4. INDIKATOR KUNCI YANG PERLU DIPANTAU
5. REKOMENDASI KEBIJAKAN MONETER/FISKAL

Sertakan perbandingan dengan periode sebelumnya jika data tersedia.`,
  },

  monitoring_pasar: {
    label: "Monitoring Pasar",
    description: "Momentum + risiko + level kritis",
    prompt: `Kamu adalah analis pasar modal dan aset keuangan Indonesia.

TUGAS: Analisis kondisi pasar berdasarkan data berikut:
1. KONDISI PASAR SAAT INI (IHSG, sektor, sentimen)
2. KATALIS UTAMA (faktor penggerak pasar)
3. LEVEL SUPPORT & RESISTANCE KRITIS
4. RISIKO DOWNSIDE (jangka pendek)
5. SEKTOR/SAHAM YANG PERLU DIPERHATIKAN
6. REKOMENDASI POSISI (overweight/underweight/neutral per sektor)

Berbasis data, tidak ada rekomendasi investasi spesifik.`,
  },

  risk_assessment: {
    label: "Risk Assessment",
    description: "Likelihood × Impact matrix + mitigasi",
    prompt: `Kamu adalah analis risiko geopolitik dan makro Indonesia.

TUGAS: Buat risk assessment komprehensif dari data berikut:

FORMAT OUTPUT:
## RISK REGISTER
| Risiko | Likelihood (1-5) | Impact (1-5) | Risk Score | Status |
|--------|-----------------|--------------|------------|--------|
[isi tabel]

## RISIKO PRIORITAS (Risk Score ≥ 12)
[Deskripsikan setiap risiko tinggi]

## RENCANA MITIGASI
[Mitigasi konkret per risiko tinggi]

## EARLY WARNING INDICATORS
[Sinyal yang harus dipantau]`,
  },

  general: {
    label: "Analisis Umum",
    description: "Insight actionable untuk decision-maker",
    prompt: `Kamu adalah asisten riset cerdas untuk decision-maker Indonesia.

TUGAS: Analisis data intelijen berikut dan berikan insight yang actionable.

Struktur output:
• WHAT: Apa yang sedang terjadi
• SO WHAT: Mengapa ini penting
• NOW WHAT: Apa yang harus dilakukan

Bahasa: formal tapi tidak kaku. Fokus pada implikasi praktis.`,
  },
}

export const AI_TARGETS: Record<AITarget, { label: string; url: string; icon: string }> = {
  chatgpt: { label: "ChatGPT",     url: "https://chatgpt.com/",  icon: "🤖" },
  claude:  { label: "Claude",      url: "https://claude.ai/new", icon: "🔮" },
  gemini:  { label: "Gemini",      url: "https://gemini.google.com/", icon: "✨" },
}

// ─── Content Formatters ───────────────────────────────────────────────────────

function formatArticleBlock(a: Article, idx: number): string {
  const source = a.source_id?.toUpperCase() ?? "SUMBER"
  const date   = formatDate(a.published_at ?? a.published)
  const text   = a.ai_summary ?? a.summary ?? a.body ?? ""
  const topics = (a.topics ?? []).join(", ") || "—"
  const rel    = a.relevance_score ? ` | Relevansi: ${(a.relevance_score * 100).toFixed(0)}%` : ""

  return `[${idx}] ${a.title}
Sumber: ${source} | ${date}${rel}
Topik: ${topics}
${text.slice(0, 400)}${text.length > 400 ? "…" : ""}`
}

function formatBPSBlock(stats: BPSStat[]): string {
  if (!stats?.length) return "(tidak ada data BPS untuk query ini)"
  return stats
    .filter(s => s.latest_value != null)
    .slice(0, 6)
    .map(s => `• ${s.indicator} (${s.category}): ${formatNumber(s.latest_value)} ${s.unit} [${s.latest_year}]`)
    .join("\n")
}

function formatMarketBlock(m: MarketSignals): string {
  const lines: string[] = []
  if (m.ihsg) {
    const chg = formatPct(m.ihsg.change_pct)
    lines.push(`• IHSG: ${formatNumber(m.ihsg.value, { decimals: 0 })} (${chg})`)
  }
  if (m.usd_idr?.value) lines.push(`• USD/IDR: Rp ${formatNumber(m.usd_idr.value, { decimals: 0 })}`)
  if (m.bi_rate)        lines.push(`• BI Rate: ${typeof m.bi_rate === "number" ? m.bi_rate : m.bi_rate.value}%`)
  if (m.fear_greed)     lines.push(`• Fear & Greed: ${m.fear_greed.value}/100 — ${m.fear_greed.label}`)
  return lines.join("\n") || "(tidak ada data pasar)"
}

function formatEntityBlock(entities: EntityGraphItem[]): string {
  if (!entities?.length) return "(tidak ada entitas)"
  return entities
    .slice(0, 10)
    .map(e => `• ${e.name} (${e.type}) — ${e.mentions}× di ${e.cross_sources} sumber`)
    .join("\n")
}

// ─── Main Formula ─────────────────────────────────────────────────────────────

export interface ExportOptions {
  useCase:        UseCase
  includeArticles: boolean
  includeBPS:      boolean
  includeMarket:   boolean
  includeEntities: boolean
  maxArticles:    number
}

export const DEFAULT_OPTIONS: ExportOptions = {
  useCase:         "analisis_berita",
  includeArticles: true,
  includeBPS:      true,
  includeMarket:   true,
  includeEntities: true,
  maxArticles:     8,
}

export function buildExportPrompt(bundle: SearchBundle, opts: ExportOptions = DEFAULT_OPTIONS): string {
  const uc         = USE_CASE_META[opts.useCase]
  const cb         = bundle.context_bundle
  const tension    = cb.tension
  const now        = new Date().toLocaleDateString("id-ID", { dateStyle: "full" })
  const sourceList = (bundle.metadata?.sources ?? []).join(", ") || "beragam sumber"
  const latency    = bundle.metadata?.latency_ms ? ` | Latency: ${bundle.metadata.latency_ms}ms` : ""

  const divider = "━".repeat(50)

  const sections: string[] = []

  // TOP: System prompt
  sections.push(
    `${divider}\n🤖  INSTRUKSI AI — ${uc.label.toUpperCase()}\n${divider}`,
    uc.prompt,
    ""
  )

  // METADATA header
  sections.push(
    `${divider}\n📊  n2nd INTELLIGENCE BRIEF\n${divider}`,
    `Tanggal   : ${now}`,
    `Query     : "${bundle.query}"`,
    `Tension   : ${tension?.score ?? "—"}/100 — ${tension?.label ?? "—"}`,
    `Keywords  : ${(tension?.keywords ?? []).join(", ") || "—"}`,
    `Sumber    : ${sourceList}${latency}`,
    `Confidence: ${bundle.metadata?.confidence ? `${(bundle.metadata.confidence * 100).toFixed(0)}%` : "—"}`,
    ""
  )

  // Articles block
  if (opts.includeArticles && cb.news?.length) {
    const articles = cb.news.slice(0, opts.maxArticles)
    sections.push(
      `${divider}\n📰  BERITA & EVENTS (${articles.length} artikel)\n${divider}`,
      ...articles.map((a, i) => formatArticleBlock(a, i + 1)),
      ""
    )
  }

  // BPS block
  if (opts.includeBPS && cb.stats?.length) {
    sections.push(
      `${divider}\n📈  DATA STATISTIK BPS INDONESIA\n${divider}`,
      formatBPSBlock(cb.stats),
      ""
    )
  }

  // Market block
  if (opts.includeMarket && cb.market_signals) {
    sections.push(
      `${divider}\n💹  SINYAL PASAR REAL-TIME\n${divider}`,
      formatMarketBlock(cb.market_signals),
      ""
    )
  }

  // Entity graph
  if (opts.includeEntities && cb.entity_graph?.entities?.length) {
    sections.push(
      `${divider}\n🔗  ENTITAS UTAMA (cross-source verified)\n${divider}`,
      formatEntityBlock(cb.entity_graph.entities),
      ""
    )
  }

  // Footer
  sections.push(
    divider,
    "Powered by n2nd.ai | Xolvon Group",
    "Data dari sumber publik terverifikasi. Bukan saran keuangan/hukum.",
    "Attribution wajib jika dikutip.",
    divider
  )

  return sections.join("\n")
}

// ─── Helpers for UI ──────────────────────────────────────────────────────────

export function openAI(target: AITarget): void {
  window.open(AI_TARGETS[target].url, "_blank", "noopener,noreferrer")
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const el = document.createElement("textarea")
    el.value = text
    el.style.position = "fixed"
    el.style.opacity = "0"
    document.body.appendChild(el)
    el.select()
    const ok = document.execCommand("copy")
    document.body.removeChild(el)
    return ok
  }
}
