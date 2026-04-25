import type { Article } from "@/lib/types"
import { formatDate, sentimentClass, sentimentLabel, tensionColor, SOURCE_LABELS, TOPIC_LABELS } from "@/lib/utils"
import Link from "next/link"
import { ExternalLink, Zap } from "lucide-react"
import AskAIButton from "@/components/actions/AskAIButton"

interface ArticleCardProps {
  article: Article
  showExport?: boolean
  query?: string
}

export default function ArticleCard({ article: a, showExport, query }: ArticleCardProps) {
  const source  = SOURCE_LABELS[a.source_id] ?? a.source_id.toUpperCase()
  const snippet = a.ai_summary ?? a.summary ?? a.body ?? ""
  const tension = a.tension_score ?? 0
  const rel     = a.relevance_score

  return (
    <article className="card group relative flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
          <span className="text-primary">{source}</span>
          <span className="text-muted">·</span>
          <span className="text-muted">{formatDate(a.published_at ?? a.published)}</span>
          {rel != null && (
            <>
              <span className="text-muted">·</span>
              <span className="text-muted">Relevansi {(rel * 100).toFixed(0)}%</span>
            </>
          )}
        </div>
        {tension >= 40 && (
          <span className={`flex shrink-0 items-center gap-1 text-xs font-extrabold ${tensionColor(tension)}`}>
            <Zap size={11} />
            {tension}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-sm font-extrabold leading-snug text-text">
        {a.link ? (
          <a href={a.link} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
            {a.title}
          </a>
        ) : (
          a.title
        )}
      </h3>

      {/* Snippet */}
      {snippet && (
        <p className="line-clamp-2 text-xs leading-relaxed text-muted">
          {snippet.slice(0, 200)}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {(a.topics ?? []).slice(0, 3).map(t => (
            <span key={t} className="badge-blue">
              {TOPIC_LABELS[t] ?? t}
            </span>
          ))}
          <span className={`badge text-xs font-bold ${sentimentClass(a.sentiment)}`}>
            {sentimentLabel(a.sentiment)}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-primary/40 bg-primary/10">
            <AskAIButton subject={a.title} sourceUrl={a.link} compact />
          </span>
          {showExport && query && (
            <Link
              href={`/export?q=${encodeURIComponent(query)}`}
              className="text-xs font-bold text-muted hover:text-accent transition-colors"
            >
              Export →
            </Link>
          )}
          {a.link && (
            <a
              href={a.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-primary transition-colors"
            >
              <ExternalLink size={13} />
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
