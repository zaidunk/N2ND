import type { Metadata } from "next"
import "./globals.css"
import Navbar from "@/components/layout/Navbar"

export const metadata: Metadata = {
  title: "n2nd — Dashboard Nasional Indonesia",
  description: "Indikator kunci Indonesia dari BPS, pasar, dan berita — satu halaman, real-time.",
  keywords: ["indonesia", "BPS", "ekonomi", "IHSG", "inflasi", "kemiskinan", "n2nd"],
  openGraph: {
    title: "n2nd — Dashboard Nasional Indonesia",
    description: "Indikator kunci Indonesia real-time",
    siteName: "n2nd.ai",
    type: "website",
  },
  robots: "noindex",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        {/* Set theme before React hydrates to prevent flash */}
        <script dangerouslySetInnerHTML={{ __html: `try{if(localStorage.getItem('n2nd_theme')==='light')document.documentElement.classList.add('light')}catch(e){}` }} />
      </head>
      <body className="min-h-screen bg-bg font-sans text-text antialiased">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  )
}
