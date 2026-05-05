"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { BarChart3, Users, Wallet, LogOut, ChevronRight, Menu, X, Crown, Loader2, Newspaper } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

export default function PimpinanLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userName, setUserName] = useState("")
  const pathname = usePathname()
  const router = useRouter()

  const menuItems = [
    { name: "Dashboard", icon: BarChart3, path: "/pimpinan" },
    { name: "Keuangan", icon: Wallet, path: "/pimpinan/keuangan" },
    { name: "Data Santri", icon: Users, path: "/pimpinan/santri" },
    { name: "Pengumuman", icon: Newspaper, path: "/pimpinan/pengumuman" },
  ]

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/"); return }
      const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single()
      if (profile?.role !== 'pimpinan') {
        router.push(profile?.role === 'admin' ? '/admin' : profile?.role === 'parent' ? '/dashboard' : '/')
        return
      }
      setUserName(profile.full_name || "Pemimpin")
      setAuthenticated(true)
      setLoading(false)
    }
    checkAuth()
  }, [router])

  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/") }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 font-inter">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl flex items-center justify-center shadow-xl shadow-amber-500/20">
            <Crown className="text-white" size={32} />
          </div>
          <Loader2 className="animate-spin text-amber-400" size={28} />
        </div>
      </div>
    )
  }
  if (!authenticated) return null

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex font-inter">
      <div className="fixed inset-0 pointer-events-none -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-900/8 via-slate-950 to-slate-950" />

      {/* Sidebar Desktop */}
      <aside className={cn("hidden md:flex flex-col bg-slate-900/50 border-r border-slate-800 transition-all duration-300", sidebarOpen ? "w-64" : "w-20")}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("h-10 w-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0", !sidebarOpen && "mx-auto")}>
              <Crown className="text-white" size={20} />
            </div>
            {sidebarOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h1 className="text-lg font-bold font-outfit bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-orange-400 to-amber-500">PIMPINAN</h1>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest -mt-0.5">PPMH Silir Sari</p>
              </motion.div>
            )}
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-500 hover:text-white transition-colors">
            <ChevronRight className={cn("transition-transform", sidebarOpen && "rotate-180")} size={16} />
          </button>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.path
            return (
              <button key={item.path} onClick={() => router.push(item.path)}
                className={cn("w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group relative",
                  isActive ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100 border border-transparent"
                )}>
                <item.icon size={20} className={cn(isActive ? "text-amber-400" : "text-slate-500 group-hover:text-slate-100")} />
                {sidebarOpen && <span className="font-medium text-sm">{item.name}</span>}
                {isActive && !sidebarOpen && <div className="absolute left-0 w-1 h-6 bg-amber-500 rounded-r-full" />}
              </button>
            )
          })}
        </nav>
        <div className="p-4 border-t border-slate-800">
          {sidebarOpen && (
            <div className="px-3 py-3 mb-2">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Masuk sebagai</p>
              <p className="text-sm font-bold text-slate-200 truncate">{userName}</p>
            </div>
          )}
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-3 text-slate-400 hover:text-red-400 transition-all rounded-xl hover:bg-red-400/5">
            <LogOut size={20} />
            {sidebarOpen && <span className="font-medium text-sm">Keluar</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 z-[60] px-6 flex items-center">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Crown className="text-white" size={18} />
          </div>
          <h1 className="text-lg font-bold font-outfit bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-orange-400">PIMPINAN</h1>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto min-w-0 pb-24 md:pb-0 pt-16 md:pt-0">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">{children}</div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-slate-900 border-t border-slate-800 z-[100] px-2 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.4)]">
        {menuItems.map((item) => (
          <button key={item.path} onClick={() => router.push(item.path)}
            className={cn("flex flex-col items-center gap-1.5 min-w-[64px]", pathname === item.path ? "text-amber-400" : "text-slate-500")}>
            <item.icon size={20} />
            <span className="text-[10px] font-bold">{item.name}</span>
          </button>
        ))}
        <button onClick={() => setMobileMenuOpen(true)} className="flex flex-col items-center gap-1.5 min-w-[64px] text-slate-500">
          <Menu size={20} /><span className="text-[10px] font-bold">Menu</span>
        </button>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" onClick={() => setMobileMenuOpen(false)} />
            <motion.aside initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} className="fixed top-0 left-0 bottom-0 w-72 bg-slate-900 z-50 md:hidden p-6 flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center"><Crown className="text-white" size={20} /></div>
                  <h1 className="text-lg font-bold font-outfit bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-orange-400">PIMPINAN</h1>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="text-slate-500"><X size={20} /></button>
              </div>
              <div className="px-3 py-4 mb-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                <p className="text-[10px] text-amber-500/60 uppercase tracking-widest font-bold">Masuk sebagai</p>
                <p className="text-sm font-bold text-slate-200">{userName}</p>
              </div>
              <nav className="space-y-2 flex-1 overflow-y-auto mb-20">
                {menuItems.map((item) => (
                  <button key={item.path} onClick={() => { router.push(item.path); setMobileMenuOpen(false) }}
                    className={cn("w-full flex items-center gap-3 px-3 py-4 rounded-xl transition-all",
                      pathname === item.path ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "text-slate-400"
                    )}>
                    <item.icon size={20} /><span className="font-medium">{item.name}</span>
                  </button>
                ))}
              </nav>
              <div className="absolute bottom-6 left-6 right-6">
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-4 text-slate-400 hover:text-red-400 transition-all">
                  <LogOut size={20} /><span className="font-medium">Keluar</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
