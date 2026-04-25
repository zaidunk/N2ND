"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"

const TRENDING = ["viral minggu ini", "bi rate", "ekonomi indonesia", "psychology trend", "8 major economy"]

interface SearchBarProps {
  defaultValue?: string
  size?: "lg" | "md" | "sm"
}

export default function SearchBar({ defaultValue = "", size = "lg" }: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function submit(q: string) {
    const trimmed = q.trim()
    if (!trimmed) return
    startTransition(() => {
      router.push(`/?q=${encodeURIComponent(trimmed)}`)
    })
  }

  if (size === "sm") {
    return (
      <form onSubmit={e => { e.preventDefault(); submit(query) }} className="relative w-full">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Cari topik, berita, data..."
          className="input w-full py-1.5 pl-8 pr-20 text-xs"
        />
        <button
          type="submit"
          disabled={isPending || !query.trim()}
          className="btn-primary absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs disabled:opacity-50"
        >
          {isPending ? "..." : "Cari"}
        </button>
      </form>
    )
  }

  const isLg = size === "lg"

  return (
    <div className={isLg ? "w-full max-w-2xl" : "w-full max-w-lg"}>
      <form
        onSubmit={e => { e.preventDefault(); submit(query) }}
        className="relative"
      >
        <Search
          size={isLg ? 20 : 16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Query topik intelijen data kamu..."
          className={`input w-full ${isLg ? "py-4 pl-12 pr-36 text-base" : "py-2.5 pl-10 pr-24 text-sm"}`}
        />
        <button
          type="submit"
          disabled={isPending || !query.trim()}
          className={`btn-primary absolute right-2 top-1/2 -translate-y-1/2 ${isLg ? "px-5 py-2" : "px-3 py-1.5 text-sm"} disabled:opacity-50`}
        >
          {isPending ? "..." : "Jalankan"}
        </button>
      </form>

      {isLg && (
        <div className="mt-3 flex flex-wrap gap-2">
          {TRENDING.map(t => (
            <button
              key={t}
              onClick={() => { setQuery(t); submit(t) }}
              className="badge-blue cursor-pointer text-xs hover:bg-primary/25 transition-colors"
            >
              {t}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
