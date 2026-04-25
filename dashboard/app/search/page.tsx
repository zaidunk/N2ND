import { Suspense } from "react"
import { search, getMarket, MOCK_BUNDLE } from "@/lib/api"
import type { SearchBundle } from "@/lib/types"
import SearchBar from "@/components/search/SearchBar"
import SearchResults from "@/components/search/SearchResults"
import { formatNumber, formatPct, tensionColor, tensionBg } from "@/lib/utils"
import Link from "next/link"
import { Download } from "lucide-react"

interface Props { searchParams: Promise<{ q?: string }> }

async function Sidebar({ bundle }: { bundle: SearchBundle }) {
  const cb      = bundle.context_bundle
  const tension = cb.tension
  const market  = cb.market_signals

  return (
    <aside className="flex flex-col gap-4">
      {/* Tension */}
      {tension && (
        <div className={`card border ${tensionBg(tension.score)}`}>
          <div className="mb-1 text-xs font-extrabold uppercase tracking-widest text-muted">Tension Score</div>
          <div className={`text-3xl font-extrabold ${tensionColor(tension.score)}`}>
            {tension.score}<span className="text-sm">/100</span>
          </div>
          <div className={`text-sm font-extrabold ${tensionColor(tension.score)}`}>{tension.label}</div>
          {tension.keywords?.length ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {tension.keywords.map(k => (
                <span key={k} className="badge-blue text-xs">{k}</span>
              ))}
            </div>
          ) : null}
        </div>
      )}

      {/* Market */}
      {market && (
        <div className="card">
          <div className="mb-3 text-xs font-extrabold uppercase tracking-widest text-muted">Sinyal Pasar</div>
          <div className="flex flex-col gap-2">
            {market.ihsg?.value && (
              <div className="flex justify-between text-xs font-bold">
                <span className="text-muted">IHSG</span>
                <span className="text-text">
                  {formatNumber(market.ihsg.value, { decimals: 0 })}
                  {market.ihsg.change_pct != null && (
                    <span className={`ml-1 ${market.ihsg.change_pct >= 0 ? "text-positive" : "text-negative"}`}>
                      {formatPct(market.ihsg.change_pct)}
                    </span>
                  )}
                </span>
              </div>
            )}
            {market.usd_idr?.value && (
              <div className="flex justify-between text-xs font-bold">
                <span className="text-muted">USD/IDR</span>
                <span className="text-text">Rp {formatNumber(market.usd_idr.value, { decimals: 0 })}</span>
              </div>
            )}
            {market.bi_rate != null && (
              <div className="flex justify-between text-xs font-bold">
                <span className="text-muted">BI Rate</span>
                <span className="text-text">
                  {typeof market.bi_rate === "number" ? market.bi_rate : market.bi_rate?.value}%
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BPS */}
      {cb.stats?.length > 0 && (
        <div className="card">
          <div className="mb-3 text-xs font-extrabold uppercase tracking-widest text-muted">Data BPS</div>
          <div className="flex flex-col gap-2">
            {cb.stats.slice(0, 5).map((s, i) => (
              <div key={i} className="flex justify-between gap-2 text-xs font-bold">
                <span className="truncate text-muted">{s.indicator}</span>
                <span className="shrink-0 text-text">
                  {s.latest_value ?? "—"} {s.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Entity Graph */}
      {cb.entity_graph?.entities?.length > 0 && (
        <div className="card">
          <div className="mb-3 text-xs font-extrabold uppercase tracking-widest text-muted">Entitas Utama</div>
          <div className="flex flex-col gap-2">
            {cb.entity_graph.entities.slice(0, 7).map((e, i) => (
              <div key={i} className="flex items-center justify-between text-xs font-bold">
                <span className="truncate text-text">{e.name}</span>
                <span className="ml-2 shrink-0 text-muted">
                  {e.mentions}× · {e.cross_sources} sumber
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export CTA */}
      <Link
        href={`/export?q=${encodeURIComponent(bundle.query)}`}
        className="btn-primary flex items-center justify-center gap-2"
      >
        <Download size={14} />
        Export ke LLM
      </Link>
    </aside>
  )
}

export default async function SearchPage({ searchParams }: Props) {
  const { q = "" } = await searchParams
  const query = q.trim()

  let bundle: SearchBundle | null = null
  let error: string | null = null

  if (query) {
    try {
      bundle = await search(query, { limit: 15 })
    } catch {
      // fallback to mock for dev
      bundle = { ...MOCK_BUNDLE, query }
      error = "API tidak tersedia — menampilkan data contoh."
    }
  }

  const articles = bundle?.context_bundle.news ?? []

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Search bar */}
      <div className="mb-8">
        <Suspense>
          <SearchBar defaultValue={query} size="md" />
        </Suspense>
      </div>

      {!query && (
        <div className="card py-20 text-center text-sm font-bold text-muted">
          Masukkan kata kunci untuk mulai mencari.
        </div>
      )}

      {query && bundle && (
        <>
          {error && (
            <div className="mb-4 rounded-lg border border-accent/30 bg-accent/10 px-4 py-2 text-xs font-bold text-accent">
              {error}
            </div>
          )}
          <div className="mb-4 flex items-center gap-3">
            <h1 className="text-lg font-extrabold text-text">
              Hasil untuk{" "}
              <span className="text-primary">"{query}"</span>
            </h1>
            <span className="text-xs font-bold text-muted">
              {articles.length} artikel
              {bundle.metadata?.latency_ms ? ` · ${bundle.metadata.latency_ms}ms` : ""}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <SearchResults articles={articles} query={query} />
            </div>
            <Sidebar bundle={bundle} />
          </div>
        </>
      )}
    </div>
  )
}
