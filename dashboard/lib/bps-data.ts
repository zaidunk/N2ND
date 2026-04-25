import type { BPSIndicator, TrendPoint } from "./types"

export const BPS_INDICATORS: BPSIndicator[] = [
  {
    label: "Populasi 2025",
    value: "284,4 Jt",
    sub: "+1,08% YoY",
    trend: "↑ Bonus demografi aktif",
    trendUp: true,
    color: "green",
  },
  {
    label: "GDP 2026",
    value: "23,8 T IDR",
    sub: "Tumbuh 5,1% YoY",
    trend: "↑ Konsisten >5% pasca-pandemi",
    trendUp: true,
    color: "green",
  },
  {
    label: "Kemiskinan Sep-2025",
    value: "8,25 %",
    sub: "23,36 juta jiwa",
    trend: "↓ Terendah sepanjang sejarah",
    trendUp: false,
    color: "red",
  },
  {
    label: "HDI 2026",
    value: "75,90",
    sub: "Naik dari 73,16 (2021)",
    trend: "↑ Konsisten naik 5 tahun",
    trendUp: true,
    color: "blue",
  },
  {
    label: "Pengangguran Aug-2025",
    value: "4,85 %",
    sub: "Turun dari 7,1% (2020)",
    trend: "↑ Pemulihan post-pandemi",
    trendUp: true,
    color: "green",
  },
  {
    label: "UMP Rata-Rata 2025",
    value: "3,3 Jt",
    sub: "Naik 5,82% dari 2024",
    trend: "+ Jakarta Rp 5,4 juta tertinggi",
    trendUp: true,
    color: "green",
  },
  {
    label: "Inflasi 2025",
    value: "2,92 %",
    sub: "Naik dari 1,57% (2024)",
    trend: "↑ Makanan +4,58% terbesar",
    trendUp: false,
    color: "amber",
  },
  {
    label: "Internet HH 2025",
    value: "91,66 %",
    sub: "Naik dari 86,54% (2022)",
    trend: "↑ Papua Pegunungan 26,6%",
    trendUp: true,
    color: "blue",
  },
]

export const POVERTY_TREND: TrendPoint[] = [
  { year: 2016, value: 10.86 },
  { year: 2017, value: 10.64 },
  { year: 2018, value: 9.82 },
  { year: 2019, value: 9.22 },
  { year: 2020, value: 10.19 },
  { year: 2021, value: 10.14 },
  { year: 2022, value: 9.54 },
  { year: 2023, value: 9.36 },
  { year: 2024, value: 8.57 },
  { year: 2025, value: 8.25 },
]

export const UNEMPLOYMENT_TREND: TrendPoint[] = [
  { year: 2016, value: 5.61 },
  { year: 2017, value: 5.50 },
  { year: 2018, value: 5.34 },
  { year: 2019, value: 5.28 },
  { year: 2020, value: 7.07 },
  { year: 2021, value: 6.49 },
  { year: 2022, value: 5.86 },
  { year: 2023, value: 5.32 },
  { year: 2024, value: 4.91 },
  { year: 2025, value: 4.85 },
]

export const GDP_TREND: TrendPoint[] = [
  { year: 2016, value: 5.03 },
  { year: 2017, value: 5.07 },
  { year: 2018, value: 5.17 },
  { year: 2019, value: 5.02 },
  { year: 2020, value: -2.07 },
  { year: 2021, value: 3.69 },
  { year: 2022, value: 5.31 },
  { year: 2023, value: 5.05 },
  { year: 2024, value: 5.11 },
  { year: 2025, value: 5.10 },
]

export const INFLATION_TREND: TrendPoint[] = [
  { year: 2016, value: 3.02 },
  { year: 2017, value: 3.61 },
  { year: 2018, value: 3.13 },
  { year: 2019, value: 2.72 },
  { year: 2020, value: 1.68 },
  { year: 2021, value: 1.87 },
  { year: 2022, value: 5.51 },
  { year: 2023, value: 2.61 },
  { year: 2024, value: 1.57 },
  { year: 2025, value: 2.92 },
]
