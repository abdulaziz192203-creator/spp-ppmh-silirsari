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
  X 
} from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [unpaidCount, setUnpaidCount] = useState(0)
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
      
      // Fetch unpaid count
      if (profile?.role === 'parent' && profile?.nisn) {
        const { count } = await supabase
          .from("payments")
          .select("*", { count: 'exact', head: true })
          .eq("nisn", profile.nisn)
          .eq("status", "unpaid")
        
        setUnpaidCount(count || 0)
      }
    }

    checkAuth()
  }, [router, pathname])

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
      <main className="flex-1 overflow-y-auto min-w-0">
        <div className="p-6 md:p-12 max-w-5xl mx-auto min-h-screen">
          <div className="pt-24 md:pt-0">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
