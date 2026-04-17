"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { formatDate } from "@/lib/utils"
import { User, CheckCircle, Clock, AlertCircle, Copy, Check, BarChart3, Wallet } from "lucide-react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export const dynamic = 'force-dynamic'

export default function ParentDashboard() {
  const [student, setStudent] = useState<any>(null)
  const [stats, setStats] = useState({
    unpaidCount: 0,
    totalPayments: 0,
    pendingCount: 0
  })
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push("/")

      const { data: profile } = await supabase
        .from("profiles")
        .select("nisn")
        .eq("id", user.id)
        .single()

      if (!profile?.nisn) return

      const { data: studentData } = await supabase
        .from("students")
        .select("*")
        .eq("nisn", profile.nisn)
        .single()

      setStudent(studentData)

      if (studentData) {
        const { data: payments } = await supabase
          .from("payments")
          .select("status")
          .eq("student_id", studentData.id)

        const unpaid = payments?.filter(p => p.status === 'unpaid').length || 0
        const pending = payments?.filter(p => p.status === 'pending').length || 0
        
        setStats({
          unpaidCount: unpaid,
          totalPayments: payments?.length || 0,
          pendingCount: pending
        })
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  )

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-outfit">Dashboard</h1>
          <p className="text-slate-400">Selamat datang kembali di portal pembayaran santri.</p>
        </div>
        <div className="bg-slate-900/50 px-4 py-2 rounded-2xl border border-slate-800 flex items-center gap-2">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-slate-400">Sistem Online</span>
        </div>
      </div>

      {student && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 glass-card rounded-3xl p-8 relative overflow-hidden group border border-slate-800/50"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <User size={120} />
            </div>
            
            <div className="flex items-center gap-6 relative z-10">
              <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-2xl">
                <User size={48} />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-1">{student.name}</h2>
                <p className="text-slate-400 font-medium">NISN: {student.nisn}</p>
                <div className="flex items-center gap-2 mt-3">
                    <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-xs font-bold border border-blue-500/20">
                        Kelas {student.class_room}
                    </span>
                    <span className="bg-slate-800 text-slate-400 px-3 py-1 rounded-full text-xs font-medium">
                        Santri Aktif
                    </span>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-slate-800/50 grid grid-cols-2 gap-4">
                <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/50">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Status SPP</p>
                    <p className={cn(
                        "text-lg font-bold",
                        stats.unpaidCount > 0 ? "text-red-400" : "text-green-400"
                    )}>
                        {stats.unpaidCount > 0 ? `${stats.unpaidCount} Bulan Belum Bayar` : 'Lunas Terbayar'}
                    </p>
                </div>
                <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/50">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Update Terakhir</p>
                    <p className="text-lg font-bold text-slate-200">{formatDate(new Date())}</p>
                </div>
            </div>
          </motion.div>

          {/* Quick Stats Card */}
          <div className="space-y-4">
              <div 
                onClick={() => router.push('/bills')}
                className="glass rounded-3xl p-6 border border-slate-800/50 hover:border-blue-500/30 transition-all cursor-pointer group"
              >
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-10 w-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center">
                        <Wallet size={20} />
                    </div>
                    <CheckCircle className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" size={16} />
                  </div>
                  <p className="text-slate-500 text-sm">Menunggu Verifikasi</p>
                  <p className="text-2xl font-bold">{stats.pendingCount} Tagihan</p>
              </div>

              <div className="glass rounded-3xl p-6 border border-slate-800/50 bg-gradient-to-br from-blue-600/5 to-transparent">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-10 w-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center">
                        <BarChart3 size={20} />
                    </div>
                  </div>
                  <p className="text-slate-500 text-sm">Total Riwayat</p>
                  <p className="text-2xl font-bold">{stats.totalPayments} Catatan</p>
              </div>
          </div>
        </div>
      )}

    
      {/* Quick Access Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={() => router.push('/bills')}
            className="group glass-card rounded-2xl p-6 text-left border border-slate-800/50 hover:bg-blue-600/5 transition-all"
          >
              <h4 className="font-bold mb-1 flex items-center justify-between">
                Selesaikan Pembayaran
                <Wallet className="text-blue-500 opacity-50 group-hover:opacity-100 transition-opacity" size={20} />
              </h4>
              <p className="text-xs text-slate-500 italic">Lihat daftar tagihan yang belum lunas</p>
          </button>
          <button 
            onClick={() => router.push('/history')}
            className="group glass-card rounded-2xl p-6 text-left border border-slate-800/50 hover:bg-slate-800 transition-all"
          >
              <h4 className="font-bold mb-1 flex items-center justify-between">
                Lihat Riwayat
                <Clock className="text-slate-500 group-hover:text-slate-300 transition-opacity" size={20} />
              </h4>
              <p className="text-xs text-slate-500 italic">Cek status verifikasi pembayaran Anda</p>
          </button>
      </div>
    </div>
  )
}
