"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  Clock, 
  ExternalLink,
  ShieldCheck,
  Search,
  Filter
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { formatCurrency, formatDate, cn } from "@/lib/utils"

export const dynamic = 'force-dynamic'

export default function VerificationPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPayment, setSelectedPayment] = useState<any>(null)

  useEffect(() => {
    fetchPendingPayments()
  }, [])

  const fetchPendingPayments = async () => {
    setLoading(true)
    const { data } = await supabase
      .from("payments")
      .select("*, students(name, nisn, class_room)")
      .eq("status", "pending")
      .order("created_at")
    setPayments(data || [])
    setLoading(false)
  }

  const handleVerify = async (id: string, status: 'paid' | 'unpaid') => {
    const { error } = await supabase
      .from("payments")
      .update({ 
        status, 
        verified_at: status === 'paid' ? new Date().toISOString() : null 
      })
      .eq("id", id)

    if (error) alert(error.message)
    else {
      setSelectedPayment(null)
      fetchPendingPayments()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-outfit">Verifikasi Pembayaran</h1>
          <p className="text-slate-400">Verifikasi bukti transfer dari orang tua santri.</p>
        </div>
        <div className="flex gap-2">
           <button className="glass p-3 rounded-xl text-slate-400 hover:text-white">
             <Filter size={20} />
           </button>
        </div>
      </div>

      <div className="glass-card rounded-3xl overflow-hidden border border-slate-800/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Santri</th>
                <th className="px-6 py-4 font-semibold">Bulan/Tahun</th>
                <th className="px-6 py-4 font-semibold">Nominal</th>
                <th className="px-6 py-4 font-semibold">Waktu Upload</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    {loading ? "Memuat..." : "Tidak ada pembayaran menunggu verifikasi."}
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-200">{payment.students?.name}</div>
                      <div className="text-[10px] text-slate-500">NISN: {payment.students?.nisn} • {payment.students?.class_room}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(new Date(2000, payment.month - 1))} {payment.year}
                    </td>
                    <td className="px-6 py-4 font-bold text-blue-400">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {formatDate(payment.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedPayment(payment)}
                        className="bg-blue-600/10 text-blue-400 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2 ml-auto"
                      >
                        <ShieldCheck size={16} /> Verifikasi
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verification Modal */}
      <AnimatePresence>
        {selectedPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPayment(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-slate-900 border border-slate-800 rounded-3xl p-8 w-full max-w-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold font-outfit">Detail Pembayaran</h2>
                  <p className="text-sm text-slate-400">Santri: {selectedPayment.students?.name}</p>
                </div>
                <button onClick={() => setSelectedPayment(null)} className="text-slate-500 hover:text-white">
                  <XCircle size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="aspect-[3/4] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center relative group">
                    {selectedPayment.proof_url ? (
                      <img 
                        src={selectedPayment.proof_url} 
                        alt="Bukti Transfer" 
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-center p-6 text-slate-600">
                         <Search size={48} className="mx-auto mb-2 opacity-20" />
                         <p className="text-sm">Gambar bukti tidak tersedia</p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <a href={selectedPayment.proof_url} target="_blank" className="bg-white text-black px-4 py-2 rounded-xl flex items-center gap-2 font-bold transform translate-y-4 group-hover:translate-y-0 transition-transform">
                         <ExternalLink size={18} /> Perbesar
                       </a>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-between">
                  <div className="space-y-6">
                    <div className="glass p-4 rounded-2xl border-l-4 border-blue-500">
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Status Saat Ini</p>
                      <div className="flex items-center gap-2 text-amber-400">
                        <Clock size={16} /> <span className="font-bold">MENUNGGU VERIFIKASI</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                       <div className="flex justify-between border-b border-slate-800 pb-2">
                         <span className="text-slate-500">Bulan/Tahun</span>
                         <span className="font-medium text-slate-200">{new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(new Date(2000, selectedPayment.month - 1))} {selectedPayment.year}</span>
                       </div>
                       <div className="flex justify-between border-b border-slate-800 pb-2">
                         <span className="text-slate-500">Total Tagihan</span>
                         <span className="font-bold text-blue-400">{formatCurrency(selectedPayment.amount)}</span>
                       </div>
                    </div>
                  </div>

                  <div className="pt-8 space-y-3">
                    <button 
                      onClick={() => handleVerify(selectedPayment.id, 'paid')}
                      className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-green-900/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <CheckCircle size={20} /> Konfirmasi Lunas
                    </button>
                    <button 
                      onClick={() => handleVerify(selectedPayment.id, 'unpaid')}
                      className="w-full bg-red-600/10 hover:bg-red-600/20 text-red-500 font-bold py-4 rounded-2xl border border-red-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <XCircle size={20} /> Tolak Pembayaran
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
