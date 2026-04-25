export interface Entity {
  name: string
  type: string
  count: number
  mentions?: number
  cross_sources?: number
  prominence_score?: number
}

export interface Article {
  id?: string
  content_hash?: string
  title: string
  source_id: string
  source_type?: string
  published_at?: string
  published?: string
  body?: string
  summary?: string
  ai_summary?: string
  topics: string[]
  entities: Entity[]
  sentiment?: number
  tension_score?: number
  authority_score?: number
  relevance_score?: number
  link?: string
  lang?: string
}

export interface BPSStat {
  category: string
  indicator: string
  unit: string
  latest_year: string
  latest_value: number | null
  series: Array<{ year: string; value: number }>
}

export interface MarketSignals {
  ihsg?: { value?: number; change?: number; change_pct?: number }
  usd_idr?: { value?: number }
  bi_rate?: number | { value?: number }
  fear_greed?: { value?: number; label?: string }
  crypto?: Record<string, { idr?: number; usd?: number; change_24h?: number }>
  indonesia?: { ihsg?: number; change?: number }
  commodities?: Record<string, { value?: number; change?: number }>
}

export interface Tension {
  score: number
  label: string
  keywords?: string[]
}

export interface EntityGraphItem {
  name: string
  type: string
  mentions: number
  cross_sources: number
  prominence_score: number
}

export interface SearchBundle {
  query: string
  context_bundle: {
    news: Article[]
    stats: BPSStat[]
    market_signals: MarketSignals
    entity_graph: { entities: EntityGraphItem[] }
    tension: Tension
  }
  metadata: {
    sources: string[]
    generated_at: string
    cache_hit: boolean
    latency_ms: number
    confidence?: number
  }
}

export interface FeedResponse {
  articles: Article[]
  count: number
  updated_at?: string
}

export interface MarketResponse {
  indicators: MarketSignals
  crypto: Record<string, { idr?: number; usd?: number; change_24h?: number }>
  tension: Tension
}

export interface TrendsResponse {
  generated_at: string
  categories: Record<string, { keywords: string[]; live_signals: string[] }>
}

export interface MacroSnapshotResponse {
  generated_at: string
  bps: Record<string, unknown>
  ojk: Record<string, unknown>
  idx: Record<string, unknown>
  bank_indonesia_proxy: Record<string, unknown>
  world_bank: {
    gdp_growth?: number | null
    inflation?: number | null
    unemployment?: number | null
  }
  imf: {
    real_gdp_growth_latest?: number | null
    year?: string | null
  }
}

export type UseCase =
  | "analisis_berita"
  | "riset_ekonomi"
  | "monitoring_pasar"
  | "risk_assessment"
  | "general"

export type AITarget = "chatgpt" | "claude" | "gemini"
