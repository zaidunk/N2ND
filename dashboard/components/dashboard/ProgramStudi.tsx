"use client"
import { useState, useMemo } from "react"
import { PRODI_DATA } from "@/lib/prodi-data"
import GptButton from "@/components/ui/GptButton"

const FACULTY_COLORS: Record<string, string> = {
  "Ekonomi & Bisnis":        "text-amber-400 bg-amber-500/10 border-amber-500/20",
  "Teknik & Sains":          "text-blue-400 bg-blue-500/10 border-blue-500/20",
  "Sosial & Humaniora":      "text-purple-400 bg-purple-500/10 border-purple-500/20",
  "Kesehatan & Biologi":     "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  "Seni, Desain & Media":    "text-pink-400 bg-pink-500/10 border-pink-500/20",
  "Pertanian & Sumber Daya": "text-lime-400 bg-lime-500/10 border-lime-500/20",
  "Pendidikan & Sosial Lain":"text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
}

const PRODI_BORDER: Record<string, string> = {
  "Ekonomi & Bisnis":        "border-amber-500/30 hover:border-amber-400/50",
  "Teknik & Sains":          "border-blue-500/30 hover:border-blue-400/50",
  "Sosial & Humaniora":      "border-purple-500/30 hover:border-purple-400/50",
  "Kesehatan & Biologi":     "border-emerald-500/30 hover:border-emerald-400/50",
  "Seni, Desain & Media":    "border-pink-500/30 hover:border-pink-400/50",
  "Pertanian & Sumber Daya": "border-lime-500/30 hover:border-lime-400/50",
  "Pendidikan & Sosial Lain":"border-cyan-500/30 hover:border-cyan-400/50",
}

export default function ProgramStudi() {
  const [q, setQ] = useState("")
  const [open, setOpen] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const lower = q.toLowerCase()
    if (!lower) return PRODI_DATA
    return PRODI_DATA.filter(p =>
      p.name.toLowerCase().includes(lower) ||
      p.faculty.toLowerCase().includes(lower) ||
      p.keywords.some(k => k.toLowerCase().includes(lower))
    )
  }, [q])

  const byFaculty = useMemo(() => {
    const map: Record<string, typeof PRODI_DATA> = {}
    for (const p of filtered) {
      if (!map[p.faculty]) map[p.faculty] = []
      map[p.faculty].push(p)
    }
    return map
  }, [filtered])

  const toggle = (id: string) => setOpen(prev => prev === id ? null : id)

  return (
    <section className="px-2 sm:px-4 py-2">
      <div className="mx-auto max-w-[1400px]">
        <div className="card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-3 pb-3 border-b border-border">
            <div>
              <h2 className="section-title">Program Studi</h2>
              <p className="text-[9px] text-muted mt-0.5">Belajar Mandiri</p>
            </div>
            <span className="text-[9px] text-muted">Keyword untuk belajar lebih lanjut</span>
          </div>

          <div className="px-4 py-3 border-b border-border">
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Cari prodi atau keyword..."
              className="input text-sm"
            />
          </div>

          <div className="p-4 space-y-4">
            {Object.entries(byFaculty).map(([faculty, list]) => {
              const colorCls = FACULTY_COLORS[faculty] ?? "text-muted bg-surface2 border-border"
              return (
                <div key={faculty}>
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold border mb-2 ${colorCls}`}>
                    {faculty}
                    <span className="opacity-60">({list.length})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                    {list.map(prodi => (
                      <div key={prodi.id} className={`rounded-lg border bg-surface transition-colors overflow-hidden ${PRODI_BORDER[faculty] ?? "border-border"}`}>
                        <button
                          onClick={() => toggle(prodi.id)}
                          className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-surface2/40 transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="text-[12px] font-extrabold text-text leading-tight">{prodi.name}</div>
                            <div className="mt-1">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${colorCls}`}>
                                {prodi.keywords.length} keyword
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            <GptButton
                              subject={`program studi ${prodi.name} di Indonesia. Analisis komprehensif: (1) gambaran umum prodi dan relevansinya di era digital 2025, (2) prospek karir terbaik dan industri yang paling banyak menyerap lulusan, (3) 5 topik skripsi atau riset yang sedang trending dan bernilai tinggi, (4) skill teknis dan soft skill wajib yang dicari rekruter saat ini, (5) estimasi gaji fresh graduate vs 5 tahun pengalaman di Indonesia, (6) kampus dengan program ${prodi.name} terbaik beserta keunggulannya, (7) perbedaan dengan prodi serupa dan kapan harus pilih ${prodi.name}`}
                              label="GPT"
                              className="text-[9px] px-1.5 py-0.5"
                            />
                            <span className="text-muted text-[10px]">{open === prodi.id ? "▲" : "▼"}</span>
                          </div>
                        </button>
                        {open === prodi.id && (
                          <div className="border-t border-border/50 bg-surface2/20">
                            {prodi.keywords.map((kw, ki) => (
                              <div
                                key={ki}
                                className="grid items-start gap-2 px-3 py-1 border-b border-border/20 last:border-0 hover:bg-surface2/40"
                                style={{ gridTemplateColumns: "1fr auto" }}
                              >
                                <span className="text-[10px] text-text font-bold leading-snug break-words">
                                  <span className="text-muted/60">{ki + 1}.</span>{" "}{kw}
                                </span>
                                <GptButton
                                  subject={`topik "${kw}" dalam program studi ${prodi.name}. Jelaskan: (1) apa ini dan mengapa penting di 2025, (2) aplikasi nyata di industri Indonesia, (3) skill spesifik yang perlu dikuasai, (4) peluang karir dan gaji terkait, (5) sumber belajar terbaik dan sertifikasi relevan, (6) contoh perusahaan Indonesia yang aktif butuh keahlian ini`}
                                  label="?"
                                  className="shrink-0"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
            {filtered.length === 0 && (
              <div className="py-8 text-center text-muted text-sm">
                Tidak ada prodi yang sesuai dengan pencarian.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
