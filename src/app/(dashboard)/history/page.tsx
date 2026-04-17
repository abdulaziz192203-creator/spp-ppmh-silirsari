"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { formatCurrency, formatDate } from "@/lib/utils"
import { History as HistoryIcon, CheckCircle, Clock, Search, CreditCard } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export default function HistoryPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get profile to find NISN
      const { data: profile } = await supabase
        .from("profiles")
        .select("nisn")
        .eq("id", user.id)
        .single()

      if (!profile?.nisn) return

      // Get student data
      const { data: studentData } = await supabase
        .from("students")
        .select("id")
        .eq("nisn", profile.nisn)
        .single()

      if (studentData) {
        // Get non-unpaid payments (paid and pending)
        const { data: paymentData } = await supabase
          .from("payments")
          .select("*")
          .eq("student_id", studentData.id)
          .neq("status", "unpaid")
          .order("created_at", { ascending: false })

        setPayments(paymentData || [])
      }
    } catch (error) {
      console.error("Error fetching history:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  )

  return (
    <div className="space-y-8 pb-12">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 bg-blue-600/10 text-blue-400 rounded-xl flex items-center justify-center font-bold">
            <HistoryIcon size={24} />
          </div>
          <h1 className="text-2xl font-bold font-outfit">Riwayat Bayar</h1>
        </div>
        <p className="text-slate-400 text-sm">Catatan pembayaran SPP yang telah diunggah.</p>
      </div>

      <div className="space-y-4">
        {payments.length === 0 ? (
          <div className="text-center py-20 glass rounded-3xl border border-slate-800/50">
            <Search className="mx-auto mb-4 text-slate-700" size={48} />
            <p className="text-slate-500 font-medium">Belum ada riwayat pembayaran.</p>
            <p className="text-slate-600 text-xs mt-1">Lakukan pembayaran di menu Tagihan.</p>
          </div>
        ) : (
          payments.map((payment, idx) => (
            <motion.div 
              key={payment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="glass rounded-2xl p-5 border border-slate-800/50 hover:border-blue-500/30 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-12 w-12 rounded-2xl flex items-center justify-center",
                    payment.status === 'paid' ? "bg-green-500/10 text-green-400" : "bg-amber-500/10 text-amber-400"
                  )}>
                    {payment.status === 'paid' ? <CheckCircle size={24} /> : <Clock size={24} />}
                  </div>
                  <div>
                    <h4 className="font-bold">SPP {new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(new Date(2000, payment.month - 1))} {payment.year}</h4>
                    <p className="text-xs text-slate-500">Dibayar pada {formatDate(payment.created_at)}</p>
                  </div>
                </div>
                <div className={cn(
                  "text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border",
                  payment.status === 'paid' 
                    ? "bg-green-500/10 text-green-400 border-green-500/20" 
                    : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                )}>
                  {payment.status === 'paid' ? 'Lunas' : 'Menunggu Verifikasi'}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
                <div className="flex items-center gap-2 text-slate-400">
                  <CreditCard size={14} />
                  <span className="text-xs">Nominal Transfer</span>
                </div>
                <span className="font-bold text-blue-400">{formatCurrency(payment.amount)}</span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
