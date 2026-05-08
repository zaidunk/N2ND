import Link from "next/link"

export default function HomePage() {
  return (
    <div className="relative min-h-[calc(100vh-48px)] overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-24 right-[-12%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.35),rgba(15,23,42,0))] blur-2xl animate-drift" />
        <div className="absolute -bottom-24 left-[-8%] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.25),rgba(15,23,42,0))] blur-2xl animate-drift-slow" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(15,23,42,0.92),rgba(8,12,20,0.98))]" />
      </div>

      <div className="mx-auto max-w-[1120px] px-4 py-10">
        <div className="text-center animate-fade-up">
          <p className="text-[10px] tracking-[0.35em] uppercase text-muted">N2ND Control</p>
          <h1 className="mt-3 text-3xl sm:text-5xl font-extrabold tracking-tight text-text">
            Pilih workspace utama
          </h1>
          <p className="mt-3 text-[12px] text-muted">
            Masuk ke dashboard intel atau langsung ke AttentionBoost segment lab.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <Link
            href="/insights"
            className="group card relative overflow-hidden p-5 transition-all hover:-translate-y-1 hover:border-primary/40 animate-fade-up"
            style={{ animationDelay: "120ms" }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.15),transparent_60%)] opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-muted">Insights</p>
                  <h2 className="mt-1 text-xl font-extrabold text-text">Dashboard Nasional</h2>
                </div>
                <span className="text-[11px] font-bold text-primary">Open</span>
              </div>
              <p className="mt-3 text-[12px] text-muted">
                Realtime market, indikator BPS, dan ringkasan berita global.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  "BPS + BMKG",
                  "GDELT + RSS",
                  "Market pulse",
                  "LLM export",
                ].map((tag) => (
                  <span key={tag} className="badge-blue">{tag}</span>
                ))}
              </div>
            </div>
          </Link>

          <Link
            href="/AttentionBoost"
            className="group card relative overflow-hidden p-5 transition-all hover:-translate-y-1 hover:border-amber-500/40 animate-fade-up"
            style={{ animationDelay: "200ms" }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.18),transparent_60%)] opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-muted">AttentionBoost</p>
                  <h2 className="mt-1 text-xl font-extrabold text-text">Consumer Signal Lab</h2>
                </div>
                <span className="text-[11px] font-bold text-amber-400">Open</span>
              </div>
              <p className="mt-3 text-[12px] text-muted">
                20 karakter konsumen, tone harian, buying power, dan trend ML.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  "20 segments",
                  "Daily batch",
                  "Tone mapping",
                  "Trend direction",
                ].map((tag) => (
                  <span key={tag} className="badge-amber">{tag}</span>
                ))}
              </div>
            </div>
          </Link>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-3 animate-fade-up" style={{ animationDelay: "260ms" }}>
          <div className="card p-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted">Stack</p>
            <p className="mt-1 text-[12px] text-text">Next.js 15, FastAPI, Redis, pgvector</p>
          </div>
          <div className="card p-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted">Sources</p>
            <p className="mt-1 text-[12px] text-text">BPS, BMKG, GDELT, approved RSS</p>
          </div>
          <div className="card p-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted">Mode</p>
            <p className="mt-1 text-[12px] text-text">Realtime insight + daily consumer modeling</p>
          </div>
        </div>
      </div>
    </div>
  )
}
