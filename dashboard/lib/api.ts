import type {
  SearchBundle,
  FeedResponse,
  MarketResponse,
  Article,
  TrendsResponse,
  MacroSnapshotResponse,
} from "./types"

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  })
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`)
  return res.json() as Promise<T>
}

export async function search(
  query: string,
  opts?: { limit?: number; min_similarity?: number; topics?: string[]; source_types?: string[] }
): Promise<SearchBundle> {
  return apiFetch("/api/v1/search", {
    method: "POST",
    body: JSON.stringify({
      query,
      limit:          opts?.limit ?? 10,
      min_similarity: opts?.min_similarity ?? 0.45,
      content_types:  opts?.topics,
      source_types:   opts?.source_types,
    }),
    next: { revalidate: 60 },
  } as RequestInit)
}

export async function getFeed(opts?: { source?: string; limit?: number }): Promise<FeedResponse> {
  const params = new URLSearchParams()
  if (opts?.source) params.set("source", opts.source)
  if (opts?.limit)  params.set("limit", String(opts.limit))
  return apiFetch(`/api/v1/feed?${params}`, { next: { revalidate: 60 } } as RequestInit)
}

export async function getHeadlines(): Promise<{ headlines: Article[]; updated_at?: string }> {
  return apiFetch("/api/v1/feed/headlines", { next: { revalidate: 60 } } as RequestInit)
}

export async function load30Days(): Promise<{
  status: string
  max_wait_seconds?: number
  summary?: Record<string, number>
  detail?: string
}> {
  return apiFetch("/api/v1/feed/load-30d", { method: "POST" })
}

export async function getFreeSources(): Promise<{
  sources: Array<{ name: string; type: string; access: string; fit: string }>
  google_trends_note: string
}> {
  return apiFetch("/api/v1/intel/free-sources", { next: { revalidate: 3600 } } as RequestInit)
}

export async function getTrends(): Promise<TrendsResponse> {
  return apiFetch("/api/v1/intel/trends", { next: { revalidate: 900 } } as RequestInit)
}

export async function getMacroSnapshot(): Promise<MacroSnapshotResponse> {
  return apiFetch("/api/v1/intel/macro-snapshot", { next: { revalidate: 1800 } } as RequestInit)
}

export async function getMarket(): Promise<MarketResponse> {
  return apiFetch("/api/v1/market", { next: { revalidate: 30 } } as RequestInit)
}

export async function getForex(): Promise<Record<string, { rate?: number; label?: string }>> {
  return apiFetch("/api/v1/market/forex", { next: { revalidate: 300 } } as RequestInit)
}

export async function getHealth(): Promise<{ status: string; checks?: Record<string, string> }> {
  return apiFetch("/api/v1/health", { next: { revalidate: 10 } } as RequestInit)
}

export const MOCK_BUNDLE: SearchBundle = {
  query: "inflasi",
  context_bundle: {
    news: [
      {
        title: "Bank Indonesia Pertahankan Suku Bunga 6% di Tengah Tekanan Inflasi",
        source_id: "kompas", topics: ["ekonomi"], entities: [{ name: "Bank Indonesia", type: "ORG", count: 3 }],
        published_at: new Date(Date.now() - 3_600_000).toISOString(),
        body: "Rapat Dewan Gubernur Bank Indonesia memutuskan untuk mempertahankan suku bunga acuan BI Rate pada level 6,00 persen...",
        relevance_score: 0.91, tension_score: 45, sentiment: -0.2, authority_score: 0.9,
      },
      {
        title: "Inflasi Maret 2025 Tercatat 2.51% — BPS",
        source_id: "antara", topics: ["ekonomi", "sosial"], entities: [{ name: "BPS", type: "ORG", count: 2 }],
        published_at: new Date(Date.now() - 7_200_000).toISOString(),
        body: "Badan Pusat Statistik (BPS) mencatat tingkat inflasi pada bulan Maret 2025 sebesar 2,51 persen year-on-year...",
        relevance_score: 0.87, tension_score: 30, sentiment: 0.1, authority_score: 0.9,
      },
    ],
    stats: [
      { category: "Makroekonomi", indicator: "Inflasi Year-on-Year", unit: "%", latest_year: "2025", latest_value: 2.51, series: [] },
      { category: "Moneter", indicator: "BI Rate", unit: "%", latest_year: "2025", latest_value: 6.0, series: [] },
    ],
    market_signals: {
      ihsg:       { value: 7234.5, change: 12.3, change_pct: 0.17 },
      usd_idr:    { value: 16450 },
      bi_rate:    6.0,
      fear_greed: { value: 42, label: "Fear" },
    },
    entity_graph: {
      entities: [
        { name: "Bank Indonesia", type: "ORG", mentions: 12, cross_sources: 4, prominence_score: 48 },
        { name: "BPS", type: "ORG", mentions: 8, cross_sources: 3, prominence_score: 24 },
        { name: "Sri Mulyani", type: "PERSON", mentions: 5, cross_sources: 2, prominence_score: 10 },
      ],
    },
    tension: { score: 38, label: "MODERATE", keywords: ["inflasi", "suku bunga", "rupiah"] },
  },
  metadata: {
    sources: ["kompas", "antara", "detik", "cnbcid"],
    generated_at: new Date().toISOString(),
    cache_hit: false,
    latency_ms: 312,
    confidence: 0.84,
  },
}
