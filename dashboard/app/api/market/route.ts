import { NextResponse } from "next/server"
import type { MarketData } from "@/lib/types"

export const revalidate = 60

async function fetchJSON(url: string): Promise<unknown> {
  const r = await fetch(url, { next: { revalidate: 60 }, headers: { "User-Agent": "n2nd/2.0" } })
  if (!r.ok) throw new Error(`${url} → ${r.status}`)
  return r.json()
}

export async function GET() {
  const data: MarketData = {}

  const [forex, btc, ihsg] = await Promise.allSettled([
    fetchJSON("https://open.er-api.com/v6/latest/USD"),
    fetchJSON("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true"),
    fetchJSON("https://query1.finance.yahoo.com/v8/finance/chart/%5EJKSE?interval=1d&range=1d"),
  ])

  if (forex.status === "fulfilled") {
    const r = (forex.value as { rates?: Record<string, number> }).rates ?? {}
    data.usdIdr = r["IDR"]
  }

  if (btc.status === "fulfilled") {
    const b = (btc.value as { bitcoin?: { usd?: number; usd_24h_change?: number } }).bitcoin ?? {}
    data.btcUsd    = b.usd
    data.btcChange = b.usd_24h_change
  }

  if (ihsg.status === "fulfilled") {
    const chart = (ihsg.value as { chart?: { result?: Array<{ meta?: { regularMarketPrice?: number; previousClose?: number } }> } }).chart?.result?.[0]?.meta ?? {}
    data.ihsg       = chart.regularMarketPrice
    data.ihsgChange = chart.regularMarketPrice && chart.previousClose
      ? ((chart.regularMarketPrice - chart.previousClose) / chart.previousClose) * 100
      : undefined
  }

  data.biRate = 5.75

  return NextResponse.json(data)
}
