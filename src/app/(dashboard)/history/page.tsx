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
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
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
    <div className="min-h-screen bg-slate-50 -mt-24 -mx-6 md:-mx-12 pb-24 md:pb-12">
      {/* Blue Header Section with Background Image */}
      <div className="bg-blue-600 bg-gradient-to-b from-blue-700 to-blue-600 rounded-b-[40px] pt-24 pb-12 px-6 shadow-2xl relative overflow-hidden text-center flex flex-col items-center">
         {/* Building Background Image */}
         <div className="absolute inset-0 opacity-30 pointer-events-none">
            <img 
              src="/building.jpg" 
              alt="Building" 
              className="w-full h-full object-cover mix-blend-overlay"
              onError={(e) => (e.currentTarget.style.display = 'none')} 
            />
         </div>
         <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full -ml-20 -mb-20 blur-3xl"></div>
         </div>
         <h1 className="text-3xl font-bold font-outfit text-white relative z-10 uppercase tracking-wide">Riwayat Mutasi</h1>
         <p className="text-white/70 relative z-10 max-w-md text-sm mt-2 font-medium">Pantau seluruh catatan transaksi dan status verifikasi pembayaran Anda.</p>
      </div>

      <div className="px-6 pt-10 space-y-4 max-w-4xl mx-auto">
        {payments.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <Search className="mx-auto mb-4 text-slate-200" size={48} />
            <p className="text-slate-400 font-bold uppercase tracking-tight text-sm">Belum Ada Transaksi</p>
            <p className="text-slate-300 text-[10px] mt-1">Tagihan yang dibayar akan muncul di sini.</p>
          </div>
        ) : (
          payments.map((payment, idx) => (
            <motion.div 
              key={payment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-12 w-12 rounded-2xl flex items-center justify-center shadow-sm",
                    payment.status === 'paid' ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"
                  )}>
                    {payment.status === 'paid' ? <CheckCircle size={22} /> : <Clock size={22} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 leading-tight">SPP {new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(new Date(2000, payment.month - 1))} {payment.year}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-tight">{formatDate(payment.created_at)}</p>
                  </div>
                </div>
                <div className={cn(
                  "text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border",
                  payment.status === 'paid' 
                    ? "bg-green-100 text-green-700 border-green-200" 
                    : "bg-amber-100 text-amber-700 border-amber-200"
                )}>
                  {payment.status === 'paid' ? 'LUNAS' : 'PROSES'}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2 text-slate-400">
                  <CreditCard size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-tight">Nominal</span>
                </div>
                <span className="font-bold text-blue-600">{formatCurrency(payment.amount)}</span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
