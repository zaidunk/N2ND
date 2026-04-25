import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatIdr(n?: number): string {
  if (!n) return "—"
  if (n >= 1_000_000_000_000) return `Rp ${(n / 1_000_000_000_000).toFixed(2)}T`
  if (n >= 1_000_000_000)     return `Rp ${(n / 1_000_000_000).toFixed(1)}M`
  if (n >= 1_000_000)         return `Rp ${(n / 1_000_000).toFixed(2)}Jt`
  if (n >= 1_000)             return `Rp ${(n / 1_000).toFixed(0)}rb`
  return `Rp ${n.toFixed(0)}`
}

export function formatUsd(n?: number): string {
  if (!n) return "—"
  if (n >= 1_000) return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
  if (n >= 1)     return `$${n.toFixed(2)}`
  return `$${n.toFixed(4)}`
}

export function formatChange(n?: number): string {
  if (n == null) return ""
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`
}

export function changeClass(n?: number): string {
  if (!n) return "text-muted"
  return n >= 0 ? "text-emerald-400" : "text-red-400"
}
