"use client"
import { useState } from "react"
import type { TrendsData } from "@/lib/types"
import GptButton from "@/components/ui/GptButton"

interface Props { data: TrendsData }

const CATEGORIES: { label: string; keywords: string[] }[] = [
  {
    label: "Ekonomi & Bisnis",
    keywords: ["inflasi 2025","kenaikan UMP","harga BBM subsidi","IHSG naik turun","investasi reksa dana","startup unicorn baru","IPO Indonesia terbaru","UMKM digital","ekspor impor neraca","defisit APBN","suku bunga BI","kurs rupiah dolar","harga beras naik","pertumbuhan ekonomi","privatisasi BUMN"],
  },
  {
    label: "Teknologi & Startup",
    keywords: ["AI Indonesia 2025","ChatGPT update","Google Gemini","Meta AI","robot humanoid","chip AI Nvidia","quantum computing","startup fintech tutup","unicorn baru Indonesia","5G coverage Indonesia","data center RI","kripto Bitcoin halving","NFT comeback","open source AI","AGI progress"],
  },
  {
    label: "Politik & Pemerintahan",
    keywords: ["Prabowo kebijakan baru","IKN Nusantara update","Pilkada 2024 hasil","DPR RUU terbaru","korupsi KPK OTT","reshuffle kabinet","otonomi daerah","DAK APBD","pemilu 2029 dini","hubungan RI-China","ASEAN summit","IMF World Bank Indonesia","Masyarakat Ekonomi ASEAN","regulasi medsos","UU ITE revisi"],
  },
  {
    label: "Kesehatan & Sains",
    keywords: ["stunting Indonesia 2025","BPJS JKN defisit","penyakit tidak menular naik","dengue DBD wabah","obat herbal BPOM","vaksin baru","resistensi antibiotik","mental health generasi Z","telemedicine perkembangan","riset sel punca","kanker terapi baru","diabetes tipe 2","AI diagnosa medis","gizi buruk balita","polusi udara Jakarta"],
  },
  {
    label: "Gaya Hidup & Budaya",
    keywords: ["film Indonesia box office","musik indie viral","konser Indonesia 2025","budaya Korea Hallyu","skincare trend","fashion lokal brand","makanan viral TikTok","wisata domestik populer","hotel mewah baru","olahraga lari marathon","gym membership naik","gaming esports Indonesia","buku bestseller","podcast populer","kreator konten monetisasi"],
  },
  {
    label: "Lingkungan & Iklim",
    keywords: ["banjir Jakarta 2025","El Nino dampak","deforestasi Kalimantan","sawit palm oil isu","karbon kredit Indonesia","energi surya PLTS","transisi energi PLN","kendaraan listrik EV","sampah plastik laut","polusi sungai","urban heat island","cuaca ekstrem","BMKG peringatan","kebakaran hutan riau","mangrove rehabilitasi"],
  },
  {
    label: "Pasar Keuangan",
    keywords: ["Bitcoin ATH baru","Ethereum update","saham GOTO TLKM","obligasi pemerintah SBN","reksa dana terbaik","deposito bunga tinggi","emas Antam harga","dolar menguat","komoditas nikel","batu bara ekspor","minyak sawit CPO","karet kopi harga","properti apartemen","IPO BEI 2025","short selling regulasi"],
  },
  {
    label: "Pendidikan & Karir",
    keywords: ["SNBT 2025 soal","beasiswa LPDP 2025","kurikulum Merdeka evaluasi","SMK vokasi industri","guru penggerak program","coding SMA wajib","AI di kampus","startup kampus incubator","remote work Indonesia","gig economy ojol","skill gap digital","UMR vs biaya hidup","fresh graduate gaji","sertifikasi profesional","magang Kemendikbud"],
  },
]

export default function TrendsSection({ data }: Props) {
  const [openCat, setOpenCat] = useState<number | null>(null)

  return (
    <section className="px-2 sm:px-4 py-2">
      <div className="mx-auto max-w-[1400px]">
        <div className="card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-3 pb-3 border-b border-border">
            <h2 className="text-sm font-extrabold text-text">Trending & Topik</h2>
            <span className="text-[9px] text-muted">Google Trends ID</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-border">
            {/* Google Trends live */}
            <div className="p-4">
              <div className="text-[10px] font-extrabold text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Trending Sekarang
                <span className="text-muted/50 font-normal normal-case tracking-normal">
                  {data.fetchedAt ? `· ${new Date(data.fetchedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}` : ""}
                </span>
              </div>
              {data.trending.length > 0 ? (
                <ol className="space-y-1.5">
                  {data.trending.map((t, i) => (
                    <li key={i} className="flex items-center gap-2 group">
                      <span className="text-[9px] font-extrabold text-muted/50 w-4 text-right shrink-0">{i + 1}</span>
                      <span className="text-[11px] font-bold text-text flex-1 leading-tight">{t.title}</span>
                      {t.traffic && (
                        <span className="text-[9px] text-muted shrink-0">{t.traffic}</span>
                      )}
                      <GptButton subject={`topik trending Indonesia: "${t.title}". Jelaskan: (1) mengapa ini viral dan apa yang sebenarnya terjadi, (2) konteks sosial, ekonomi, atau politik di baliknya, (3) siapa yang paling terpengaruh dan bagaimana reaksi publik, (4) implikasi jangka panjang terhadap Indonesia, (5) peluang bisnis atau karir yang muncul dari tren ini`} className="opacity-0 group-hover:opacity-100" />
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-[11px] text-muted">Data trending tidak tersedia saat ini.</p>
              )}
            </div>

            {/* Static keyword categories */}
            <div className="p-4">
              <div className="text-[10px] font-extrabold text-muted uppercase tracking-widest mb-3">
                Kategori Topik
              </div>
              <div className="space-y-1">
                {CATEGORIES.map((cat, i) => (
                  <div key={i} className="border border-border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setOpenCat(openCat === i ? null : i)}
                      className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-bold text-text hover:bg-surface2/50 transition-colors"
                    >
                      <span>{cat.label}</span>
                      <span className="text-muted text-[10px]">{openCat === i ? "▲" : "▼"}</span>
                    </button>
                    {openCat === i && (
                      <div className="px-3 pb-3 pt-1 flex flex-wrap gap-1.5">
                        {cat.keywords.map((kw, j) => (
                          <span key={j} className="inline-flex items-center gap-1 bg-surface2 border border-border rounded px-2 py-0.5 text-[10px] text-text">
                            {kw}
                            <GptButton subject={`topik "${kw}" yang relevan di Indonesia 2025. Analisis: (1) perkembangan terkini dan siapa yang terdampak, (2) data dan angka kunci terbaru, (3) peluang bisnis atau karir yang terbuka, (4) risiko dan hal yang perlu diwaspadai, (5) perbandingan dengan negara ASEAN dan global, (6) rekomendasi langkah konkret`} label="?" className="ml-0.5" />
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
