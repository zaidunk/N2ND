"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [error, setError]       = useState("")
  const [loading, setLoading]   = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const sb = createClient()
      const { error: err } = await sb.auth.signInWithPassword({ email, password })
      if (err) throw err
      router.push("/")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login gagal.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center px-4">
      <div className="card w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mb-1 text-xl font-extrabold text-text">
            n2nd<span className="text-primary">.</span>
          </div>
          <div className="text-sm font-bold text-muted">Masuk ke akun kamu</div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-xs font-extrabold text-muted">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="input w-full"
              placeholder="kamu@email.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-extrabold text-muted">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="input w-full"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-negative/30 bg-negative/10 px-3 py-2 text-xs font-bold text-negative">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
            {loading ? "Masuk..." : "Masuk"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs font-bold text-muted">
          Belum punya akun?{" "}
          <Link href="/auth/signup" className="text-primary hover:underline">
            Daftar
          </Link>
        </p>
      </div>
    </div>
  )
}
