import { getFeed } from "@/lib/api"
import type { Article } from "@/lib/types"
import ArticleCard from "@/components/feed/ArticleCard"
import { SOURCE_LABELS, TOPIC_LABELS } from "@/lib/utils"

export const revalidate = 300

interface Props { searchParams: Promise<{ source?: string; topic?: string }> }

export default async function FeedPage({ searchParams }: Props) {
  const { source, topic } = await searchParams

  let articles: Article[] = []
  let updatedAt: string | undefined

  try {
    const data = await getFeed({ source, limit: 40 })
    articles = data.articles ?? []
    updatedAt = data.updated_at
  } catch {
    articles = []
  }

  const filtered = topic
    ? articles.filter(a => (a.topics ?? []).includes(topic))
    : articles

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-xl font-extrabold text-text">Feed Terkini</h1>
        {updatedAt && (
          <span className="text-xs font-bold text-muted">
            Update: {new Date(updatedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>

      {/* Source filter */}
      <div className="mb-3 flex flex-wrap gap-2">
        <a
          href="/feed"
          className={`badge-blue text-xs ${!source ? "bg-primary text-white" : ""}`}
        >
          Semua
        </a>
        {Object.entries(SOURCE_LABELS).map(([key, label]) => (
          <a
            key={key}
            href={`/feed?source=${key}`}
            className={`badge-blue text-xs ${source === key ? "bg-primary text-white" : ""}`}
          >
            {label}
          </a>
        ))}
      </div>

      {/* Topic filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        <a
          href={source ? `/feed?source=${source}` : "/feed"}
          className={`badge-blue text-xs ${!topic ? "bg-accent/80 text-bg" : ""}`}
        >
          Semua Topik
        </a>
        {Object.entries(TOPIC_LABELS).map(([key, label]) => (
          <a
            key={key}
            href={`/feed?${source ? `source=${source}&` : ""}topic=${key}`}
            className={`badge-blue text-xs ${topic === key ? "bg-accent/80 text-bg" : ""}`}
          >
            {label}
          </a>
        ))}
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((a, i) => (
            <ArticleCard key={a.id ?? i} article={a} />
          ))}
        </div>
      ) : (
        <div className="card py-20 text-center text-sm font-bold text-muted">
          Tidak ada artikel. Coba filter lain.
        </div>
      )}
    </div>
  )
}
