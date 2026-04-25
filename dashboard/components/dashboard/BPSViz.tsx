"use client"
import { useState } from "react"
import SvgBarChart from "@/components/ui/SvgBarChart"
import TrendChart from "@/components/dashboard/TrendChart"
import {
  UMP_BY_PROVINCE, TPT_BY_PROVINCE, HAPPINESS_BY_PROVINCE,
  INTERNET_BY_PROVINCE, FDI_BY_COUNTRY, INF_BY_CATEGORY,
  GDP_BY_SECTOR,
} from "@/lib/bps-extended"
import { BPS_INDICATORS, POVERTY_TREND, UNEMPLOYMENT_TREND, GDP_TREND, INFLATION_TREND } from "@/lib/bps-data"
import StatCard from "@/components/dashboard/StatCard"
import GptButton from "@/components/ui/GptButton"

const TABS = ["Overview", "Ekonomi", "Ketenagakerjaan", "Sosial", "Digital"] as const
type Tab = typeof TABS[number]

function SectionTitle({ title, subject }: { title: string; subject: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-[11px] font-extrabold text-muted uppercase tracking-widest">{title}</h3>
      <GptButton subject={subject} label="? GPT" className="text-[9px] px-2 py-1" />
    </div>
  )
}

export default function BPSViz() {
  const [tab, setTab] = useState<Tab>("Overview")

  return (
    <section className="px-4 py-4">
      <div className="mx-auto max-w-[1400px]">
        <div className="card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-3 pb-0 border-b border-border">
            <div className="flex gap-1">
              {TABS.map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-1.5 text-[11px] font-extrabold rounded-t transition-colors -mb-px border-b-2 ${
                    tab === t
                      ? "text-primary border-primary"
                      : "text-muted border-transparent hover:text-text"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <span className="text-[9px] text-muted pb-2">BPS · OJK · BI · IMF</span>
          </div>

          <div className="p-4">
            {tab === "Overview" && (
              <div className="space-y-6">
                <div>
                  <SectionTitle title="Indikator Utama BPS 2025" subject="indikator ekonomi makro Indonesia BPS 2025" />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {BPS_INDICATORS.map(ind => <StatCard key={ind.label} {...ind} />)}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <SectionTitle title="Kemiskinan & Pengangguran" subject="tren kemiskinan dan pengangguran Indonesia" />
                    <TrendChart
                      title=""
                      series={[
                        { data: POVERTY_TREND,      color: "#F85149", label: "Kemiskinan (%)" },
                        { data: UNEMPLOYMENT_TREND, color: "#F59E0B", label: "Pengangguran (%)" },
                      ]}
                      height={140}
                    />
                  </div>
                  <div>
                    <SectionTitle title="GDP Growth & Inflasi" subject="pertumbuhan GDP dan inflasi Indonesia" />
                    <TrendChart
                      title=""
                      series={[
                        { data: GDP_TREND,       color: "#10B981", label: "GDP Growth (%)" },
                        { data: INFLATION_TREND, color: "#3B82F6", label: "Inflasi (%)" },
                      ]}
                      height={140}
                    />
                  </div>
                </div>
              </div>
            )}

            {tab === "Ekonomi" && (
              <div className="space-y-6">
                <div>
                  <SectionTitle title="Inflasi per Kategori 2025 (%)" subject="inflasi kategori barang dan jasa Indonesia 2025" />
                  <div className="overflow-y-auto max-h-[400px] pr-1">
                    <SvgBarChart
                      data={INF_BY_CATEGORY.map(d => ({ label: d.label, value: d.v2025 }))}
                      colorFn={v => v < 0 ? "#F85149" : v < 2 ? "#3B82F6" : v < 5 ? "#F59E0B" : "#EF4444"}
                      unit="%" decimals={2} barHeight={18}
                    />
                  </div>
                </div>
                <div>
                  <SectionTitle title="Inflasi per Kategori 2024 (%)" subject="inflasi kategori barang dan jasa Indonesia 2024" />
                  <div className="overflow-y-auto max-h-[400px] pr-1">
                    <SvgBarChart
                      data={INF_BY_CATEGORY.map(d => ({ label: d.label, value: d.v2024 }))}
                      colorFn={v => v < 0 ? "#F85149" : v < 2 ? "#3B82F6" : "#F59E0B"}
                      unit="%" decimals={2} barHeight={18}
                    />
                  </div>
                </div>
                <div>
                  <SectionTitle title="FDI Masuk per Negara (Juta USD)" subject="investasi asing langsung FDI Indonesia per negara asal" />
                  <SvgBarChart
                    data={FDI_BY_COUNTRY}
                    colorFn={() => "#3B82F6"}
                    unit="" decimals={0} barHeight={20}
                  />
                </div>
                <div>
                  <SectionTitle title="Kontribusi Sektor ke PDB (%)" subject="kontribusi sektor ekonomi terhadap PDB Indonesia" />
                  <div className="overflow-y-auto max-h-[400px]">
                    <SvgBarChart
                      data={GDP_BY_SECTOR}
                      colorFn={v => v >= 10 ? "#10B981" : v >= 5 ? "#3B82F6" : "#6B7BB6"}
                      unit="%" decimals={2} barHeight={18}
                    />
                  </div>
                </div>
              </div>
            )}

            {tab === "Ketenagakerjaan" && (
              <div className="space-y-6">
                <div>
                  <SectionTitle title="UMP 2025 per Provinsi (Juta Rp)" subject="upah minimum provinsi UMP 2025 Indonesia" />
                  <div className="overflow-y-auto max-h-[560px] pr-1">
                    <SvgBarChart
                      data={UMP_BY_PROVINCE}
                      colorFn={v => v >= 4 ? "#10B981" : v >= 3 ? "#3B82F6" : "#6B7BB6"}
                      unit="Jt" decimals={2} barHeight={16}
                    />
                  </div>
                </div>
                <div>
                  <SectionTitle title="Tingkat Pengangguran Terbuka per Provinsi (%)" subject="tingkat pengangguran terbuka TPT per provinsi Indonesia" />
                  <div className="overflow-y-auto max-h-[560px] pr-1">
                    <SvgBarChart
                      data={TPT_BY_PROVINCE}
                      colorFn={v => v >= 6 ? "#F85149" : v >= 4 ? "#F59E0B" : "#10B981"}
                      unit="%" decimals={2} barHeight={16}
                    />
                  </div>
                </div>
              </div>
            )}

            {tab === "Sosial" && (
              <div className="space-y-6">
                <div>
                  <SectionTitle title="Indeks Kebahagiaan per Provinsi" subject="indeks kebahagiaan BPS Indonesia per provinsi" />
                  <div className="overflow-y-auto max-h-[480px] pr-1">
                    <SvgBarChart
                      data={HAPPINESS_BY_PROVINCE}
                      colorFn={v => v >= 75 ? "#10B981" : v >= 72 ? "#3B82F6" : "#F59E0B"}
                      unit="" decimals={2} barHeight={18}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-surface2 rounded-lg p-4">
                    <div className="text-[10px] font-extrabold text-muted mb-3 uppercase tracking-widest">Indikator Sosial Kunci</div>
                    {[
                      { label: "Angka Harapan Hidup",   value: "73,7 tahun", note: "+0.3 vs 2023" },
                      { label: "Rata-rata Lama Sekolah", value: "9,05 tahun", note: "Target 9+ thn" },
                      { label: "Harapan Lama Sekolah",   value: "13,3 tahun", note: "Stabil" },
                      { label: "Indeks Pembangunan Manusia", value: "73,55",  note: "+0,67 vs 2022" },
                      { label: "Gini Ratio",              value: "0,381",     note: "▼ turun" },
                      { label: "Pengeluaran per Kapita",  value: "Rp 13,4Jt", note: "Riil adjusted" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                        <div className="text-[11px] font-bold text-text">{item.label}</div>
                        <div className="text-right">
                          <div className="text-[11px] font-extrabold text-primary">{item.value}</div>
                          <div className="text-[9px] text-muted">{item.note}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-surface2 rounded-lg p-4">
                    <div className="text-[10px] font-extrabold text-muted mb-3 uppercase tracking-widest">Indikator Gender & Sosial</div>
                    {[
                      { label: "Indeks Pemberdayaan Gender", value: "76,36",    note: "IDG 2024" },
                      { label: "Partisipasi Perempuan Kerja", value: "54,52%",  note: "TPAK" },
                      { label: "Perempuan di Parlemen",       value: "21,1%",   note: "DPR 2024" },
                      { label: "Prevelansi Merokok Dewasa",   value: "29,9%",   note: "Turun 2%" },
                      { label: "Akses Sanitasi Layak",        value: "80,4%",   note: "+2.1% vs 2022" },
                      { label: "Air Minum Layak",             value: "91,2%",   note: "Termasuk ledeng" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                        <div className="text-[11px] font-bold text-text">{item.label}</div>
                        <div className="text-right">
                          <div className="text-[11px] font-extrabold text-emerald-400">{item.value}</div>
                          <div className="text-[9px] text-muted">{item.note}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === "Digital" && (
              <div className="space-y-6">
                <div>
                  <SectionTitle title="Akses Internet per Provinsi (%)" subject="penetrasi internet per provinsi Indonesia" />
                  <div className="overflow-y-auto max-h-[620px] pr-1">
                    <SvgBarChart
                      data={INTERNET_BY_PROVINCE}
                      colorFn={v => v >= 90 ? "#10B981" : v >= 75 ? "#3B82F6" : v >= 50 ? "#F59E0B" : "#F85149"}
                      unit="%" decimals={2} barHeight={16}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-surface2 rounded-lg p-4">
                    <div className="text-[10px] font-extrabold text-muted mb-3 uppercase tracking-widest">Ekosistem Digital Indonesia</div>
                    {[
                      { label: "Pengguna Internet",        value: "221 juta",  note: "79.5% populasi" },
                      { label: "Pengguna Mobile Internet", value: "204 juta",  note: "Jan 2025" },
                      { label: "Pengguna Media Sosial",    value: "139 juta",  note: "50% populasi" },
                      { label: "Nilai e-Commerce",         value: "Rp 664T",   note: "+8.9% YoY" },
                      { label: "Transaksi QRIS",           value: "4,3 Miliar",note: "2024 total" },
                      { label: "Unicorn Startup",          value: "9 unicorn", note: "Valuasi >$1B" },
                      { label: "Kecepatan Internet Rata2", value: "31.5 Mbps", note: "Fixed broadband" },
                      { label: "Pengguna AI Tools",        value: "~45 juta",  note: "Est. 2025" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                        <div className="text-[11px] font-bold text-text">{item.label}</div>
                        <div className="text-right">
                          <div className="text-[11px] font-extrabold text-blue-400">{item.value}</div>
                          <div className="text-[9px] text-muted">{item.note}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-surface2 rounded-lg p-4">
                    <div className="text-[10px] font-extrabold text-muted mb-3 uppercase tracking-widest">Regulasi & Infrastruktur Digital</div>
                    {[
                      { label: "Pusat Data Nasional",      value: "Online",    note: "PDNS aktif" },
                      { label: "Regulasi UU PDP",          value: "Berlaku",   note: "2024" },
                      { label: "GovTech SPBE Nasional",    value: "Tahap 3",   note: "Roadmap 2025" },
                      { label: "BTS Desa 3T",              value: "9.113 BTS", note: "Bakti 2024" },
                      { label: "Palapa Ring",              value: "Selesai",   note: "Barat Tengah Timur" },
                      { label: "5G Coverage Kota",         value: "15 kota",   note: "Telkomsel XL" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                        <div className="text-[11px] font-bold text-text">{item.label}</div>
                        <div className="text-right">
                          <div className="text-[11px] font-extrabold text-cyan-400">{item.value}</div>
                          <div className="text-[9px] text-muted">{item.note}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
