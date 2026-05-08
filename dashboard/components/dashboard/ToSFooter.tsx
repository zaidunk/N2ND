"use client"
import { useState } from "react"

const SHORT = "N2ND (Xolvon.ai) adalah platform intelijen data publik yang mengaggregasi informasi dari API resmi, sumber RSS bereputasi, dan lembaga data pemerintah. Seluruh data bersifat publik dan tidak ada data pribadi pengguna yang dikumpulkan. Platform ini tidak menyediakan saran investasi, hukum, atau keuangan profesional."

const FULL = `SYARAT DAN KETENTUAN LAYANAN — N2ND Intelligence Dashboard
Versi 1.0 · Berlaku per 1 Januari 2025

1. TENTANG PLATFORM
N2ND (dioperasikan oleh Xolvon.ai) adalah platform dasbor intelijen data real-time yang dirancang untuk keperluan informasi, riset, dan analisis publik. Seluruh data yang ditampilkan bersumber dari API resmi, feed RSS media bereputasi, lembaga statistik pemerintah (BPS), serta sumber data publik internasional (World Bank, IMF, ECB, CoinPaprika, dan lainnya). Platform ini tidak berafiliasi dengan atau didukung oleh lembaga pemerintah manapun.

2. PENGGUNAAN YANG DIIZINKAN
Platform ini dapat digunakan secara bebas untuk keperluan pemantauan informasi dan berita publik, riset akademis, jurnalistik dan analisis bisnis, pendidikan dan literasi data, serta pengambilan keputusan berbasis data yang bertanggung jawab.

3. PENGGUNAAN YANG DILARANG
Pengguna dilarang keras menggunakan platform ini untuk tindakan yang melanggar hukum, peraturan, atau regulasi Republik Indonesia; penyebaran disinformasi, propaganda, atau konten yang menyesatkan; penipuan, manipulasi pasar, atau tindakan kecurangan finansial; pelanggaran hak kekayaan intelektual pihak lain; serta aktivitas yang dapat merugikan individu, kelompok, atau institusi manapun.

4. AKURASI DATA
Xolvon.ai berupaya semaksimal mungkin menyajikan data yang akurat dan terkini. Namun, mengingat data bersumber dari pihak ketiga (API publik, RSS, dll.), kami tidak dapat menjamin keakuratan, kelengkapan, atau ketepatan waktu dari seluruh informasi yang ditampilkan. Data yang tersedia BUKAN merupakan saran investasi, hukum, medis, atau keuangan profesional. Gunakan informasi ini dengan bijaksana dan konsultasikan dengan profesional terkait sebelum membuat keputusan penting.

5. HAK KEKAYAAN INTELEKTUAL
Seluruh desain antarmuka, kode sumber, dan elemen kreatif N2ND adalah milik Xolvon.ai dan dilindungi hukum Hak Kekayaan Intelektual (HKI) yang berlaku di Indonesia dan internasional. Konten berita bersumber dari masing-masing penerbit dan tunduk pada hak cipta penerbit tersebut. Penggunaan ulang konten pihak ketiga harus mengacu pada ketentuan sumber aslinya.

6. PRIVASI PENGGUNA
N2ND tidak mengumpulkan, menyimpan, atau memproses data pribadi pengguna. Tidak ada akun atau pendaftaran yang diperlukan untuk mengakses layanan ini. Kami tidak menggunakan cookie pelacak pihak ketiga untuk tujuan periklanan atau profiling pengguna.

7. PENAFIAN (DISCLAIMER)
Platform ini disediakan "sebagaimana adanya" (as-is) tanpa garansi apapun, baik tersurat maupun tersirat. Xolvon.ai tidak bertanggung jawab atas kerugian langsung maupun tidak langsung yang timbul akibat penggunaan atau ketidakmampuan menggunakan platform ini, termasuk namun tidak terbatas pada kerugian finansial akibat keputusan yang didasarkan pada data yang ditampilkan.

8. PERUBAHAN LAYANAN
Xolvon.ai berhak mengubah, memperbarui, atau menghentikan layanan sewaktu-waktu tanpa pemberitahuan sebelumnya. Perubahan syarat dan ketentuan akan diumumkan melalui pembaruan dokumen ini. Penggunaan berkelanjutan atas platform dianggap sebagai penerimaan terhadap perubahan tersebut.

9. HUKUM YANG BERLAKU
Syarat dan ketentuan ini diatur berdasarkan hukum Negara Kesatuan Republik Indonesia. Setiap sengketa yang timbul akan diselesaikan melalui jalur musyawarah mufakat terlebih dahulu. Apabila tidak tercapai kesepakatan, sengketa akan diselesaikan melalui lembaga penyelesaian sengketa yang berlaku di Indonesia sesuai peraturan perundang-undangan yang berlaku.

10. HUBUNGI KAMI
Untuk pertanyaan, masukan, laporan pelanggaran, atau kerja sama, silakan hubungi kami melalui Instagram @xolvon.ai atau WhatsApp +62 878 8876 0105.`

export default function ToSFooter() {
  const [expanded, setExpanded] = useState(false)

  return (
    <footer className="mt-4 border-t border-border bg-surface">
      <div className="mx-auto max-w-[1400px] px-4 py-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-full max-w-2xl">
            <p className="text-[10px] text-muted leading-relaxed text-center">{SHORT}</p>
            {expanded && (
              <div className="mt-4 text-[10px] text-muted leading-relaxed whitespace-pre-line border-t border-border/40 pt-4">
                {FULL}
              </div>
            )}
            <div className="text-center mt-2">
              <button
                onClick={() => setExpanded(v => !v)}
                className="text-[10px] text-primary font-bold hover:underline transition-colors"
              >
                {expanded ? "Sembunyikan ↑" : "Lihat Selengkapnya ↓"}
              </button>
            </div>
          </div>

          <a
            href="https://www.instagram.com/xolvon.ai/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-muted hover:text-primary transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
              <circle cx="12" cy="12" r="4"/>
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
            </svg>
            <span className="text-[11px] font-bold">xolvon.ai</span>
          </a>

          <p className="text-[9px] text-muted/50">© {new Date().getFullYear()} Xolvon.ai · N2ND Intelligence Dashboard · All rights reserved</p>
        </div>
      </div>
    </footer>
  )
}
