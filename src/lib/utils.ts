import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export function getMonthName(monthIndex: number) {
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ]
  return months[monthIndex - 1] || ""
}

export function isPaymentOverdue(month: number, year: number, deadlineDay: number = 10) {
  const today = new Date()
  const currentMonth = today.getMonth() + 1 // 1-indexed
  const currentYear = today.getFullYear()
  const currentDay = today.getDate()

  // Case 1: Past year
  if (currentYear > year) return true
  
  // Case 2: Same year, past month
  if (currentYear === year && currentMonth > month) return true

  // Case 3: Same year, same month, past deadline day
  if (currentYear === year && currentMonth === month && currentDay > deadlineDay) return true

  return false
}

// Jenjang sekolah constants
export const JENJANG_OPTIONS = [
  { value: 'tidak_sekolah', label: 'Tidak Sekolah' },
  { value: 'sd_mi', label: 'SD/MI' },
  { value: 'smp_mts', label: 'SMP/MTs' },
  { value: 'sma_ma', label: 'SMA/MA' },
  { value: 'kuliah', label: 'Kuliah' },
] as const

export type JenjangType = typeof JENJANG_OPTIONS[number]['value']

export const BILLING_COMPONENTS = [
  { key: 'kos_makan', label: 'Kos Makan' },
  { key: 'sekolah_diniah', label: 'Sekolah Diniah' },
  { key: 'sekolah_formal', label: 'Sekolah Formal' },
  { key: 'listrik_kesehatan', label: 'Listrik & Kesehatan' },
  { key: 'uang_gedung', label: 'Uang Gedung' },
] as const

export type BillingRates = Record<string, number>

export function getJenjangLabel(value: string) {
  return JENJANG_OPTIONS.find(j => j.value === value)?.label || value
}

export function getJenjangColor(value: string) {
  const colors: Record<string, string> = {
    tidak_sekolah: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    sd_mi: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    smp_mts: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    sma_ma: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    kuliah: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  }
  return colors[value] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'
}

export function getJenjangColorLight(value: string) {
  const colors: Record<string, string> = {
    tidak_sekolah: 'bg-slate-100 text-slate-600 border-slate-200',
    sd_mi: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    smp_mts: 'bg-blue-100 text-blue-700 border-blue-200',
    sma_ma: 'bg-purple-100 text-purple-700 border-purple-200',
    kuliah: 'bg-amber-100 text-amber-700 border-amber-200',
  }
  return colors[value] || 'bg-slate-100 text-slate-600 border-slate-200'
}
