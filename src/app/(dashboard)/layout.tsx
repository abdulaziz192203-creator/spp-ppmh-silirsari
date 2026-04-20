"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { 
  BarChart, 
  CreditCard, 
  History, 
  User, 
  Loader2, 
  LogOut, 
  ChevronRight, 
  Menu as MenuIcon, 
  X,
  Bell,
  AlertTriangle,
  Newspaper,
  QrCode,
  CreditCard as MutasiIcon
} from "lucide-react"
import { cn, isPaymentOverdue, getMonthName } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import PushNotificationManager from "@/components/PushNotificationManager"

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [unpaidCount, setUnpaidCount] = useState(0)
  const [overdueCount, setOverdueCount] = useState(0)
  const [overdueList, setOverdueList] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/")
        return
      }

      // Verify role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, nisn")
        .eq("id", user.id)
        .single()

      if (profile?.role !== 'parent') {
        router.push(profile?.role === 'admin' ? '/admin' : '/')
        return
      }

      setAuthenticated(true)
      setLoading(false)
      
        const { data: payments } = await supabase
          .from("payments")
          .select("*")
          .eq("student_id", (
            await supabase.from("students").select("id").eq("nisn", profile.nisn).single()
          ).data?.id)
        
        if (payments) {
          const unpaid = payments.filter(p => p.status === 'unpaid' || p.status === 'rejected')
          setUnpaidCount(unpaid.length)
          
          // Fetch deadline
          const { data: settings } = await supabase.from("system_settings").select("value").eq("key", "payment_deadline_day").single()
          const deadline = settings ? parseInt(settings.value) : 10
          
          const overdue = unpaid.filter(p => isPaymentOverdue(p.month, p.year, deadline))
          setOverdueCount(overdue.length)
          setOverdueList(overdue)
        }
      }

      checkAuth()
    }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-50 font-inter">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    )
  }

  if (!authenticated) return null

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: BarChart },
    { name: "Tagihan", path: "/bills", icon: CreditCard },
    { name: "Riwayat", path: "/history", icon: History },
    { name: "Profil", path: "/profile", icon: User },
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-inter flex overflow-hidden">
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/10 via-slate-950 to-slate-950"></div>
      
      {/* Sidebar - Desktop */}
      <aside 
        className={cn(
          "hidden md:flex flex-col bg-slate-900/30 border-r border-slate-800/50 backdrop-blur-xl transition-all duration-300 z-50",
          sidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-ppmh.png" alt="Logo PPMH" className={cn("h-8 w-8 object-contain", !sidebarOpen && "mx-auto")} />
            {sidebarOpen && (
              <motion.h1 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xl font-bold font-outfit gradient-text"
              >
                SPP PPMH
              </motion.h1>
            )}
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-500 hover:text-white transition-colors">
            <ChevronRight className={cn("transition-transform", sidebarOpen && "rotate-180")} size={16} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all group relative",
                  isActive 
                    ? "bg-blue-600/10 text-blue-400 border border-blue-600/20" 
                    : "text-slate-500 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent"
                )}
              >
                <item.icon size={20} className={cn(isActive ? "text-blue-400" : "text-slate-500 group-hover:text-slate-200")} />
                {sidebarOpen && <span className="font-semibold text-sm">{item.name}</span>}
                
                {item.name === "Tagihan" && unpaidCount > 0 && (
                  <span className={cn(
                    "bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center min-w-[18px] h-[18px] px-1 shadow-lg shadow-red-900/40",
                    sidebarOpen ? "ml-auto" : "absolute top-2 right-2 border-2 border-slate-900"
                  )}>
                    {unpaidCount}
                  </span>
                )}

                {isActive && !sidebarOpen && (
                   <div className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-full" />
                )}
              </button>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-800/50">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 text-slate-500 hover:text-red-400 transition-all rounded-2xl hover:bg-red-400/5"
          >
            <LogOut size={20} />
            {sidebarOpen && <span className="font-semibold text-sm">Keluar</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Menu Toggle & Drawer Area */}
      <div className="md:hidden fixed top-6 left-6 z-[60]">
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-3 glass rounded-2xl text-slate-100 shadow-xl border border-slate-700/50"
        >
          {mobileMenuOpen ? <X size={20} /> : <MenuIcon size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.aside 
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-slate-950 border-r border-slate-800/50 z-[70] md:hidden p-8 flex flex-col"
            >
              <div className="flex items-center gap-4 mb-12">
                <img src="/logo-ppmh.png" alt="Logo PPMH" className="h-10 w-10 object-contain" />
                <h1 className="text-2xl font-bold font-outfit gradient-text">PPMH PAYMENT</h1>
              </div>
              <nav className="flex-1 space-y-4">
                {navItems.map((item) => {
                  const isActive = pathname === item.path
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        router.push(item.path)
                        setMobileMenuOpen(false)
                      }}
                      className={cn(
                        "w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all",
                        isActive 
                          ? "bg-blue-600/10 text-blue-400 border border-blue-600/20 shadow-lg shadow-blue-900/10" 
                          : "text-slate-400"
                      )}
                    >
                      <item.icon size={24} />
                      <span className="font-bold text-lg">{item.name}</span>
                      {item.name === "Tagihan" && unpaidCount > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-xs font-black rounded-full h-6 w-6 flex items-center justify-center shadow-lg shadow-red-900/40">
                          {unpaidCount}
                        </span>
                      )}
                    </button>
                  )
                })}
              </nav>
              <button 
                onClick={handleLogout}
                className="mt-auto flex items-center gap-4 px-4 py-4 text-red-400 font-bold"
              >
                <LogOut size={24} />
                <span>Keluar</span>
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto min-w-0 pb-20 md:pb-0">
        <div className="p-6 md:p-12 max-w-5xl mx-auto min-h-screen relative">
          <div className="pt-24 md:pt-0">
            {/* Top Navigation / Header for Desktop */}
            <header className="hidden md:flex items-center justify-end mb-8 gap-4">
               <div className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="h-12 w-12 bg-slate-900/50 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white transition-all relative"
                  >
                    <Bell size={20} />
                    {overdueCount > 0 && (
                      <span className="absolute top-2.5 right-2.5 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-slate-950 animate-pulse" />
                    )}
                  </button>

                  <AnimatePresence>
                    {showNotifications && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute right-0 mt-3 w-80 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl z-50 overflow-hidden"
                        >
                          <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                            <h3 className="font-bold font-outfit">Notifikasi</h3>
                            {overdueCount > 0 && (
                              <span className="bg-red-500/10 text-red-400 text-[10px] font-black px-2 py-1 rounded-full border border-red-500/20 uppercase tracking-wider">
                                {overdueCount} Terlambat
                              </span>
                            )}
                          </div>
                          <div className="max-h-[300px] overflow-y-auto">
                            {overdueList.length === 0 ? (
                              <div className="p-10 text-center text-slate-500">
                                <Bell className="mx-auto mb-3 opacity-20" size={32} />
                                <p className="text-xs">Tidak ada notifikasi baru</p>
                              </div>
                            ) : (
                              <div className="divide-y divide-slate-800/50">
                                {overdueList.map((p, i) => (
                                  <div key={i} className="p-4 hover:bg-slate-800/30 transition-colors flex gap-3">
                                    <div className="h-10 w-10 bg-red-500/10 text-red-400 rounded-xl flex items-center justify-center shrink-0">
                                      <AlertTriangle size={18} />
                                    </div>
                                    <div>
                                      <p className="text-xs font-bold text-slate-200">SPP {getMonthName(p.month)} {p.year} Terlambat</p>
                                      <p className="text-[10px] text-slate-500 mt-1">Batas pembayaran telah terlewati. Segera lakukan pelunasan.</p>
                                      <button 
                                        onClick={() => {
                                          router.push('/bills')
                                          setShowNotifications(false)
                                        }}
                                        className="text-[10px] text-blue-400 font-bold mt-2 hover:underline"
                                      >
                                        Bayar Sekarang →
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="p-3 bg-slate-950/50 border-t border-slate-800 text-center">
                            <button 
                              onClick={() => {
                                router.push('/bills')
                                setShowNotifications(false)
                              }}
                              className="text-xs text-slate-400 hover:text-white transition-colors"
                            >
                              Lihat Semua Tagihan
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
               </div>
            </header>
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-[100] px-4 py-2 flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
         <button 
           onClick={() => router.push('/dashboard')}
           className={cn("flex flex-col items-center gap-1 min-w-[64px]", pathname === '/dashboard' ? "text-blue-600" : "text-slate-400")}
         >
            <BarChart size={20} />
            <span className="text-[10px] font-bold">Beranda</span>
         </button>
         
         <button 
           onClick={() => router.push('/bills')}
           className={cn("flex flex-col items-center gap-1 min-w-[64px] relative", pathname === '/bills' ? "text-blue-600" : "text-slate-400")}
         >
            <CreditCard size={20} />
            <span className="text-[10px] font-bold">Tagihan</span>
            {unpaidCount > 0 && (
              <span className="absolute -top-1 right-2 bg-red-500 text-white text-[8px] font-black rounded-full h-4 w-4 flex items-center justify-center shadow-lg shadow-red-900/40">
                {unpaidCount}
              </span>
            )}
         </button>

         <button 
           onClick={() => router.push('/history')}
           className={cn("flex flex-col items-center gap-1 min-w-[64px]", pathname === '/history' ? "text-blue-600" : "text-slate-400")}
         >
            <MutasiIcon size={20} />
            <span className="text-[10px] font-bold">Mutasi</span>
         </button>

         <button 
           onClick={() => router.push('/profile')}
           className={cn("flex flex-col items-center gap-1 min-w-[64px]", pathname === '/profile' ? "text-blue-600" : "text-slate-400")}
         >
            <User size={20} />
            <span className="text-[10px] font-bold">Profil</span>
         </button>
      </nav>
      <PushNotificationManager />
    </div>
  )
}
