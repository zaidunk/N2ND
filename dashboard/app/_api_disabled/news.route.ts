import { NextResponse } from "next/server"
import type { Article } from "@/lib/types"

const RSS_SOURCES = [
  { id: "antara",     url: "https://www.antaranews.com/rss/terkini.xml",             lang: "id", atom: false },
  { id: "tempo",      url: "https://rss.tempo.co/",                                  lang: "id", atom: false },
  { id: "detik",      url: "https://rss.detik.com/index.php/detikcom_mostpopular",   lang: "id", atom: false },
  { id: "cnn_id",     url: "https://www.cnnindonesia.com/rss/",                      lang: "id", atom: false },
  { id: "cnbc_id",    url: "https://www.cnbcindonesia.com/rss",                      lang: "id", atom: false },
  { id: "tribun",     url: "https://www.tribunnews.com/rss",                         lang: "id", atom: false },
  { id: "kumparan",   url: "https://kumparan.com/feed",                              lang: "id", atom: true  },
  { id: "liputan6",   url: "https://www.liputan6.com/rss",                           lang: "id", atom: false },
  { id: "okezone",    url: "https://www.okezone.com/feed",                           lang: "id", atom: false },
  { id: "merdeka",    url: "https://www.merdeka.com/feed",                           lang: "id", atom: false },
  { id: "kompas",     url: "https://www.kompas.com/arc/outboundfeeds/rss/",          lang: "id", atom: false },
  { id: "republika",  url: "https://www.republika.co.id/rss",                        lang: "id", atom: false },
  { id: "bisnis",     url: "https://www.bisnis.com/feed",                            lang: "id", atom: false },
  { id: "medcom",     url: "https://www.medcom.id/rss",                              lang: "id", atom: false },
  { id: "suara",      url: "https://www.suara.com/feed",                             lang: "id", atom: false },
  { id: "inews",      url: "https://www.inews.id/rss",                               lang: "id", atom: false },
  { id: "sindonews",  url: "https://nasional.sindonews.com/rss",                     lang: "id", atom: false },
  { id: "viva",       url: "https://www.viva.co.id/rss",                             lang: "id", atom: false },
  { id: "jawapos",    url: "https://www.jawapos.com/feed",                           lang: "id", atom: true  },
  { id: "kontan",     url: "https://insight.kontan.co.id/rss",                       lang: "id", atom: false },
  { id: "jakpost",    url: "https://www.thejakartapost.com/feeds",                   lang: "en", atom: false },
  { id: "beritasatu", url: "https://www.beritasatu.com/rss",                         lang: "id", atom: false },
  { id: "dw_id",      url: "https://www.dw.com/id/rss",                              lang: "id", atom: false },
  { id: "bbc",        url: "https://feeds.bbci.co.uk/news/rss.xml",                 lang: "en", atom: false },
  { id: "aljazeera",  url: "https://www.aljazeera.com/xml/rss/all.xml",             lang: "en", atom: false },
  { id: "reuters",    url: "https://feeds.reuters.com/reuters/topNews",             lang: "en", atom: false },
  { id: "guardian",   url: "https://www.theguardian.com/world/rss",                 lang: "en", atom: false },
  { id: "cna",        url: "https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml&category=6511", lang: "en", atom: false },
  { id: "scmp",       url: "https://www.scmp.com/rss/2/feed",                       lang: "en", atom: false },
  { id: "nikkei",     url: "https://asia.nikkei.com/rss/feed/nar",                  lang: "en", atom: false },
]

function extractItems(xml: string, sourceId: string, lang: string, atom: boolean): Article[] {
  const tag = atom ? "entry" : "item"
  const items = xml.match(new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\/${tag}>`, "g")) ?? []
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
