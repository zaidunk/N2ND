import { Suspense } from "react"
import { search, MOCK_BUNDLE } from "@/lib/api"
import type { SearchBundle } from "@/lib/types"
import ExportBuilder from "@/components/export/ExportBuilder"
import SearchBar from "@/components/search/SearchBar"

interface Props { searchParams: Promise<{ q?: string }> }

export default async function ExportPage({ searchParams }: Props) {
  const { q = "" } = await searchParams
  const query = q.trim()

  let bundle: SearchBundle = MOCK_BUNDLE

  if (query) {
    try {
      bundle = await search(query, { limit: 15 })
    } catch {
      bundle = { ...MOCK_BUNDLE, query }
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-xl font-extrabold text-text">
          Export ke LLM
          {query && (
            <span className="ml-2 text-primary">"{query}"</span>
          )}
        </h1>
        <p className="text-xs font-bold text-muted">
          Prompt AI di atas, data terstruktur di bawah — siap dikirim ke ChatGPT, Claude, atau Gemini.
        </p>
      </div>

      {!query && (
        <div className="mb-8">
          <Suspense>
            <SearchBar size="md" />
          </Suspense>
        </div>
      )}

      <ExportBuilder bundle={bundle} />
    </div>
  )
}
