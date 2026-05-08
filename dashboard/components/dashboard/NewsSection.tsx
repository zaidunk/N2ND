"use client"
import { useState, useMemo, useEffect } from "react"
import type { Article } from "@/lib/types"
import GptButton from "@/components/ui/GptButton"

type G = Window & { __n2nd_articles?: Article[] }

interface Props { articles: Article[] }
const LIVE_NEWS_URL = "https://n2nd-worker.xolvoncollective.workers.dev/news"

const SOURCE_LABELS: Record<string, string> = {
  antara: "Antara", tempo: "Tempo", detik: "Detik",
  cnn_id: "CNN ID", cnbc_id: "CNBC ID", tribun: "Tribun",
  kumparan: "Kumparan", liputan6: "Liputan6", okezone: "Okezone",
  merdeka: "Merdeka", kompas: "Kompas", republika: "Republika",
  bisnis: "Bisnis", medcom: "Medcom", suara: "Suara",
  inews: "iNews", sindonews: "Sindo", viva: "Viva",
  jawapos: "JawaPos", kontan: "Kontan", jakpost: "Jak Post",
  beritasatu: "Beritasatu", dw_id: "DW ID", dw_en: "DW EN", bbc: "BBC",
  aljazeera: "Al Jazeera", reuters: "Reuters", guardian: "Guardian",
  cna: "CNA", scmp: "SCMP", nikkei: "Nikkei",
  france24: "France24", euronews: "Euronews", rfi_id: "RFI", voa_en: "VOA",
}

const CAT_KEYWORDS: Record<string, string[]> = {
  Politik: ["presiden","pemerintah","partai","dpr","menteri","koalisi","pilkada","pemilu","kpu","mahkamah","oposisi","legislasi","kabinet","senator","gubernur","bupati","walikota","politik","pdip","golkar","gerindra","pkb","demokrat","nasdem","pks","ppp"],
  Ekonomi: ["ekonomi","rupiah","inflasi","investasi","bank","saham","ihsg","ekspor","impor","pajak","apbn","gdp","pertumbuhan","resesi","modal","perekonomian","bisnis","perusahaan","korporasi","bumn","umkm","anggaran","defisit","surplus","bi rate","ojk","bursa"],
  Teknologi: ["teknologi","ai","artificial intelligence","digital","startup","aplikasi","software","hardware","internet","siber","data","robot","blockchain","crypto","bitcoin","ethereum","chip","server","cloud","gadget","smartphone","iphone","samsung","gojek","tokopedia","shopee"],
  Kesehatan: ["kesehatan","covid","virus","penyakit","rumah sakit","dokter","obat","vaksin","pandemi","bpjs","medis","wabah","gizi","stunting","kanker","diabetes","jantung","stroke","farmasi","apotek","kemenkes","kesmas","puskesmas"],
  Lingkungan: ["lingkungan","banjir","gempa","iklim","cuaca","polusi","hutan","sampah","limbah","bencana","tsunami","kekeringan","kebakaran","mangrove","karbon","emisi","plastik","energi hijau","solar","angin","bmkg","elnino","lahan"],
  Olahraga: ["bola","liga","sepak bola","basket","badminton","tenis","olimpiade","atlet","timnas","skor","pertandingan","juara","sport","bulutangkis","lari","renang","voli","tinju","moto gp","formula","pssi","pbsi","gol","turnamen"],
  Internasional: ["international","global","china","tiongkok","usa","america","europe","eropa","war","perang","trump","biden","ukraine","rusia","israel","gaza","nato","asean","pbb","un","g20","imf","world bank","luar negeri","diplomat","kedutaan"],
  Pendidikan: ["pendidikan","sekolah","universitas","kampus","ujian","mahasiswa","siswa","kurikulum","beasiswa","wisuda","snbt","sbmptn","lpdp","mendikbud","kemdikbud","sma","smp","sd","guru","dosen","vokasi","smk"],
  Hiburan: ["film","musik","artis","selebritis","konser","viral","entertainment","drama","sinetron","youtuber","tiktok","instagram","kpop","anime","series","netflix","youtube","idol","aktor","aktris","band","lagu","album"],
}

function classifyArticle(a: Article): string {
  const text = `${a.title} ${a.summary ?? ""}`.toLowerCase()
  let best = "Lainnya"
  let bestScore = 0
  for (const [cat, kws] of Object.entries(CAT_KEYWORDS)) {
    const score = kws.reduce((n, kw) => n + (text.includes(kw) ? 1 : 0), 0)
    if (score > bestScore) { bestScore = score; best = cat }
  }
  return best
}

function timeAgo(pub?: string): string {
  if (!pub) return ""
  const d = new Date(pub)
  if (isNaN(d.getTime())) return ""
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m lalu`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}j lalu`
  return `${Math.floor(hrs / 24)}h lalu`
}

const DATE_OPTS = ["Semua", "Hari Ini", "Minggu Ini", "Bulan Ini"] as const
type DateOpt = typeof DATE_OPTS[number]
const DATE_MS: Record<DateOpt, number> = { "Semua": Infinity, "Hari Ini": 86400000, "Minggu Ini": 604800000, "Bulan Ini": 2592000000 }

const CAT_COLORS: Record<string, string> = {
  Politik: "text-amber-400 bg-amber-500/10",
  Ekonomi: "text-emerald-400 bg-emerald-500/10",
  Teknologi: "text-blue-400 bg-blue-500/10",
  Kesehatan: "text-rose-400 bg-rose-500/10",
  Lingkungan: "text-lime-400 bg-lime-500/10",
  Olahraga: "text-orange-400 bg-orange-500/10",
  Internasional: "text-purple-400 bg-purple-500/10",
  Pendidikan: "text-cyan-400 bg-cyan-500/10",
  Hiburan: "text-pink-400 bg-pink-500/10",
  Lainnya: "text-muted bg-surface2",
}

export default function NewsSection({ articles }: Props) {
  const [liveArticles, setLiveArticles] = useState<Article[]>(articles)
  const [catFilter, setCatFilter] = useState("Semua")
  const [srcFilter, setSrcFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState<DateOpt>("Semua")
  const [sortAsc, setSortAsc] = useState(false)
  const [textQ, setTextQ] = useState("")

  useEffect(() => {
    ;(window as G).__n2nd_articles = liveArticles
    const handler = (e: Event) => setTextQ((e as CustomEvent<{ q: string }>).detail.q)
    window.addEventListener("n2nd-search", handler)
    return () => window.removeEventListener("n2nd-search", handler)
  }, [liveArticles])

  useEffect(() => {
    let cancelled = false
    fetch(LIVE_NEWS_URL, { headers: { "Accept": "application/json" } })
      .then(r => r.ok ? r.json() : null)
      .then((payload: { articles?: Article[] } | null) => {
        if (!cancelled && payload?.articles?.length) setLiveArticles(payload.articles)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const classified = useMemo(
    () => liveArticles.map(a => ({ ...a, category: classifyArticle(a) })),
    [liveArticles]
  )

  const displayed = useMemo(() => {
    const now = Date.now()
    const maxMs = DATE_MS[dateFilter]
    const q = textQ.toLowerCase()
    return classified
      .filter(a => catFilter === "Semua" || a.category === catFilter)
      .filter(a => srcFilter === "all" || a.source_id === srcFilter)
      .filter(a => {
        if (maxMs === Infinity) return true
        if (!a.published) return false
        return (now - new Date(a.published).getTime()) < maxMs
      })
      .filter(a => !q || a.title.toLowerCase().includes(q) || (a.summary?.toLowerCase().includes(q) ?? false))
      .sort((a, b) => {
        const da = a.published ? new Date(a.published).getTime() : 0
        const db = b.published ? new Date(b.published).getTime() : 0
        return sortAsc ? da - db : db - da
      })
  }, [classified, catFilter, srcFilter, dateFilter, sortAsc, textQ])

  const sources = useMemo(() => Array.from(new Set(liveArticles.map(a => a.source_id))), [liveArticles])

  return (
    <section id="news-section" className="px-2 sm:px-4 py-2">
      <div className="mx-auto max-w-[1400px]">
        <div className="card p-0 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-border">
            <h2 className="section-title">Berita Terkini</h2>
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-muted">{displayed.length} artikel · {sources.length} sumber</span>
              <button
                onClick={() => setSortAsc(v => !v)}
                className="text-[9px] font-bold text-muted hover:text-primary border border-border px-1.5 py-0.5 rounded transition-colors whitespace-nowrap"
              >{sortAsc ? "Terlama ↑" : "Terbaru ↓"}</button>
            </div>
          </div>

          {/* Text search */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border/60">
            <input
              value={textQ}
              onChange={e => setTextQ(e.target.value)}
              placeholder="Cari judul atau isi berita..."
              className="flex-1 bg-surface2 border border-border rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-text placeholder:text-muted/70 focus:outline-none focus:border-primary transition-colors"
            />
            {textQ && (
              <button
                onClick={() => setTextQ("")}
                className="text-[10px] text-muted hover:text-text border border-border/50 rounded px-1.5 py-1 transition-colors shrink-0"
              >×</button>
            )}
          </div>

          {/* Category filter */}
          <div className="flex gap-1 px-4 pt-2 pb-1.5 overflow-x-auto scrollbar-thin border-b border-border/40">
            {["Semua", ...Object.keys(CAT_KEYWORDS), "Lainnya"].map(cat => (
              <button
                key={cat}
                onClick={() => setCatFilter(cat)}
                className={`shrink-0 px-2.5 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                  catFilter === cat
                    ? "bg-primary/15 text-primary border-primary/30"
                    : "border-border text-muted hover:text-text"
                }`}
              >{cat}</button>
            ))}
          </div>

          {/* Date filter + Source filter */}
          <div className="flex flex-wrap gap-1 px-4 pt-1.5 pb-1.5 border-b border-border/40">
            {DATE_OPTS.map(d => (
              <button
                key={d}
                onClick={() => setDateFilter(d)}
                className={`shrink-0 px-2 py-0.5 rounded text-[9px] font-bold border transition-colors ${
                  dateFilter === d
                    ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                    : "border-border/50 text-muted hover:text-text"
                }`}
              >{d}</button>
            ))}
            <div className="w-px h-3.5 bg-border/50 self-center mx-1" />
            <button
              onClick={() => setSrcFilter("all")}
              className={`shrink-0 px-2 py-0.5 rounded text-[9px] font-bold border transition-colors ${
                srcFilter === "all"
                  ? "bg-surface2 text-text border-border"
                  : "border-border/30 text-muted hover:text-text"
              }`}
            >Semua Sumber</button>
            {sources.map(s => (
              <button
                key={s}
                onClick={() => setSrcFilter(prev => prev === s ? "all" : s)}
                className={`shrink-0 px-2 py-0.5 rounded text-[9px] font-bold border transition-colors ${
                  srcFilter === s
                    ? "bg-surface2 text-text border-border"
                    : "border-border/30 text-muted hover:text-text"
                }`}
              >{SOURCE_LABELS[s] ?? s}</button>
            ))}
          </div>

          {/* Articles */}
          <div className="divide-y divide-border">
            {displayed.slice(0, 60).map((a, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-surface2/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <a
                    href={a.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[12px] font-bold text-text hover:text-primary transition-colors line-clamp-2 leading-snug"
                  >
                    {a.title}
                  </a>
                  {a.summary && (
                    <p className="text-[10px] text-muted mt-0.5 line-clamp-2 font-normal leading-relaxed">
                      {a.summary}
                    </p>
                  )}
                  <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${CAT_COLORS[a.category] ?? CAT_COLORS.Lainnya}`}>
                      {a.category}
                    </span>
                    <span className="text-[9px] font-bold text-muted uppercase tracking-wide">
                      {SOURCE_LABELS[a.source_id] ?? a.source_id}
                    </span>
                    {a.published && (
                      <span className="text-[9px] text-muted">{timeAgo(a.published)}</span>
                    )}
                  </div>
                </div>
                <GptButton
                  subject={`berita: "${a.title}". Tolong jelaskan: (1) apa yang sebenarnya terjadi dan latar belakang lengkapnya, (2) siapa saja pihak yang terlibat dan kepentingan masing-masing, (3) dampak nyata terhadap ekonomi, politik, atau masyarakat Indonesia, (4) perspektif dari berbagai pihak: pemerintah, pengamat, dan publik, (5) apa yang harus diwaspadai atau diantisipasi ke depan`}
                  className="mt-0.5 shrink-0"
                />
              </div>
            ))}
            {displayed.length === 0 && (
              <div className="px-4 py-8 text-center text-muted text-xs">
                Tidak ada artikel yang sesuai filter.
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  )
}
