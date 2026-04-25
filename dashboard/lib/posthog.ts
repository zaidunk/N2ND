"use client"

import posthog from "posthog-js"

let _initialized = false

export function initPostHog() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com"

  if (!key || _initialized || typeof window === "undefined") return
  posthog.init(key, {
    api_host: host,
    capture_pageview: false,
    persistence: "localStorage",
  })
  _initialized = true
}

export function trackSearch(query: string) {
  if (!_initialized) return
  posthog.capture("search", { query })
}

export function trackExport(useCase: string, target: string) {
  if (!_initialized) return
  posthog.capture("export", { use_case: useCase, ai_target: target })
}

export { posthog }
