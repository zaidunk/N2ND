import { NextResponse } from "next/server"
import type { TrendsData, TrendItem } from "@/lib/types"

export const revalidate = 1800

export async function GET() {
  const data: TrendsData = { trending: [], fetchedAt: new Date().toISOString() }

  try {
    const r = await fetch(
      "https://trends.google.com/trends/trendingsearches/daily/rss?geo=ID",
      { signal: AbortSignal.timeout(8000), headers: { "User-Agent": "n2nd/2.0", "Accept": "application/rss+xml, application/xml, text/xml" } }
    )
    if (r.ok) {
      const xml = await r.text()
      const items = xml.match(/<item[^>]*>[\s\S]*?<\/item>/g) ?? []
      data.trending = items.slice(0, 20).map((item): TrendItem => {
        const title = (item.match(/<title><!\[CDATA\[(.+?)\]\]><\/title>/) ??
                       item.match(/<title>([^<]+)<\/title>/))?.[1]?.trim() ?? ""
        const traffic = item.match(/<ht:approx_traffic>([^<]+)<\/ht:approx_traffic>/)?.[1]?.trim()
        return { title, traffic }
      }).filter(t => t.title)
    }
  } catch { /* fallback: empty trending */ }

  return NextResponse.json(data)
}
