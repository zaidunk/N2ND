"use client"

import { TOPIC_LABELS, SOURCE_LABELS } from "@/lib/utils"

interface FilterPanelProps {
  selectedTopics: string[]
  selectedSources: string[]
  onTopicToggle: (t: string) => void
  onSourceToggle: (s: string) => void
  sortBy: "relevance" | "date"
  onSortChange: (v: "relevance" | "date") => void
}

export default function FilterPanel({
  selectedTopics, selectedSources, onTopicToggle, onSourceToggle, sortBy, onSortChange,
}: FilterPanelProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-border pb-3">
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(TOPIC_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => onTopicToggle(key)}
            className={`badge-blue cursor-pointer text-xs transition-colors ${
              selectedTopics.includes(key)
                ? "bg-primary text-white"
                : "hover:bg-primary/20"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <span className="text-xs font-bold text-muted">Urut:</span>
        <button
          onClick={() => onSortChange("relevance")}
          className={`badge-blue text-xs ${sortBy === "relevance" ? "bg-primary text-white" : ""}`}
        >
          Relevansi
        </button>
        <button
          onClick={() => onSortChange("date")}
          className={`badge-blue text-xs ${sortBy === "date" ? "bg-primary text-white" : ""}`}
        >
          Terbaru
        </button>
      </div>
    </div>
  )
}
