import {
  getFeed,
  getForex,
  getMacroSnapshot,
  getMarket,
  getTrends,
  search,
} from "@/lib/api"
import OnePagerDashboard from "@/components/onepager/OnePagerDashboard"

interface Props {
  searchParams: Promise<{ q?: string }>
}

export default async function HomePage({ searchParams }: Props) {
  const { q = "" } = await searchParams
  const query = q.trim()

  let news: Awaited<ReturnType<typeof getFeed>>["articles"] = []
  if (query) {
    try {
      const bundle = await search(query, { limit: 30 })
      news = bundle.context_bundle.news ?? []
    } catch {
      news = []
    }
  } else {
    try {
      const feed = await getFeed({ limit: 30 })
      news = feed.articles ?? []
    } catch {
      news = []
    }
  }

  let market = null
  let forex = {}
  let trends = null
  let macro = null
  try { market = await getMarket() } catch { /* silent */ }
  try { forex = await getForex() } catch { /* silent */ }
  try { trends = await getTrends() } catch { /* silent */ }
  try { macro = await getMacroSnapshot() } catch { /* silent */ }

  return (
    <OnePagerDashboard
      query={query}
      market={market}
      forex={forex}
      news={news}
      trends={trends}
      macro={macro}
    />
  )
}
