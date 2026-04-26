const STREAMS = [
  {
    label: "CNN Indonesia",
    desc: "Breaking news & current affairs",
    url: "https://www.youtube.com/@CNNIndonesia/live",
    color: "border-red-500/30 hover:border-red-500/60",
    accent: "text-red-400",
  },
  {
    label: "Kompas TV",
    desc: "Live streaming berita nasional",
    url: "https://www.youtube.com/@kompastv/live",
    color: "border-blue-500/30 hover:border-blue-500/60",
    accent: "text-blue-400",
  },
  {
    label: "CNBC Indonesia",
    desc: "Bisnis, ekonomi & pasar saham live",
    url: "https://www.youtube.com/@CNBCIndonesia/live",
    color: "border-emerald-500/30 hover:border-emerald-500/60",
    accent: "text-emerald-400",
  },
]

export default function Hero() {
  return (
    <section className="pt-4 pb-3 px-3">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-3 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-text tracking-tight leading-none">
            N2ND{" "}
            <span className="text-muted text-xl sm:text-2xl font-bold">by Xolvon.ai</span>
          </h1>
          <p className="text-[10px] text-muted mt-1.5 tracking-widest uppercase">
            Intelligence Dashboard · Data Indonesia Real-Time
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {STREAMS.map(s => (
            <a
              key={s.url}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`card overflow-hidden transition-all duration-150 ${s.color} group`}
            >
              <div className="flex flex-col items-center justify-center py-5 px-3 text-center gap-2">
                <div className="flex items-center gap-1.5 text-[9px] font-extrabold text-muted uppercase tracking-widest">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse-slow`} />
                  Live
                </div>
                <div className={`text-4xl opacity-60 group-hover:opacity-90 transition-opacity ${s.accent}`}>▶</div>
                <div>
                  <div className="text-[13px] font-extrabold text-text">{s.label}</div>
                  <div className="text-[10px] text-muted mt-0.5">{s.desc}</div>
                </div>
                <span className={`mt-1 inline-flex items-center gap-1 rounded border border-current px-2 py-0.5 text-[9px] font-extrabold ${s.accent} opacity-70 group-hover:opacity-100 transition-opacity`}>
                  Tonton di YouTube →
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
