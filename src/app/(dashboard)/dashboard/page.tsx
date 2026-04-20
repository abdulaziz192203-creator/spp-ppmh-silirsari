"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { formatDate, isPaymentOverdue, getMonthName } from "@/lib/utils"
import { User, CheckCircle, Clock, AlertCircle, Copy, Check, BarChart3, Wallet, AlertTriangle, ArrowRight, Store, Heart, PhoneCall, ClipboardList, History, Megaphone } from "lucide-react"
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
  const [overduePayments, setOverduePayments] = useState<any[]>([])
  const [deadlineDay, setDeadlineDay] = useState(10)
  const [emergencyWA, setEmergencyWA] = useState("")
  const [loading, setLoading] = useState(true)
  const [announcements, setAnnouncements] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
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
      
      // Fetch Deadline Day
      const { data: settings } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "payment_deadline_day")
        .single()
      
      const deadline = settings ? parseInt(settings.value) : 10
      setDeadlineDay(deadline)

      // Fetch Emergency WA
      const { data: waSetting } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "emergency_whatsapp")
        .single()
      
      setEmergencyWA(waSetting?.value || "")

      // Fetch Announcements
      const { data: announcementData } = await supabase
        .from("announcements")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(3)
      setAnnouncements(announcementData || [])

      if (studentData) {
        const { data: payments } = await supabase
          .from("payments")
          .select("*")
          .eq("student_id", studentData.id)

        const unpaid = payments?.filter(p => p.status === 'unpaid' || p.status === 'rejected').length || 0
        const pending = payments?.filter(p => p.status === 'pending').length || 0
        
        // Calculate overdue payments
        const overdue = payments?.filter(p => 
          (p.status === 'unpaid' || p.status === 'rejected') && isPaymentOverdue(p.month, p.year, deadline)
        ) || []
        
        setOverduePayments(overdue)
        
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
    <div className="min-h-screen bg-slate-50 -mt-24 -mx-6 md:-mx-12 pb-24 md:pb-12">
      {/* Header Container with relative for pill placement */}
      <div className="relative">
        {/* Blue Header Section with Background Image */}
        <div className="bg-blue-600 bg-gradient-to-b from-blue-700 to-blue-600 rounded-b-[60px] pt-12 pb-24 px-6 shadow-2xl relative overflow-hidden">
          {/* Building Background Image */}
          <div className="absolute inset-0 opacity-40 pointer-events-none">
             <img 
               src="/building.jpg" 
               alt="Building" 
               className="w-full h-full object-cover mix-blend-overlay"
               onError={(e) => (e.currentTarget.style.display = 'none')} 
             />
             <div className="absolute inset-0 bg-gradient-to-b from-blue-900/60 via-blue-700/40 to-blue-600/80"></div>
          </div>

          {/* Abstract Background Patterns */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
             <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -mr-20 -mt-20 blur-3xl"></div>
             <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-900 rounded-full -ml-20 -mb-20 blur-3xl"></div>
          </div>

          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-full flex justify-between items-center mb-6">
               <div className="flex items-center gap-4">
                  <div className="h-16 w-16 bg-white/20 backdrop-blur-md rounded-[24px] flex items-center justify-center p-2.5 border border-white/30 shadow-xl">
                     <img src="/logo-ppmh.png" alt="Logo" className="h-full w-full object-contain" />
                  </div>
                  <div className="text-left">
                     <p className="text-white/60 text-[9px] font-black uppercase tracking-[0.2em] leading-none mb-1.5">PPMH System</p>
                     <span className="text-white font-black text-xl tracking-tight leading-none">SPP PPMH</span>
                  </div>
               </div>
               <button onClick={() => router.push('/bills')} className="relative p-2 bg-white/10 rounded-full text-white">
                  <AlertCircle size={24} />
                  {overduePayments.length > 0 && (
                    <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full border-2 border-blue-600 text-[8px] flex items-center justify-center font-bold">
                      {overduePayments.length}
                    </span>
                  )}
               </button>
            </div>

            <div className="mb-4">
               <p className="text-white/80 text-lg font-arabic mb-1">السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللهِ وَبَرَكَاتُهُ</p>
               <h2 className="text-2xl md:text-3xl font-bold text-white font-outfit uppercase tracking-wide">
                 {student?.name || "Nama Santri"}
               </h2>
            </div>
          </div>
        </div>

        {/* Saldo / Tagihan Pill Card - Moved outside overflow-hidden */}
        <div className="absolute -bottom-7 left-6 right-6 flex justify-center z-20">
           <div className="w-full max-w-md bg-white rounded-full p-1.5 flex items-center justify-between shadow-[0_10px_30px_rgba(0,0,0,0.1)] border border-slate-100">
              <div className="px-6 py-2">
                 <p className="text-slate-400 text-[9px] uppercase font-black tracking-widest">Tagihan Belum Lunas</p>
                 <p className="text-blue-600 font-black text-lg">
                   {stats.unpaidCount} Bulan
                   <span className="text-[10px] text-slate-300 font-normal ml-2 tracking-normal italic">(Batas Tgl {deadlineDay})</span>
                 </p>
              </div>
              <button 
                onClick={() => router.push('/bills')}
                className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold text-sm shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
              >
                Bayar Sekarang
              </button>
           </div>
        </div>
      </div>

      <div className="px-6 pt-16 space-y-8 max-w-4xl mx-auto">
        {/* Announcements Section */}
        {announcements.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-lg font-bold text-slate-800 font-outfit flex items-center gap-2">
                <Megaphone className="text-blue-600" size={20} /> Pengumuman
              </h3>
            </div>
            <div className="flex flex-col gap-3">
              {announcements.map((item, i) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    "p-4 rounded-3xl border-l-4 shadow-sm bg-white border border-slate-100",
                    item.type === 'important' ? "border-l-red-500" :
                    item.type === 'warning' ? "border-l-amber-500" : "border-l-blue-500"
                  )}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-slate-800 text-sm">{item.title}</h4>
                    <span className="text-[9px] text-slate-400 font-bold uppercase">{formatDate(item.created_at)}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 whitespace-pre-wrap">{item.content}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Overdue Alert Banner if exists */}
        {overduePayments.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 border border-red-100 rounded-3xl p-4 flex items-center gap-4 text-red-700 shadow-sm"
          >
            <div className="h-10 w-10 bg-red-500 text-white rounded-2xl flex items-center justify-center shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold">Peringatan Keterlambatan!</p>
              <p className="text-[10px] opacity-80">Segera lunasi tagihan bulan {getMonthName(overduePayments[0].month)}</p>
            </div>
            <ArrowRight size={20} />
          </motion.div>
        )}

        {/* Icon Grid Menu */}
        <div className="grid grid-cols-2 gap-y-10 gap-x-6 py-4">
          {[
            { name: "Tagihan Santri", icon: Wallet, color: "blue", path: "/bills" },
            { name: "Donasi / Jariyah", icon: Heart, color: "orange", path: "/donation" },
            { name: "Riwayat Bayar", icon: History, color: "purple", path: "/history" },
            { name: "Layanan Darurat", icon: PhoneCall, color: "red", path: "/emergency" },
          ].map((item, i) => (
            <button 
              key={i} 
              onClick={() => router.push(item.path)}
              className="flex flex-col items-center group"
            >
              <div className={cn(
                "h-16 w-16 md:h-20 md:w-20 rounded-3xl flex items-center justify-center shadow-lg transition-all group-active:scale-90 group-hover:shadow-blue-200",
                "bg-white border border-slate-100 text-blue-600"
              )}>
                <item.icon size={28} className="md:size-32" />
              </div>
              <span className="text-[11px] md:text-sm font-bold text-slate-700 mt-3 text-center leading-tight">
                {item.name}
              </span>
            </button>
          ))}
        </div>
        
        {/* Info & Banner Area */}
        <div className="space-y-4">
          <div 
             onClick={() => router.push('/profile')}
             className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-all active:scale-[0.98]"
          >
             <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                   <User size={24} />
                </div>
                <div>
                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Data Santri</p>
                   <p className="text-sm font-bold text-slate-800">Biodata & Kehadiran</p>
                </div>
             </div>
             <ArrowRight size={20} className="text-slate-200" />
          </div>
        </div>
      </div>
    </div>
  )
}
