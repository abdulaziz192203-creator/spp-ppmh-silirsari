"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search,
  Filter,
  Download,
  Trash2
} from "lucide-react"
import { motion } from "framer-motion"
import { formatCurrency } from "@/lib/utils"

export const dynamic = 'force-dynamic'

export default function PaymentsPage() {
  const [allPayments, setAllPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchAllPayments()
  }, [])

  const fetchAllPayments = async () => {
    setLoading(true)
    const { data } = await supabase
      .from("payments")
      .select("*, students(name, nisn, class_room)")
      .order("year", { ascending: false })
      .order("month", { ascending: false })
    
    setAllPayments(data || [])
    setLoading(false)
  }

  const handleExportCSV = (type: 'all' | 'paid') => {
    const dataToExport = type === 'paid' 
      ? allPayments.filter(p => p.status === 'paid')
      : allPayments

    if (dataToExport.length === 0) {
      alert("Tidak ada data untuk diunduh.")
      return
    }

    const headers = ["Nama Santri", "NISN", "Kelas", "Bulan", "Tahun", "Nominal", "Status"]
    const rows = dataToExport.map(p => [
      p.students?.name,
      p.students?.nisn,
      p.students?.class_room,
      getMonthName(p.month),
      p.year,
      p.amount,
      p.status === 'paid' ? 'Lunas' : p.status === 'pending' ? 'Pending' : 'Belum Bayar'
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `rekap-pembayaran-${type}-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDeleteOne = async (id: string, name: string) => {
    const confirmDelete = confirm(`Apakah Anda yakin ingin menghapus data pembayaran untuk ${name}? Tindakan ini tidak dapat dibatalkan.`)
    
    if (confirmDelete) {
      setLoading(true)
      const { error } = await supabase
        .from("payments")
        .delete()
        .eq("id", id)
      
      if (error) {
        alert("Gagal menghapus data: " + error.message)
      } else {
        fetchAllPayments()
      }
      setLoading(false)
    }
  }

  const handleDeleteVerified = async () => {
    const paidPayments = allPayments.filter(p => p.status === 'paid')
    if (paidPayments.length === 0) {
      alert("Tidak ada data pembayaran lunas untuk dihapus.")
      return
    }

    const confirmDelete = confirm(`Apakah Anda yakin ingin menghapus ${paidPayments.length} data pembayaran yang sudah lunas? Data yang dihapus tidak dapat dikembalikan.`)
    
    if (confirmDelete) {
      setLoading(true)
      const { error } = await supabase
        .from("payments")
        .delete()
        .eq("status", "paid")
      
      if (error) {
        alert("Gagal menghapus data: " + error.message)
      } else {
        alert("Data berhasil dihapus.")
        fetchAllPayments()
      }
      setLoading(false)
    }
  }

  const filteredPayments = allPayments.filter(p => {
    const matchesStatus = filterStatus === "all" || p.status === filterStatus
    const matchesSearch = searchQuery === "" || 
      p.students?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.students?.nisn?.includes(searchQuery)
    return matchesStatus && matchesSearch
  })

  const getMonthName = (month: number) => {
    return new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(new Date(2000, month - 1))
  }

  const statusCounts = {
    all: allPayments.length,
    paid: allPayments.filter(p => p.status === 'paid').length,
    pending: allPayments.filter(p => p.status === 'pending').length,
    unpaid: allPayments.filter(p => p.status === 'unpaid').length,
  }

  const tabs = [
    { key: "all", label: "Semua", count: statusCounts.all, color: "blue" },
    { key: "paid", label: "Sudah Lunas", count: statusCounts.paid, color: "green" },
    { key: "pending", label: "Menunggu Verifikasi", count: statusCounts.pending, color: "amber" },
    { key: "unpaid", label: "Belum Bayar", count: statusCounts.unpaid, color: "red" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-outfit">Data Pembayaran</h1>
        <p className="text-slate-400">Kelola dan pantau seluruh pembayaran santri.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterStatus(tab.key)}
            className={cn(
              "rounded-2xl p-4 text-left transition-all border",
              filterStatus === tab.key 
                ? tab.color === 'blue' ? "bg-blue-600/10 border-blue-500/30" :
                  tab.color === 'green' ? "bg-green-600/10 border-green-500/30" :
                  tab.color === 'amber' ? "bg-amber-600/10 border-amber-500/30" :
                  "bg-red-600/10 border-red-500/30"
                : "bg-slate-900/30 border-slate-800/50 hover:border-slate-700"
            )}
          >
            <p className={cn(
              "text-2xl font-bold",
              filterStatus === tab.key
                ? tab.color === 'blue' ? "text-blue-400" :
                  tab.color === 'green' ? "text-green-400" :
                  tab.color === 'amber' ? "text-amber-400" : "text-red-400"
                : "text-slate-200"
            )}>{tab.count}</p>
            <p className="text-xs text-slate-400 mt-1">{tab.label}</p>
          </button>
        ))}
      </div>

      {/* Search & Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/50 p-3 rounded-2xl border border-slate-800/50">
        <div className="flex items-center gap-3 bg-slate-950/50 px-3 py-1.5 rounded-xl border border-slate-800/50 w-full md:w-96">
          <Search size={18} className="text-slate-500" />
          <input 
            type="text"
            placeholder="Cari nama santri atau NISN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-slate-200 text-sm py-1"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button 
            onClick={() => handleExportCSV('all')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-all border border-slate-700"
          >
            <Download size={14} />
            Download Semua
          </button>

          <button 
            onClick={() => handleExportCSV('paid')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-blue-900/20"
          >
            <CheckCircle2 size={14} />
            Download Lunas
          </button>
          
          <button 
            onClick={handleDeleteVerified}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-900/30 rounded-xl text-xs font-semibold transition-all"
          >
            <Trash2 size={14} />
            Bersihkan Lunas
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="glass-card rounded-3xl overflow-hidden border border-slate-800/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Santri</th>
                <th className="px-6 py-4 font-semibold">Bulan/Tahun</th>
                <th className="px-6 py-4 font-semibold">Nominal</th>
                <th className="px-6 py-4 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">Memuat data...</td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    Tidak ada data pembayaran ditemukan.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment, idx) => (
                  <motion.tr 
                    key={payment.id} 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.02 }}
                    className="hover:bg-slate-900/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                          payment.status === 'paid' ? "bg-green-500/10 text-green-500" :
                          payment.status === 'pending' ? "bg-amber-500/10 text-amber-500" :
                          "bg-red-500/10 text-red-500"
                        )}>
                          {payment.status === 'paid' ? <CheckCircle2 size={16} /> :
                           payment.status === 'pending' ? <Clock size={16} /> :
                           <AlertCircle size={16} />}
                        </div>
                        <div>
                          <p className="font-medium text-slate-200 text-sm">{payment.students?.name || 'N/A'}</p>
                          <p className="text-[10px] text-slate-500">NISN: {payment.students?.nisn} • Kelas {payment.students?.class_room}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300 text-sm">
                      {getMonthName(payment.month)} {payment.year}
                    </td>
                    <td className="px-6 py-4 font-bold text-sm text-blue-400">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-lg",
                        payment.status === 'paid' ? "bg-green-500/10 text-green-400" :
                        payment.status === 'pending' ? "bg-amber-500/10 text-amber-400" :
                        "bg-red-500/10 text-red-400"
                      )}>
                        {payment.status === 'paid' ? '✓ Lunas' : 
                         payment.status === 'pending' ? '⏳ Verifikasi' : 
                         '✗ Belum Bayar'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => handleDeleteOne(payment.id, payment.students?.name)}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                        title="Hapus Pembayaran"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 bg-slate-900/30 border-t border-slate-800/50 flex justify-between text-xs text-slate-500">
          <span>Menampilkan {filteredPayments.length} dari {allPayments.length} pembayaran</span>
        </div>
      </div>
    </div>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ")
}
