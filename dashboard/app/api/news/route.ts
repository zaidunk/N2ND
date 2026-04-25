import { NextResponse } from "next/server"
import type { Article } from "@/lib/types"

const RSS_SOURCES = [
  { id: "antara",   url: "https://www.antaranews.com/rss/terkini.xml",          lang: "id", atom: false },
  { id: "tempo",    url: "https://rss.tempo.co/",                               lang: "id", atom: false },
  { id: "detik",    url: "https://rss.detik.com/index.php/detikcom_mostpopular", lang: "id", atom: false },
  { id: "cnn_id",   url: "https://www.cnnindonesia.com/rss/",                   lang: "id", atom: false },
  { id: "cnbc_id",  url: "https://www.cnbcindonesia.com/rss",                   lang: "id", atom: false },
  { id: "tribun",   url: "https://www.tribunnews.com/rss",                       lang: "id", atom: false },
  { id: "kumparan", url: "https://kumparan.com/feed",                            lang: "id", atom: true  },
  { id: "bbc",      url: "https://feeds.bbci.co.uk/news/rss.xml",               lang: "en", atom: false },
  { id: "aljazeera",url: "https://www.aljazeera.com/xml/rss/all.xml",           lang: "en", atom: false },
]

function extractItems(xml: string, sourceId: string, lang: string, atom: boolean): Article[] {
  const tag = atom ? "entry" : "item"
  const items = xml.match(new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, "g")) ?? []
  return items.slice(0, 6).map((item): Article => {
    const title = (item.match(/<title><!\[CDATA\[(.+?)\]\]><\/title>/) ??
                   item.match(/<title>([^<]+)<\/title>/))?.[1]?.trim() ?? ""
    const link  = (item.match(/<link>([^<]+)<\/link>/) ??
                   item.match(/<link[^>]+href="([^"]+)"/) ??
                   item.match(/<link[^>]*\/?>([^<]*)</))?.[1]?.trim() ?? ""
    const pub   = (item.match(/<pubDate>([^<]+)<\/pubDate>/) ??
                   item.match(/<published>([^<]+)<\/published>/))?.[1]?.trim()
    const desc  = (item.match(/<description><!\[CDATA\[(.+?)\]\]><\/description>/) ??
                   item.match(/<description>([^<]+)<\/description>/) ??
                   item.match(/<summary[^>]*>(.+?)<\/summary>/))?.[1]
                   ?.replace(/<[^>]+>/g, "").trim().slice(0, 160)
    return { title, link, summary: desc, published: pub, source: sourceId, source_id: sourceId, lang }
  }).filter(a => a.title && a.link)
}

export const revalidate = 300

export async function GET() {
  const results = await Promise.allSettled(
    RSS_SOURCES.map(async ({ id, url, lang, atom }) => {
      const r = await fetch(url, { signal: AbortSignal.timeout(6000), headers: { "User-Agent": "n2nd/2.0" } })
      if (!r.ok) return []
      return extractItems(await r.text(), id, lang, atom)
    })
  )

  const articles: Article[] = results
    .flatMap(r => r.status === "fulfilled" ? r.value : [])
    .filter(a => a.title)
    .slice(0, 54)

  return NextResponse.json({ articles, count: articles.length })
}
