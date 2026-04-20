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
