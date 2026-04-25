import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—"
  try {
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffH = diffMs / 3_600_000

    if (diffH < 1)   return `${Math.round(diffH * 60)}m lalu`
    if (diffH < 24)  return `${Math.round(diffH)}j lalu`
    if (diffH < 168) return `${Math.round(diffH / 24)}h lalu`

    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
  } catch {
    return dateStr
  }
}

export function formatNumber(
  value?: number | null,
  opts?: { decimals?: number; suffix?: string; prefix?: string }
): string {
  if (value == null || isNaN(value)) return "—"
  const { decimals = 2, suffix = "", prefix = "" } = opts ?? {}

  const abs = Math.abs(value)
  if (abs >= 1_000_000_000_000) return `${prefix}${(value / 1_000_000_000_000).toFixed(decimals)}T${suffix}`
  if (abs >= 1_000_000_000)     return `${prefix}${(value / 1_000_000_000).toFixed(decimals)}M${suffix}`
  if (abs >= 1_000_000)         return `${prefix}${(value / 1_000_000).toFixed(decimals)}jt${suffix}`
  if (abs >= 1_000)             return `${prefix}${(value / 1_000).toFixed(decimals)}rb${suffix}`

  return `${prefix}${value.toFixed(decimals)}${suffix}`
}

export function formatPct(value?: number | null): string {
  if (value == null) return "—"
  const sign = value > 0 ? "+" : ""
  return `${sign}${value.toFixed(2)}%`
}

export function tensionColor(score: number): string {
  if (score >= 70) return "text-red-400"
  if (score >= 40) return "text-amber-400"
  return "text-emerald-400"
}

export function tensionBg(score: number): string {
  if (score >= 70) return "bg-red-500/15 border-red-500/30"
  if (score >= 40) return "bg-amber-500/15 border-amber-500/30"
  return "bg-emerald-500/15 border-emerald-500/30"
}

export function sentimentLabel(val?: number): string {
  if (!val) return "Netral"
  if (val > 0.3)  return "Positif"
  if (val < -0.3) return "Negatif"
  return "Netral"
}

export function sentimentClass(val?: number): string {
  if (!val) return "text-muted"
  if (val > 0.3)  return "text-positive"
  if (val < -0.3) return "text-negative"
  return "text-muted"
}

export const TOPIC_LABELS: Record<string, string> = {
  ekonomi:    "Ekonomi",
  politik:    "Politik",
  hukum:      "Hukum",
  sosial:     "Sosial",
  geopolitik: "Geopolitik",
  bencana:    "Bencana",
  teknologi:  "Teknologi",
  energi:     "Energi",
}

export const SOURCE_LABELS: Record<string, string> = {
  antara:       "Antara",
  kompas:       "Kompas",
  detik:        "Detik",
  cnnindonesia: "CNN Indonesia",
  tempo:        "Tempo",
  cnbcid:       "CNBC Indonesia",
  reuters:      "Reuters",
  bbc:          "BBC",
  aljazeera:    "Al Jazeera",
  gdelt:        "GDELT",
  bmkg:         "BMKG",
  bps:          "BPS",
}
