"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"

interface Props {
  user: { email?: string; tier?: string } | null
}

export default function NavbarUserMenu({ user }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  if (!user) {
    return (
      <Link href="/auth/login" className="btn-primary text-sm">
        Masuk
      </Link>
    )
  }

  async function handleLogout() {
    setLoading(true)
    const sb = createClient()
    await sb.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const isPaid = user.tier === "paid" || user.tier === "pro"

  return (
    <div className="flex items-center gap-2">
      <span className="hidden max-w-[120px] truncate text-xs font-bold text-muted sm:inline">
        {user.email}
      </span>
      <span
        className={`shrink-0 rounded px-2 py-0.5 text-xs font-extrabold ${
          isPaid ? "bg-primary/15 text-primary" : "bg-surface2 text-muted"
        }`}
      >
        {isPaid ? "Pro" : "Free"}
      </span>
      <button
        onClick={handleLogout}
        disabled={loading}
        className="btn-ghost text-sm disabled:opacity-50"
      >
        {loading ? "..." : "Keluar"}
      </button>
    </div>
  )
}
