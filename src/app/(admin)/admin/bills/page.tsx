"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { 
  CreditCard, 
  Plus, 
  Calendar, 
  ChevronRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Loader2,
  BarChart3
} from "lucide-react"
import { motion } from "framer-motion"
import { formatCurrency, cn } from "@/lib/utils"

export const dynamic = 'force-dynamic'

export default function BillsPage() {
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({ total: 0, paid: 0, pending: 0, unpaid: 0 })
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [details, setDetails] = useState({
    kosMakan: 100000,
    sekolahDiniah: 50000,
    sekolahFormal: 50000,
    listrikKesehatan: 25000,
    uangGedung: 25000
  })

  const amount = Object.values(details).reduce((a, b) => a + b, 0)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    const { data: payments } = await supabase.from("payments").select("status, amount")
    const stats = { total: 0, paid: 0, pending: 0, unpaid: 0 }
    payments?.forEach(p => {
      stats.total += Number(p.amount)
      if (p.status === 'paid') stats.paid++
      else if (p.status === 'pending') stats.pending++
      else stats.unpaid++
    })
    setStats(stats)
  }

  const handleGenerateBills = async () => {
    if (!confirm(`Generate tagihan untuk bulan ${selectedMonth}/${selectedYear}?`)) return
    
    setLoading(true)
    try {
      const { data: students } = await supabase.from("students").select("id")
      if (!students) return

      const billingData = students.map(s => ({
        student_id: s.id,
        month: selectedMonth,
        year: selectedYear,
        amount: amount,
        status: 'unpaid'
      }))

      const { error } = await supabase.from("payments").insert(billingData)
      if (error) throw error

      alert("Tagihan berhasil digenerate untuk " + students.length + " santri.")
      fetchStats()
    } catch (error: any) {
      alert("Gagal generate tagihan: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-outfit">Manajemen Tagihan</h1>
          <p className="text-slate-400">Generate dan pantau tagihan bulanan santri.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card rounded-3xl p-8 border border-slate-800/50">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Plus className="text-blue-500" /> Generate Tagihan Masal
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Bulan</label>
                <select 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none appearance-none"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(new Date(2000, i))}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Tahun</label>
                <select 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none appearance-none"
                >
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-950/50 border border-slate-800/50 rounded-2xl p-5 mb-6 space-y-4">
              <h4 className="text-sm font-medium text-slate-300 border-b border-slate-800 pb-2">Perincian Pembayaran</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Kos Makan</label>
                  <input type="number" value={details.kosMakan} onChange={(e) => setDetails({...details, kosMakan: Number(e.target.value)})} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Sekolah Diniah</label>
                  <input type="number" value={details.sekolahDiniah} onChange={(e) => setDetails({...details, sekolahDiniah: Number(e.target.value)})} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Sekolah Formal</label>
                  <input type="number" value={details.sekolahFormal} onChange={(e) => setDetails({...details, sekolahFormal: Number(e.target.value)})} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Listrik & Kesehatan</label>
                  <input type="number" value={details.listrikKesehatan} onChange={(e) => setDetails({...details, listrikKesehatan: Number(e.target.value)})} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Uang Gedung</label>
                  <input type="number" value={details.uangGedung} onChange={(e) => setDetails({...details, uangGedung: Number(e.target.value)})} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div className="flex justify-between items-center bg-blue-500/10 p-3 rounded-lg border border-blue-500/20 mt-4">
                <span className="text-sm text-blue-400 font-medium">Total Nominal (Rp)</span>
                <span className="text-lg font-bold text-blue-400">{formatCurrency(amount)}</span>
              </div>
            </div>

            <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-2xl mb-6">
              <p className="text-sm text-blue-400 flex items-start gap-2">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                Aksi ini akan membuat tagihan baru untuk seluruh santri yang terdaftar di database.
              </p>
            </div>

            <button 
              onClick={handleGenerateBills}
              disabled={loading}
              className="w-full btn-primary py-4 text-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={24} /> Memproses...
                </span>
              ) : "Generate Sekarang"}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card rounded-3xl p-6 border border-slate-800/50">
            <h4 className="text-slate-400 text-sm font-medium mb-4 uppercase tracking-wider">Statistik Tagihan</h4>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-green-500/10 text-green-500 rounded-xl flex items-center justify-center">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Lunas</p>
                    <p className="text-lg font-bold">{stats.paid}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Persentase</p>
                  <p className="text-sm font-bold text-green-400">
                    {stats.total > 0 ? Math.round((stats.paid / (stats.paid + stats.unpaid + stats.pending)) * 100) : 0}%
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Pending</p>
                    <p className="text-lg font-bold">{stats.pending}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Belum Bayar</p>
                    <p className="text-lg font-bold">{stats.unpaid}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
