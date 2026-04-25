"use client"

import { useState, useMemo } from "react"
import type { Article } from "@/lib/types"
import ArticleCard from "@/components/feed/ArticleCard"
import FilterPanel from "@/components/search/FilterPanel"

interface SearchResultsProps {
  articles: Article[]
  query: string
}

export default function SearchResults({ articles, query }: SearchResultsProps) {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [selectedSources, setSelectedSources] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<"relevance" | "date">("relevance")

  function toggleTopic(t: string) {
    setSelectedTopics(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }
  function toggleSource(s: string) {
    setSelectedSources(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  const filtered = useMemo(() => {
    let list = articles
    if (selectedTopics.length) {
      list = list.filter(a => (a.topics ?? []).some(t => selectedTopics.includes(t)))
    }
    if (selectedSources.length) {
      list = list.filter(a => selectedSources.includes(a.source_id))
    }
    if (sortBy === "date") {
      list = [...list].sort((a, b) => {
        const da = new Date(a.published_at ?? a.published ?? 0).getTime()
        const db = new Date(b.published_at ?? b.published ?? 0).getTime()
        return db - da
      })
    } else {
      list = [...list].sort((a, b) => (b.relevance_score ?? 0) - (a.relevance_score ?? 0))
    }
    return list
  }, [articles, selectedTopics, selectedSources, sortBy])

  return (
    <div className="flex flex-col gap-4">
      <FilterPanel
        selectedTopics={selectedTopics}
        selectedSources={selectedSources}
        onTopicToggle={toggleTopic}
        onSourceToggle={toggleSource}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />
      <div className="text-xs font-bold text-muted">
        {filtered.length} dari {articles.length} artikel
      </div>
      <div className="flex flex-col gap-3">
        {filtered.map((a, i) => (
          <ArticleCard key={a.id ?? i} article={a} showExport query={query} />
        ))}
        {!filtered.length && (
          <div className="card py-12 text-center text-sm font-bold text-muted">
            Tidak ada artikel dengan filter ini.
          </div>
        )}
      </div>
    </div>
  )
}
