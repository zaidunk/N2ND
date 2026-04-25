# Public Launch Legal Checklist (Instagram + Free Public Access)

Checklist ini dipakai sebelum posting promosi publik dan membuka akses gratis ke user umum.

## 1) Legal Documents (Wajib Publik)

- [ ] `Privacy Policy` live dan mudah diakses dari landing page/dashboard.
- [ ] `Terms of Service` live dan mudah diakses dari landing page/dashboard.
- [ ] `Cookie Policy` live jika ada analytics/cookies non-esensial.
- [ ] Disclaimer jelas: informasi bersifat umum, bukan nasihat finansial/hukum/medis.
- [ ] Contact legal/support tersedia untuk komplain dan permintaan takedown.

## 2) Kepatuhan Data Pribadi (UU PDP)

- [ ] Inventaris data: data apa yang dikumpulkan, tujuan, masa simpan.
- [ ] Dasar pemrosesan data jelas (consent/kontrak/kepentingan sah).
- [ ] Consent untuk tracking non-esensial (analytics/marketing) tersedia.
- [ ] Mekanisme user request: akses, koreksi, hapus data.
- [ ] Data retention policy aktif (hapus data lama sesuai kebijakan).
- [ ] Semua secret ada di env var, tidak hardcode di repo/log.

## 3) Source & Content Compliance

- [ ] Semua source tercatat di audit sheet (`API/RSS/scrape`, lisensi, attribution rule).
- [ ] Jika `robots.txt` atau ToS melarang scraping: source di-skip.
- [ ] Output hanya tampilkan ringkasan pendek + link sumber (hindari copy penuh artikel).
- [ ] Attribution sumber ditampilkan konsisten pada setiap item/data export.
- [ ] Proses takedown konten pihak ketiga tersedia dan terdokumentasi.

## 4) Platform & Distribution Compliance (Instagram)

- [ ] Klaim promosi tidak menyesatkan, tidak overpromise, tidak manipulatif.
- [ ] Tidak ada konten fitnah, ujaran kebencian, atau serangan individu.
- [ ] Jika konten sponsor/paid partnership: disclosure (`#ad`, `#sponsored`) aktif.
- [ ] Tidak pakai akun palsu, bot amplification, atau engagement manipulation.

## 5) AI Output & UX Safety

- [ ] Label bahwa jawaban AI dapat salah/bias ditampilkan dekat aksi `Tanya AI`.
- [ ] Prompt injection filter aktif di endpoint query/search/export.
- [ ] Input validation + max length untuk semua field publik.
- [ ] Rate limit aktif (free tier dan paid tier dipisah).
- [ ] Logging audit untuk aksi admin (refresh/manual load/config change).

## 6) Operational Readiness (Sebelum Traffic Naik)

- [ ] Incident response basic: siapa PIC, SLA respon, alur eskalasi.
- [ ] Monitoring error + alert aktif (API, ingestion, auth, billing).
- [ ] Backup database terjadwal + uji restore minimal 1 kali.
- [ ] Status page atau fallback message ada saat sistem degraded.

## 7) Gate Keputusan Launch

Semua poin ini harus `YES` sebelum push publik besar:

- [ ] Dokumen legal sudah live.
- [ ] Audit source selesai dan tidak ada source ilegal aktif.
- [ ] PDP minimum controls aktif.
- [ ] Safety controls API aktif (validation, filter, rate limit).
- [ ] Jalur komplain/takedown aktif.

Jika ada satu saja `NO`, launch tetap boleh untuk tes terbatas (private beta), tapi belum untuk publik massal.
