import { NextResponse } from "next/server"
import type { Article } from "@/lib/types"

const RSS_SOURCES = [
  { id: "antara",  url: "https://www.antaranews.com/rss/terkini.xml",  lang: "id" },
  { id: "kompas",  url: "https://rss.kompas.com/rss/xml/tag/topheadlines", lang: "id" },
  { id: "tempo",   url: "https://rss.tempo.co/",                      lang: "id" },
  { id: "reuters", url: "https://feeds.reuters.com/reuters/topNews",  lang: "en" },
  { id: "bbc",     url: "http://feeds.bbci.co.uk/news/rss.xml",       lang: "en" },
]

function extractItems(xml: string, sourceId: string, lang: string): Article[] {
  const items = xml.match(/<item[^>]*>[\s\S]*?<\/item>/g) ?? []
  return items.slice(0, 8).map((item) => {
    const title = (item.match(/<title><!\[CDATA\[(.+?)\]\]><\/title>/) ??
                   item.match(/<title>([^<]+)<\/title>/))?.[1]?.trim() ?? ""
    const link  = (item.match(/<link>([^<]+)<\/link>/) ??
                   item.match(/<link\s[^>]*href="([^"]+)"/))?.[1]?.trim() ?? ""
    const pub   = item.match(/<pubDate>([^<]+)<\/pubDate>/)?.[1]?.trim()
    const desc  = (item.match(/<description><!\[CDATA\[(.+?)\]\]><\/description>/) ??
                   item.match(/<description>([^<]+)<\/description>/))?.[1]
                   ?.replace(/<[^>]+>/g, "").trim().slice(0, 160)
    return { title, link, summary: desc, published: pub, source: sourceId, source_id: sourceId, lang }
  }).filter(a => a.title && a.link)
}

export const revalidate = 300

export async function GET() {
  const results = await Promise.allSettled(
    RSS_SOURCES.map(async ({ id, url, lang }) => {
      const r = await fetch(url, { next: { revalidate: 300 }, headers: { "User-Agent": "n2nd/2.0" } })
      if (!r.ok) return []
      return extractItems(await r.text(), id, lang)
    })
  )

  const articles: Article[] = results
    .flatMap(r => r.status === "fulfilled" ? r.value : [])
    .filter(a => a.title)
    .slice(0, 40)

  return NextResponse.json({ articles, count: articles.length })
}
