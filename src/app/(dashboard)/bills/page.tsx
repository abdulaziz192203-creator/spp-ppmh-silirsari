"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { formatCurrency } from "@/lib/utils"
import { CreditCard, CheckCircle, Clock, AlertCircle, Upload, Search, Copy, Check, QrCode } from "lucide-react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import UploadProofModal from "@/components/layout/UploadProofModal"

export const dynamic = 'force-dynamic'

export default function BillsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPayment, setSelectedPayment] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [copied, setCopied] = useState(false)
  const [methods, setMethods] = useState<any[]>([])
  const [settings, setSettings] = useState<any>({
    bank_name: "BSI",
    bank_account_number: "7123456789",
    bank_account_name: "PP Miftahul Huda"
  })
  const router = useRouter()

  const handleCopy = () => {
    navigator.clipboard.writeText(settings.bank_account_number)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    fetchPayments()
    fetchSettings()
    fetchMethods()
  }, [])

  const fetchMethods = async () => {
    const { data } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("is_enabled", true)
      .order("category", { ascending: false })
    
    setMethods(data || [])
  }

  const fetchSettings = async () => {
    const { data } = await supabase.from("system_settings").select("*")
    if (data) {
      const settingsObj = data.reduce((acc: any, curr) => {
        acc[curr.key] = curr.value
        return acc
      }, {})
      setSettings({
        bank_name: settingsObj.bank_name || "BSI",
        bank_account_number: settingsObj.bank_account_number || "7123456789",
        bank_account_name: settingsObj.bank_account_name || "PP Miftahul Huda"
      })
    }
  }

  const fetchPayments = async () => {
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
        .select("id")
        .eq("nisn", profile.nisn)
        .single()

      if (studentData) {
        const { data: paymentData } = await supabase
          .from("payments")
          .select("*")
          .eq("student_id", studentData.id)
          .order("year", { ascending: false })
          .order("month", { ascending: false })

        setPayments(paymentData || [])
      }
    } catch (error) {
      console.error("Error fetching payments:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPayments = payments.filter(p => {
    const monthName = new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(new Date(2000, p.month - 1))
    return monthName.toLowerCase().includes(searchQuery.toLowerCase()) || p.year.toString().includes(searchQuery)
  })

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  )

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold font-outfit">Tagihan Bulanan</h1>
        <p className="text-slate-400">Daftar kewajiban SPP santri per bulan.</p>
      </div>

      <div className="flex items-center gap-3 bg-slate-900/50 p-2 rounded-2xl border border-slate-800/50 max-w-md">
        <Search size={18} className="text-slate-500 ml-2" />
        <input 
          type="text"
          placeholder="Cari bulan atau tahun..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none text-slate-200 text-sm py-1.5"
        />
      </div>

      {/* Payment Instructions Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-3xl p-10 border border-blue-500/20 bg-blue-500/5 mb-8"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
            <div className="flex-1">
                <div className="flex items-center gap-4 mb-8">
                    <div className="h-14 w-14 bg-blue-600/10 text-blue-400 rounded-2xl flex items-center justify-center">
                        <CreditCard size={32} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold">Instruksi Pembayaran</h3>
                        <p className="text-sm text-slate-400">Silakan ikuti langkah-langkah di bawah ini untuk setor pembayaran.</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-slate-950/50 p-8 rounded-3xl border border-slate-800/50">
                    {[
                        "Pilih salah satu kotak tagihan di bawah ini.",
                        "Tentukan metode pembayaran favorit Anda.",
                        "Lakukan pembayaran sesuai instruksi/QR.",
                        "Upload bukti pembayaran untuk diverifikasi."
                    ].map((step, i) => (
                        <div key={i} className="flex flex-col gap-4 text-center items-center">
                            <span className="h-10 w-10 rounded-full bg-blue-600/10 text-blue-400 flex items-center justify-center shrink-0 font-black text-sm border border-blue-500/20 shadow-lg shadow-blue-500/10">{i+1}</span>
                            <p className="text-xs text-slate-300 leading-relaxed font-medium">{step}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-4">
        {filteredPayments.length === 0 ? (
          <div className="text-center py-20 glass rounded-3xl opacity-50 border border-slate-800/50">
            <CreditCard className="mx-auto mb-4 text-slate-700" size={48} />
            <p className="text-sm">Tidak ada tagihan ditemukan</p>
          </div>
        ) : (
          filteredPayments.map((payment, idx) => (
            <motion.div 
              key={payment.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => {
                if (payment.status === 'unpaid') {
                  setSelectedPayment(payment)
                  setIsModalOpen(true)
                }
              }}
              className={cn(
                "glass rounded-3xl p-6 transition-all group border border-slate-800/50 block",
                payment.status === 'unpaid' ? "cursor-pointer hover:border-blue-500/50 hover:bg-slate-900/50" : "opacity-80"
              )}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div className="flex items-center gap-5 mb-4 md:mb-0">
                    <div className={cn(
                      "h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg",
                      payment.status === 'paid' ? "bg-green-500/10 text-green-500" :
                      payment.status === 'pending' ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500"
                    )}>
                      {payment.status === 'paid' ? <CheckCircle size={28} /> :
                       payment.status === 'pending' ? <Clock size={28} /> : <AlertCircle size={28} />}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">SPP Bulan {new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(new Date(2000, payment.month - 1))}</h4>
                      <p className="text-sm text-slate-500 font-medium">{payment.year} • <span className="text-blue-400 font-bold">{formatCurrency(payment.amount)}</span></p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-none border-slate-800 pt-4 md:pt-0">
                    <div className="flex flex-col items-end">
                        <span className={cn(
                        "text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border",
                        payment.status === 'paid' ? "bg-green-500/10 text-green-400 border-green-500/20" :
                        payment.status === 'pending' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                        )}>
                        {payment.status === 'paid' ? 'Sudah Lunas' : payment.status === 'pending' ? 'Sedang Diverifikasi' : 'Belum Lunas'}
                        </span>
                        {payment.status === 'unpaid' && (
                            <p className="text-[10px] text-blue-400 mt-2 font-bold animate-pulse">Klik untuk Bayar</p>
                        )}
                    </div>
                    {payment.status === 'unpaid' && (
                      <div className="bg-blue-600 text-white p-3 rounded-2xl shadow-lg shadow-blue-900/40 group-hover:scale-110 transition-transform md:ml-4">
                        <Upload size={20} />
                      </div>
                    )}
                  </div>
              </div>
              
              <div className="w-full mt-4 pt-4 border-t border-slate-800/50">
                  <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">Perincian Tagihan Standar</p>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs text-slate-400">
                      <div className="bg-slate-900/30 p-2 rounded-lg border border-slate-800/50">
                          <p className="opacity-70 mb-1 scale-90 origin-left">Kos Makan</p>
                          <p className="font-semibold text-slate-300">Rp 100.000</p>
                      </div>
                      <div className="bg-slate-900/30 p-2 rounded-lg border border-slate-800/50">
                          <p className="opacity-70 mb-1 scale-90 origin-left">Sekolah Diniah</p>
                          <p className="font-semibold text-slate-300">Rp 50.000</p>
                      </div>
                      <div className="bg-slate-900/30 p-2 rounded-lg border border-slate-800/50">
                          <p className="opacity-70 mb-1 scale-90 origin-left">Sekolah Formal</p>
                          <p className="font-semibold text-slate-300">Rp 50.000</p>
                      </div>
                      <div className="bg-slate-900/30 p-2 rounded-lg border border-slate-800/50">
                          <p className="opacity-70 mb-1 scale-90 origin-left">Listrik & Kes</p>
                          <p className="font-semibold text-slate-300">Rp 25.000</p>
                      </div>
                      <div className="bg-slate-900/30 p-2 rounded-lg border border-slate-800/50">
                          <p className="opacity-70 mb-1 scale-90 origin-left">Uang Gedung</p>
                          <p className="font-semibold text-slate-300">Rp 25.000</p>
                      </div>
                  </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {selectedPayment && (
        <UploadProofModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            payment={selectedPayment}
            onSuccess={() => {
            fetchPayments()
            alert("Bukti pembayaran berhasil diupload. Mohon tunggu verifikasi admin.")
            }}
        />
      )}
    </div>
  )
}
