"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { 
  Users, 
  TrendingUp,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle
} from "lucide-react"
import { motion } from "framer-motion"
import { formatCurrency } from "@/lib/utils"
import { useRouter } from "next/navigation"

export const dynamic = 'force-dynamic'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    pendingPayments: 0,
    totalRevenue: 0,
    unpaidBills: 0,
    paidBills: 0,
  })
  const router = useRouter()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    const { count: studentCount } = await supabase.from("students").select("*", { count: 'exact', head: true })
    const { count: pendingCount } = await supabase.from("payments").select("*", { count: 'exact', head: true }).eq("status", "pending")
    const { count: unpaidCount } = await supabase.from("payments").select("*", { count: 'exact', head: true }).eq("status", "unpaid")
    const { count: paidCount } = await supabase.from("payments").select("*", { count: 'exact', head: true }).eq("status", "paid")
    
    const { data: revenueData } = await supabase.from("payments").select("amount").eq("status", "paid")
    const totalRev = revenueData?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0

    setStats({
      totalStudents: studentCount || 0,
      pendingPayments: pendingCount || 0,
      totalRevenue: totalRev,
      unpaidBills: unpaidCount || 0,
      paidBills: paidCount || 0,
    })
  }

  const statCards = [
    { name: "Total Santri", value: stats.totalStudents, icon: Users, color: "blue" },
    { name: "Sudah Lunas", value: stats.paidBills, icon: CheckCircle2, color: "green" },
    { name: "Menunggu Verifikasi", value: stats.pendingPayments, icon: Clock, color: "amber" },
    { name: "Belum Bayar", value: stats.unpaidBills, icon: XCircle, color: "red" },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-outfit">Halaman Utama</h1>
        <p className="text-slate-400">Ikhtisar sistem pembayaran Pondok Pesantren Miftahul Huda.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass-card rounded-3xl p-6 relative group border border-slate-800/50 hover:border-blue-500/30 transition-all"
          >
            <div className={cn(
              "h-12 w-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110",
              stat.color === 'blue' ? "bg-blue-600/10 text-blue-400" :
              stat.color === 'amber' ? "bg-amber-600/10 text-amber-400" :
              stat.color === 'red' ? "bg-red-600/10 text-red-400" : "bg-green-600/10 text-green-400"
            )}>
              <stat.icon size={24} />
            </div>
            <p className="text-slate-400 text-sm font-medium">{stat.name}</p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Total Pendapatan Banner */}
      <div className="glass-card rounded-3xl p-6 border border-slate-800/50 bg-gradient-to-r from-green-900/10 to-emerald-900/10 border-green-500/20">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 bg-green-500/10 text-green-400 rounded-2xl flex items-center justify-center">
            <TrendingUp size={28} />
          </div>
          <div>
            <p className="text-slate-400 text-sm">Total Pendapatan (Lunas)</p>
            <p className="text-3xl font-bold text-green-400">{formatCurrency(stats.totalRevenue)}</p>
          </div>
        </div>
      </div>

      {/* Shortcut Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button onClick={() => router.push('/admin/payments')} className="glass-card rounded-2xl p-6 border border-slate-800/50 hover:border-blue-500/30 transition-all text-left group">
          <h4 className="font-bold mb-1">Riwayat Pembayaran</h4>
          <p className="text-slate-500 text-xs">Lihat semua data pembayaran santri</p>
          <ArrowUpRight size={16} className="mt-3 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
        <button onClick={() => router.push('/admin/verify')} className="glass-card rounded-2xl p-6 border border-slate-800/50 hover:border-amber-500/30 transition-all text-left group">
          <h4 className="font-bold mb-1">Verifikasi Pembayaran</h4>
          <p className="text-slate-500 text-xs">Cek bukti transfer dari orang tua</p>
          <ArrowUpRight size={16} className="mt-3 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
        <button onClick={() => router.push('/admin/students')} className="glass-card rounded-2xl p-6 border border-slate-800/50 hover:border-green-500/30 transition-all text-left group">
          <h4 className="font-bold mb-1">Kelola Santri</h4>
          <p className="text-slate-500 text-xs">Tambah dan atur data santri</p>
          <ArrowUpRight size={16} className="mt-3 text-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>
    </div>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ")
}
