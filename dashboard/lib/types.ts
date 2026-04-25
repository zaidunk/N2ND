export interface Article {
  title: string
  link: string
  summary?: string
  published?: string
  source: string
  source_id: string
  lang?: string
}

export interface BPSIndicator {
  label: string
  value: string
  sub: string
  trend: string
  trendUp: boolean
  color: "green" | "red" | "blue" | "amber"
}

export interface TrendPoint {
  year: number
  value: number
}

export interface MarketData {
  ihsg?: number
  ihsgChange?: number
  usdIdr?: number
  btcUsd?: number
  btcChange?: number
  biRate?: number
}
