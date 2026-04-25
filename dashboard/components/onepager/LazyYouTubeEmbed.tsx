"use client"

import { useEffect, useRef, useState } from "react"

interface LazyYouTubeEmbedProps {
  title: string
  channelId: string
  sourceUrl?: string
}

export default function LazyYouTubeEmbed({ title, channelId, sourceUrl }: LazyYouTubeEmbedProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [canMount, setCanMount] = useState(false)
  const [hasError, setHasError] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const thumbnail = `https://i.ytimg.com/vi/live_stream/hqdefault.jpg?channel=${encodeURIComponent(channelId)}`
  const embedUrl = `https://www.youtube-nocookie.com/embed/live_stream?channel=${encodeURIComponent(channelId)}&autoplay=1`

  useEffect(() => {
    const node = containerRef.current
    if (!node || canMount) return

    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries.some((entry) => entry.isIntersecting)
        if (isVisible) {
          setCanMount(true)
          observer.disconnect()
        }
      },
      { rootMargin: "160px 0px" },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [canMount])

  if (hasError && sourceUrl) {
    return (
      <a
        href={sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="card flex h-36 items-center justify-center text-center text-xs font-extrabold text-primary hover:text-accent"
      >
        Live embed tidak tersedia. Buka stream langsung
      </a>
    )
  }

  return (
    <div ref={containerRef} className="card overflow-hidden">
      {!canMount ? (
        <div className="h-36 w-full animate-pulse bg-surface2" />
      ) : !isPlaying ? (
        <button
          type="button"
          onClick={() => setIsPlaying(true)}
          className="group relative block w-full text-left"
          aria-label={`Play ${title}`}
        >
          <img
            src={thumbnail}
            alt={title}
            loading="lazy"
            className="h-36 w-full object-cover opacity-80 transition group-hover:opacity-100"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <span className="rounded-full border border-white/30 bg-white/20 px-3 py-1 text-xs font-extrabold text-white">
              Play Live
            </span>
          </div>
          <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-xs font-extrabold text-white">
            {title}
          </div>
        </button>
      ) : (
        <iframe
          title={title}
          src={embedUrl}
          className="h-36 w-full"
          loading="lazy"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          onError={() => setHasError(true)}
          allowFullScreen
        />
      )}
    </div>
  )
}
