import type { Metadata } from "next"
import "./globals.css"
import Navbar from "@/components/layout/Navbar"
import MarketBar from "@/components/market/MarketBar"
import PostHogProvider from "@/components/analytics/PostHogProvider"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "n2nd — Attention Boost Intelligence",
  description: "Real-time Indonesian data intelligence. Berita, ekonomi, pasar — satu konteks, siap kirim ke AI.",
  keywords: ["indonesia", "intelijen data", "berita", "IHSG", "ekonomi", "n2nd"],
  openGraph: {
    title: "n2nd — Attention Boost",
    description: "Real-time Indonesian data intelligence",
    siteName: "n2nd.ai",
    type: "website",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-bg font-sans text-text antialiased">
        <PostHogProvider>
          <Navbar />
          <Suspense fallback={<div className="h-9 border-b border-border bg-surface" />}>
            <MarketBar />
          </Suspense>
          <main>{children}</main>
        </PostHogProvider>
      </body>
    </html>
  )
}
