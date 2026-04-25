import Link from "next/link"
import { LayoutDashboard } from "lucide-react"
import NavbarUserMenu from "./NavbarUserMenu"
import { createServerSupabase } from "@/lib/supabase-server"

export default async function Navbar() {
  let userInfo: { email?: string; tier?: string } | null = null
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      userInfo = {
        email: user.email,
        tier: (user.user_metadata as { tier?: string })?.tier ?? "free",
      }
    }
  } catch { /* silently fail during static/build contexts */ }

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-extrabold tracking-tight text-text">
            n2nd<span className="text-primary">.</span>
          </span>
          <span className="hidden rounded bg-primary/15 px-1.5 py-0.5 text-xs font-bold text-primary sm:inline">
            by Xolvon.ai
          </span>
        </Link>

        <div className="flex items-center gap-1 rounded-md border border-border bg-surface2 px-3 py-1.5 text-xs font-bold text-muted">
          <LayoutDashboard size={13} />
          <span>One-Page Intelligence</span>
        </div>

        <NavbarUserMenu user={userInfo} />
      </div>
    </nav>
  )
}
