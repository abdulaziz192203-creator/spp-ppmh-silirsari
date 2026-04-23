"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { 
  CreditCard, 
  Plus, 
  Calendar, 
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Save,
  GraduationCap
} from "lucide-react"
import { motion } from "framer-motion"
import { formatCurrency, cn, JENJANG_OPTIONS, BILLING_COMPONENTS, getJenjangLabel } from "@/lib/utils"
import { generateBulkBills, saveBillingRates, getBillingRates } from "@/app/actions/bill-actions"

export const dynamic = 'force-dynamic'

type BillingRatesMap = Record<string, Record<string, number>>

const JENJANG_ICONS: Record<string, string> = {
  tidak_sekolah: '🏠',
  sd_mi: '📗',
  smp_mts: '📘',
  sma_ma: '📕',
  kuliah: '🎓',
}

export default function BillsPage() {
  const [loading, setLoading] = useState(false)
  const [savingRates, setSavingRates] = useState(false)
  const [stats, setStats] = useState({ total: 0, paid: 0, pending: 0, unpaid: 0 })
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [deadlineDay, setDeadlineDay] = useState(10)
  const [savingDeadline, setSavingDeadline] = useState(false)
  const [activeJenjang, setActiveJenjang] = useState<string>(JENJANG_OPTIONS[0].value)
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({})
  
  // Rates per jenjang
  const [rates, setRates] = useState<BillingRatesMap>(() => {
    const initial: BillingRatesMap = {}
    JENJANG_OPTIONS.forEach(j => {
      initial[j.value] = {}
      BILLING_COMPONENTS.forEach(c => {
        initial[j.value][c.key] = 0
      })
    })
    return initial
  })

  useEffect(() => {
    fetchStats()
    fetchDeadline()
    fetchRates()
    fetchStudentCounts()
  }, [])

  const fetchStudentCounts = async () => {
    const { data } = await supabase.from("students").select("jenjang")
    if (data) {
      const counts: Record<string, number> = {}
      data.forEach(s => {
        const j = s.jenjang || 'smp_mts'
        counts[j] = (counts[j] || 0) + 1
      })
      setStudentCounts(counts)
    }
  }

  const fetchRates = async () => {
    const dbRates = await getBillingRates()
    setRates(dbRates)
  }

  const fetchDeadline = async () => {
    const { data } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "payment_deadline_day")
      .single()
    if (data) setDeadlineDay(Number(data.value))
  }

  const handleUpdateDeadline = async () => {
    setSavingDeadline(true)
    try {
      const { error } = await supabase
        .from("system_settings")
        .upsert({ 
          key: "payment_deadline_day", 
          value: deadlineDay.toString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' })
      
      if (error) throw error
      alert("Batas waktu pembayaran berhasil diperbarui!")
    } catch (error: any) {
      alert("Gagal memperbarui batas waktu: " + error.message)
    } finally {
      setSavingDeadline(false)
    }
  }

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

  const handleSaveRates = async () => {
    setSavingRates(true)
    try {
      const response = await saveBillingRates(rates)
      if (response.success) {
        alert("Tarif per jenjang berhasil disimpan!")
      } else {
        alert("Gagal menyimpan: " + response.error)
      }
    } catch (error: any) {
      alert("Gagal menyimpan tarif: " + error.message)
    } finally {
      setSavingRates(false)
    }
  }

  const handleUpdateRate = (jenjang: string, component: string, value: number) => {
    setRates(prev => ({
      ...prev,
      [jenjang]: {
        ...prev[jenjang],
        [component]: value
      }
    }))
  }

  const getJenjangTotal = (jenjang: string) => {
    const jRates = rates[jenjang] || {}
    return Object.values(jRates).reduce((sum, val) => sum + (Number(val) || 0), 0)
  }

  const handleGenerateBills = async () => {
    const totalStudents = Object.values(studentCounts).reduce((a, b) => a + b, 0)
    if (!confirm(`Generate tagihan untuk bulan ${selectedMonth}/${selectedYear} untuk ${totalStudents} santri?\n\nTagihan akan dibuat sesuai jenjang masing-masing santri.`)) return
    
    setLoading(true)
    try {
      const response = await generateBulkBills(selectedMonth, selectedYear)
      
      if (response.success) {
        alert(response.message)
        fetchStats()
      } else {
        alert("Gagal: " + response.error)
      }
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
          <p className="text-slate-400">Atur tarif per jenjang dan generate tagihan bulanan.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          
          {/* Tarif Per Jenjang Section */}
          <div className="glass-card rounded-3xl p-8 border border-slate-800/50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <GraduationCap className="text-blue-500" /> Tarif Per Jenjang
              </h3>
              <button
                onClick={handleSaveRates}
                disabled={savingRates}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 shadow-lg shadow-blue-900/20"
              >
                {savingRates ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Simpan Tarif
              </button>
            </div>

            {/* Jenjang Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
              {JENJANG_OPTIONS.map((j) => (
                <button
                  key={j.value}
                  onClick={() => setActiveJenjang(j.value)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border",
                    activeJenjang === j.value 
                      ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-900/20" 
                      : "bg-slate-900/50 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200"
                  )}
                >
                  <span>{JENJANG_ICONS[j.value]}</span>
                  {j.label}
                  {studentCounts[j.value] ? (
                    <span className={cn(
                      "px-1.5 py-0.5 rounded-md text-[10px]",
                      activeJenjang === j.value 
                        ? "bg-white/20 text-white" 
                        : "bg-slate-800 text-slate-500"
                    )}>
                      {studentCounts[j.value]}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>

            {/* Rates Form for Active Jenjang */}
            <motion.div
              key={activeJenjang}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{JENJANG_ICONS[activeJenjang]}</span>
                <div>
                  <h4 className="font-bold text-slate-200">Rincian Tarif — {getJenjangLabel(activeJenjang)}</h4>
                  <p className="text-xs text-slate-500">
                    {studentCounts[activeJenjang] || 0} santri terdaftar di jenjang ini
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {BILLING_COMPONENTS.map((comp) => (
                  <div key={comp.key}>
                    <label className="block text-xs text-slate-400 mb-1">{comp.label}</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-medium">Rp</span>
                      <input 
                        type="number" 
                        value={rates[activeJenjang]?.[comp.key] || 0} 
                        onChange={(e) => handleUpdateRate(activeJenjang, comp.key, Number(e.target.value))} 
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none font-medium" 
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center bg-blue-500/10 p-4 rounded-xl border border-blue-500/20 mt-4">
                <span className="text-sm text-blue-400 font-medium">Total Tagihan ({getJenjangLabel(activeJenjang)})</span>
                <span className="text-lg font-bold text-blue-400">{formatCurrency(getJenjangTotal(activeJenjang))}</span>
              </div>
            </motion.div>
          </div>


          {/* Generate Section */}
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

            <div className="bg-amber-500/5 border border-amber-500/10 p-5 rounded-2xl mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center">
                  <Calendar size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-200">Batas Waktu Pembayaran</h4>
                  <p className="text-xs text-slate-500">Jatuh tempo pembayaran setiap bulan.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input 
                  type="number"
                  min="1"
                  max="31"
                  value={deadlineDay}
                  onChange={(e) => setDeadlineDay(Number(e.target.value))}
                  className="w-20 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-center font-bold text-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                />
                <button 
                  onClick={handleUpdateDeadline}
                  disabled={savingDeadline}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                >
                  {savingDeadline ? <Loader2 size={14} className="animate-spin" /> : "Update"}
                </button>
              </div>
            </div>

            <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-2xl mb-6">
              <p className="text-sm text-blue-400 flex items-start gap-2">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                Tagihan akan dibuat secara otomatis sesuai jenjang masing-masing santri dengan tarif yang sudah disimpan.
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

          {/* Jumlah Santri Per Jenjang */}
          <div className="glass-card rounded-3xl p-6 border border-slate-800/50">
            <h4 className="text-slate-400 text-sm font-medium mb-4 uppercase tracking-wider">Santri Per Jenjang</h4>
            <div className="space-y-3">
              {JENJANG_OPTIONS.map(j => (
                <div key={j.value} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{JENJANG_ICONS[j.value]}</span>
                    <span className="text-sm text-slate-300">{j.label}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-200">{studentCounts[j.value] || 0}</span>
                </div>
              ))}
              <div className="border-t border-slate-800 pt-3 flex items-center justify-between">
                <span className="text-sm text-slate-400 font-bold">Total</span>
                <span className="text-sm font-bold text-blue-400">
                  {Object.values(studentCounts).reduce((a, b) => a + b, 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
