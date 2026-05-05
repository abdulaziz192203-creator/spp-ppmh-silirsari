"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Users, TrendingUp, CheckCircle2, XCircle, Clock, Crown, ArrowUpRight, AlertTriangle } from "lucide-react"
import { motion } from "framer-motion"
import { formatCurrency, isPaymentOverdue, getMonthName, getJenjangLabel, cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

export const dynamic = 'force-dynamic'

interface MonthlyRevenue { month: number; total: number }

export default function PimpinanDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0, pendingPayments: 0, totalRevenue: 0,
    unpaidBills: 0, paidBills: 0, overdueBills: 0, complianceRate: 0,
  })
  const [jenjangStats, setJenjangStats] = useState<Record<string, number>>({})
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([])
  const [recentPayments, setRecentPayments] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    // Stats
    const { count: studentCount } = await supabase.from("students").select("*", { count: 'exact', head: true })
    const { count: pendingCount } = await supabase.from("payments").select("*", { count: 'exact', head: true }).eq("status", "pending")
    const { count: unpaidCount } = await supabase.from("payments").select("*", { count: 'exact', head: true }).eq("status", "unpaid")
    const { count: paidCount } = await supabase.from("payments").select("*", { count: 'exact', head: true }).eq("status", "paid")

    const { data: settings } = await supabase.from("system_settings").select("value").eq("key", "payment_deadline_day").single()
    const deadline = settings ? parseInt(settings.value) : 10
    const { data: unpaidData } = await supabase.from("payments").select("month, year").eq("status", "unpaid")
    const overdueCount = unpaidData?.filter(p => isPaymentOverdue(p.month, p.year, deadline)).length || 0

    const { data: paidData } = await supabase.from("payments").select("amount").eq("status", "paid")
    const totalRev = paidData?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0

    const totalBills = (paidCount || 0) + (unpaidCount || 0) + (pendingCount || 0)
    const compliance = totalBills > 0 ? Math.round(((paidCount || 0) / totalBills) * 100) : 0

    setStats({
      totalStudents: studentCount || 0, pendingPayments: pendingCount || 0,
      totalRevenue: totalRev, unpaidBills: unpaidCount || 0,
      paidBills: paidCount || 0, overdueBills: overdueCount, complianceRate: compliance,
    })

    // Jenjang distribution
    const { data: students } = await supabase.from("students").select("jenjang")
    const jDist: Record<string, number> = {}
    students?.forEach(s => { jDist[s.jenjang || 'tidak_sekolah'] = (jDist[s.jenjang || 'tidak_sekolah'] || 0) + 1 })
    setJenjangStats(jDist)

    // Monthly revenue for current year
    const currentYear = new Date().getFullYear()
    const { data: paidMonthly } = await supabase.from("payments").select("month, amount").eq("status", "paid").eq("year", currentYear)
    const monthMap: Record<number, number> = {}
    paidMonthly?.forEach(p => { monthMap[p.month] = (monthMap[p.month] || 0) + Number(p.amount) })
    const mRevenue: MonthlyRevenue[] = []
    for (let m = 1; m <= 12; m++) { mRevenue.push({ month: m, total: monthMap[m] || 0 }) }
    setMonthlyRevenue(mRevenue)

    // Recent payments
    const { data: recent } = await supabase.from("payments").select("*, students(name, nisn)").eq("status", "paid").order("verified_at", { ascending: false }).limit(5)
    setRecentPayments(recent || [])
  }

  const maxRevenue = Math.max(...monthlyRevenue.map(m => m.total), 1)

  const statCards = [
    { name: "Total Santri", value: stats.totalStudents.toString(), icon: Users, color: "blue" },
    { name: "Sudah Lunas", value: stats.paidBills.toString(), icon: CheckCircle2, color: "green" },
    { name: "Menunggu Verifikasi", value: stats.pendingPayments.toString(), icon: Clock, color: "amber" },
    { name: "Belum Bayar", value: stats.unpaidBills.toString(), icon: XCircle, color: "slate" },
    { name: "Terlambat", value: stats.overdueBills.toString(), icon: AlertTriangle, color: "red" },
    { name: "Kepatuhan", value: `${stats.complianceRate}%`, icon: Crown, color: "purple" },
  ]

  const colorMap: Record<string, string> = {
    blue: "bg-blue-600/10 text-blue-400",
    green: "bg-green-600/10 text-green-400",
    amber: "bg-amber-600/10 text-amber-400",
    slate: "bg-slate-600/10 text-slate-400",
    red: "bg-red-600/10 text-red-400",
    purple: "bg-purple-600/10 text-purple-400",
  }

  const jenjangColors: Record<string, string> = {
    tidak_sekolah: "bg-slate-500", sd_mi: "bg-emerald-500",
    smp_mts: "bg-blue-500", sma_ma: "bg-purple-500", kuliah: "bg-amber-500",
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-outfit">Dashboard Pemimpin</h1>
        <p className="text-slate-400">Ikhtisar keuangan dan operasional Pondok Pesantren Miftahul Huda.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, idx) => (
          <motion.div key={stat.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.07 }}
            className="glass-card rounded-3xl p-5 border border-slate-800/50 hover:border-amber-500/20 transition-all">
            <div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center mb-3", colorMap[stat.color])}>
              <stat.icon size={20} />
            </div>
            <p className="text-slate-500 text-xs font-medium">{stat.name}</p>
            <p className="text-xl font-bold mt-0.5">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Total Pendapatan */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="glass-card rounded-3xl p-6 border border-slate-800/50 bg-gradient-to-r from-amber-900/10 to-orange-900/10 border-amber-500/20">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center">
            <TrendingUp size={28} />
          </div>
          <div>
            <p className="text-slate-400 text-sm">Total Pendapatan (Lunas)</p>
            <p className="text-3xl font-bold text-amber-400">{formatCurrency(stats.totalRevenue)}</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="glass-card rounded-3xl p-6 border border-slate-800/50">
          <h3 className="font-bold font-outfit text-lg mb-1">Pendapatan Bulanan {new Date().getFullYear()}</h3>
          <p className="text-slate-500 text-xs mb-6">Grafik pendapatan per bulan</p>
          <div className="flex items-end gap-2 h-40">
            {monthlyRevenue.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full relative group">
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-[9px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {formatCurrency(m.total)}
                  </div>
                  <div className="w-full bg-amber-500/20 rounded-t-lg overflow-hidden" style={{ height: '120px' }}>
                    <div className="w-full bg-gradient-to-t from-amber-500 to-orange-400 rounded-t-lg transition-all duration-700 absolute bottom-0"
                      style={{ height: `${maxRevenue > 0 ? (m.total / maxRevenue) * 100 : 0}%` }} />
                  </div>
                </div>
                <span className="text-[9px] text-slate-500 font-bold">{getMonthName(m.month).slice(0, 3)}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Jenjang Distribution */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="glass-card rounded-3xl p-6 border border-slate-800/50">
          <h3 className="font-bold font-outfit text-lg mb-1">Distribusi Santri</h3>
          <p className="text-slate-500 text-xs mb-6">Jumlah santri per jenjang pendidikan</p>
          <div className="space-y-4">
            {Object.entries(jenjangStats).map(([key, count]) => {
              const total = stats.totalStudents || 1
              const pct = Math.round((count / total) * 100)
              return (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-slate-300">{getJenjangLabel(key)}</span>
                    <span className="text-slate-400 font-bold">{count} <span className="text-slate-600">({pct}%)</span></span>
                  </div>
                  <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: 0.5 }}
                      className={cn("h-full rounded-full", jenjangColors[key] || "bg-slate-500")} />
                  </div>
                </div>
              )
            })}
            {Object.keys(jenjangStats).length === 0 && (
              <p className="text-slate-600 text-sm text-center py-8">Belum ada data santri</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Recent Payments */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
        className="glass-card rounded-3xl p-6 border border-slate-800/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold font-outfit text-lg">Pembayaran Terbaru</h3>
            <p className="text-slate-500 text-xs">5 pembayaran terakhir yang telah diverifikasi</p>
          </div>
          <button onClick={() => router.push('/pimpinan/keuangan')} className="text-amber-400 text-xs font-bold flex items-center gap-1 hover:underline">
            Lihat Semua <ArrowUpRight size={14} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-800">
                <th className="text-left py-3 px-2">Santri</th>
                <th className="text-left py-3 px-2">Bulan</th>
                <th className="text-right py-3 px-2">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {recentPayments.map((p, i) => (
                <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                  <td className="py-3 px-2 font-medium">{p.students?.name || '-'}</td>
                  <td className="py-3 px-2 text-slate-400">{getMonthName(p.month)} {p.year}</td>
                  <td className="py-3 px-2 text-right text-green-400 font-bold">{formatCurrency(p.amount)}</td>
                </tr>
              ))}
              {recentPayments.length === 0 && (
                <tr><td colSpan={3} className="text-center py-8 text-slate-600">Belum ada data pembayaran</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button onClick={() => router.push('/pimpinan/keuangan')} className="glass-card rounded-2xl p-6 border border-slate-800/50 hover:border-amber-500/30 transition-all text-left group">
          <h4 className="font-bold mb-1">Laporan Keuangan</h4>
          <p className="text-slate-500 text-xs">Lihat detail pendapatan dan tunggakan</p>
          <ArrowUpRight size={16} className="mt-3 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
        <button onClick={() => router.push('/pimpinan/santri')} className="glass-card rounded-2xl p-6 border border-slate-800/50 hover:border-blue-500/30 transition-all text-left group">
          <h4 className="font-bold mb-1">Data Santri</h4>
          <p className="text-slate-500 text-xs">Lihat seluruh data santri pesantren</p>
          <ArrowUpRight size={16} className="mt-3 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
        <button onClick={() => router.push('/pimpinan/pengumuman')} className="glass-card rounded-2xl p-6 border border-slate-800/50 hover:border-green-500/30 transition-all text-left group">
          <h4 className="font-bold mb-1">Pengumuman</h4>
          <p className="text-slate-500 text-xs">Lihat pengumuman yang sudah dipublikasikan</p>
          <ArrowUpRight size={16} className="mt-3 text-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>
    </div>
  )
}
