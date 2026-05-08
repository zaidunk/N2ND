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

export interface TrendPoint { year: number; value: number }

// Finance
export interface CoinData {
  id: string
  symbol: string
  name: string
  priceUsd: number
  priceIdr: number
  change24h: number
  history?: number[]
}

export interface ForexPair {
  pair: string
  from: string
  to: string
  rate: number
  history?: number[]
}

export interface StockData {
  name: string
  ticker: string
  price: number
  change: number
  type: "index" | "commodity"
  history?: number[]
}

export interface FinanceData {
  btcUsd?: number
  btcChange?: number
  ethUsd?: number
  ihsg?: number
  ihsgChange?: number
  usdIdr?: number
  sp500?: number
  sp500Change?: number
  goldUsd?: number
  goldChange?: number
  fearGreed?: number
  fearGreedLabel?: string
  biRate: number
  crypto: CoinData[]
  forex: ForexPair[]
  markets: StockData[]
  fetchedAt: string
}

// Trends
export interface TrendItem { title: string; traffic?: string }
export interface TrendsData { trending: TrendItem[]; fetchedAt: string }

// YouTube Live Streams
export interface StreamItem {
  label: string
  handle: string
  channelId: string
  videoId?: string
  url: string
  category: "news" | "realtime"
}

// World Bank / IMF
export interface WorldBankPoint { year: number; value: number; isProjection?: boolean }
export interface WorldBankSeries {
  id: string
  label: string
  unit: string
  source: string
  points: WorldBankPoint[]
  latest?: number
  change?: number
}

// Prodi
export interface ProdiEntry {
  id: string
  name: string
  faculty: string
  keywords: string[]
}
