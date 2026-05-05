"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Wallet, TrendingUp, TrendingDown, ChevronDown } from "lucide-react"
import { motion } from "framer-motion"
import { formatCurrency, getMonthName, getJenjangLabel, cn } from "@/lib/utils"

export const dynamic = 'force-dynamic'

interface MonthRow { month: number; paid: number; unpaid: number; pending: number; total: number }

export default function KeuanganPage() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [monthlyData, setMonthlyData] = useState<MonthRow[]>([])
  const [jenjangBreakdown, setJenjangBreakdown] = useState<{ jenjang: string; paid: number; unpaid: number }[]>([])
  const [totals, setTotals] = useState({ paid: 0, unpaid: 0, pending: 0 })
  const [years, setYears] = useState<number[]>([])
  const [showYearPicker, setShowYearPicker] = useState(false)

  useEffect(() => {
    fetchData()
  }, [year])

  const fetchData = async () => {
    // Get available years
    const { data: allPayments } = await supabase.from("payments").select("year")
    const uniqueYears = [...new Set(allPayments?.map(p => p.year) || [])].sort((a, b) => b - a)
    if (uniqueYears.length === 0) uniqueYears.push(new Date().getFullYear())
    setYears(uniqueYears)

    // Monthly breakdown
    const { data: payments } = await supabase.from("payments").select("month, amount, status").eq("year", year)

    const monthMap: Record<number, MonthRow> = {}
    for (let m = 1; m <= 12; m++) {
      monthMap[m] = { month: m, paid: 0, unpaid: 0, pending: 0, total: 0 }
    }

    let tPaid = 0, tUnpaid = 0, tPending = 0
    payments?.forEach(p => {
      const amt = Number(p.amount)
      monthMap[p.month].total += amt
      if (p.status === 'paid') { monthMap[p.month].paid += amt; tPaid += amt }
      else if (p.status === 'unpaid' || p.status === 'rejected') { monthMap[p.month].unpaid += amt; tUnpaid += amt }
      else if (p.status === 'pending') { monthMap[p.month].pending += amt; tPending += amt }
    })

    setMonthlyData(Object.values(monthMap))
    setTotals({ paid: tPaid, unpaid: tUnpaid, pending: tPending })

    // Jenjang breakdown
    const { data: paymentsWithStudents } = await supabase
      .from("payments")
      .select("amount, status, students(jenjang)")
      .eq("year", year)

    const jMap: Record<string, { paid: number; unpaid: number }> = {}
    paymentsWithStudents?.forEach((p: any) => {
      const j = p.students?.jenjang || 'tidak_sekolah'
      if (!jMap[j]) jMap[j] = { paid: 0, unpaid: 0 }
      const amt = Number(p.amount)
      if (p.status === 'paid') jMap[j].paid += amt
      else jMap[j].unpaid += amt
    })

    setJenjangBreakdown(Object.entries(jMap).map(([jenjang, data]) => ({ jenjang, ...data })))
  }

  const grandTotal = totals.paid + totals.unpaid + totals.pending

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-outfit">Laporan Keuangan</h1>
          <p className="text-slate-400">Ringkasan pendapatan dan tunggakan pesantren.</p>
        </div>
        {/* Year Picker */}
        <div className="relative">
          <button onClick={() => setShowYearPicker(!showYearPicker)}
            className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-slate-700 transition-colors">
            <Wallet size={16} className="text-amber-400" />
            Tahun {year}
            <ChevronDown size={14} className={cn("transition-transform", showYearPicker && "rotate-180")} />
          </button>
          {showYearPicker && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowYearPicker(false)} />
              <div className="absolute right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-40 overflow-hidden min-w-[140px]">
                {years.map(y => (
                  <button key={y} onClick={() => { setYear(y); setShowYearPicker(false) }}
                    className={cn("w-full text-left px-4 py-2.5 text-sm hover:bg-slate-700 transition-colors",
                      y === year ? "text-amber-400 font-bold bg-amber-500/5" : "text-slate-300"
                    )}>{y}</button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl p-6 border border-green-500/20 bg-gradient-to-br from-green-900/10 to-emerald-900/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 bg-green-500/10 text-green-400 rounded-xl flex items-center justify-center"><TrendingUp size={20} /></div>
            <p className="text-slate-400 text-sm">Total Lunas</p>
          </div>
          <p className="text-2xl font-bold text-green-400">{formatCurrency(totals.paid)}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-card rounded-3xl p-6 border border-red-500/20 bg-gradient-to-br from-red-900/10 to-rose-900/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 bg-red-500/10 text-red-400 rounded-xl flex items-center justify-center"><TrendingDown size={20} /></div>
            <p className="text-slate-400 text-sm">Total Tunggakan</p>
          </div>
          <p className="text-2xl font-bold text-red-400">{formatCurrency(totals.unpaid)}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass-card rounded-3xl p-6 border border-amber-500/20 bg-gradient-to-br from-amber-900/10 to-orange-900/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center"><Wallet size={20} /></div>
            <p className="text-slate-400 text-sm">Menunggu Verifikasi</p>
          </div>
          <p className="text-2xl font-bold text-amber-400">{formatCurrency(totals.pending)}</p>
        </motion.div>
      </div>

      {/* Monthly Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="glass-card rounded-3xl p-6 border border-slate-800/50">
        <h3 className="font-bold font-outfit text-lg mb-1">Rincian Per Bulan</h3>
        <p className="text-slate-500 text-xs mb-4">Breakdown pendapatan dan tunggakan per bulan tahun {year}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-800">
                <th className="text-left py-3 px-2">Bulan</th>
                <th className="text-right py-3 px-2">Lunas</th>
                <th className="text-right py-3 px-2">Tunggakan</th>
                <th className="text-right py-3 px-2">Pending</th>
                <th className="text-right py-3 px-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((m) => (
                <tr key={m.month} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                  <td className="py-3 px-2 font-medium">{getMonthName(m.month)}</td>
                  <td className="py-3 px-2 text-right text-green-400 font-bold">{m.paid > 0 ? formatCurrency(m.paid) : '-'}</td>
                  <td className="py-3 px-2 text-right text-red-400 font-bold">{m.unpaid > 0 ? formatCurrency(m.unpaid) : '-'}</td>
                  <td className="py-3 px-2 text-right text-amber-400 font-bold">{m.pending > 0 ? formatCurrency(m.pending) : '-'}</td>
                  <td className="py-3 px-2 text-right font-bold">{m.total > 0 ? formatCurrency(m.total) : '-'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-700 font-bold">
                <td className="py-3 px-2">TOTAL</td>
                <td className="py-3 px-2 text-right text-green-400">{formatCurrency(totals.paid)}</td>
                <td className="py-3 px-2 text-right text-red-400">{formatCurrency(totals.unpaid)}</td>
                <td className="py-3 px-2 text-right text-amber-400">{formatCurrency(totals.pending)}</td>
                <td className="py-3 px-2 text-right">{formatCurrency(grandTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </motion.div>

      {/* Jenjang Breakdown */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="glass-card rounded-3xl p-6 border border-slate-800/50">
        <h3 className="font-bold font-outfit text-lg mb-1">Breakdown Per Jenjang</h3>
        <p className="text-slate-500 text-xs mb-4">Pendapatan dan tunggakan berdasarkan jenjang pendidikan</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-800">
                <th className="text-left py-3 px-2">Jenjang</th>
                <th className="text-right py-3 px-2">Lunas</th>
                <th className="text-right py-3 px-2">Tunggakan</th>
                <th className="text-right py-3 px-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {jenjangBreakdown.map((j) => (
                <tr key={j.jenjang} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                  <td className="py-3 px-2 font-medium">{getJenjangLabel(j.jenjang)}</td>
                  <td className="py-3 px-2 text-right text-green-400 font-bold">{formatCurrency(j.paid)}</td>
                  <td className="py-3 px-2 text-right text-red-400 font-bold">{formatCurrency(j.unpaid)}</td>
                  <td className="py-3 px-2 text-right font-bold">{formatCurrency(j.paid + j.unpaid)}</td>
                </tr>
              ))}
              {jenjangBreakdown.length === 0 && (
                <tr><td colSpan={4} className="text-center py-8 text-slate-600">Belum ada data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
