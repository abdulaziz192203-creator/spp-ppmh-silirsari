"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { 
  BarChart, 
  Users, 
  CreditCard, 
  CheckSquare, 
  Settings, 
  LogOut, 
  ChevronRight,
  Menu,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const pathname = usePathname()
  const router = useRouter()

  const menuItems = [
    { name: "Dashboard", icon: BarChart, path: "/admin" },
    { name: "Santri", icon: Users, path: "/admin/students" },
    { name: "Pembayaran", icon: CreditCard, path: "/admin/payments" },
    { name: "Tagihan", icon: CheckSquare, path: "/admin/bills" },
    { name: "Verifikasi", icon: CheckSquare, path: "/admin/verify" },
    { name: "Pengaturan", icon: Settings, path: "/admin/settings" },
  ]

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  useEffect(() => {
    const fetchPendingCount = async () => {
      const { count } = await supabase
        .from("payments")
        .select("*", { count: 'exact', head: true })
        .eq("status", "pending")
      
      setPendingCount(count || 0)
    }

    fetchPendingCount()
    
    // Refresh count on navigation or periodically
    const interval = setInterval(fetchPendingCount, 10000) // Poll every 10s
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 flex font-inter">
      {/* Sidebar - Desktop */}
      <aside 
        className={cn(
          "hidden md:flex flex-col bg-slate-900/50 border-r border-slate-800 transition-all duration-300",
          sidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-ppmh.png" alt="Logo PPMH" className={cn("h-8 w-8 object-contain", !sidebarOpen && "mx-auto")} />
            {sidebarOpen && <h1 className="text-xl font-bold font-outfit gradient-text">PPMH ADMIN</h1>}
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-500 hover:text-white transition-colors">
            <ChevronRight className={cn("transition-transform", sidebarOpen && "rotate-180")} size={16} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group",
                pathname === item.path 
                  ? "bg-blue-600/10 text-blue-400 border border-blue-600/20" 
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100"
              )}
            >
              <item.icon size={20} className={cn(pathname === item.path ? "text-blue-400" : "text-slate-500 group-hover:text-slate-100")} />
              {sidebarOpen && <span className="font-medium text-sm">{item.name}</span>}
              
              {item.name === "Verifikasi" && pendingCount > 0 && (
                <span className={cn(
                  "bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center min-w-[18px] h-[18px] px-1 shadow-lg shadow-red-900/40",
                  sidebarOpen ? "ml-auto" : "absolute top-2 right-2 border-2 border-slate-900"
                )}>
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 text-slate-400 hover:text-red-400 transition-all rounded-xl hover:bg-red-400/5"
          >
            <LogOut size={20} />
            {sidebarOpen && <span className="font-medium text-sm">Keluar</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Menu Toggle */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-100"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto min-w-0">
        <div className="p-4 md:p-8 max-w-7xl mx-auto pt-20 md:pt-8">
          {children}
        </div>
      </main>

      {/* Sidebar - Mobile Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.aside 
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="fixed top-0 left-0 bottom-0 w-64 bg-slate-900 z-50 md:hidden p-6"
            >
              <div className="flex items-center gap-3 mb-8">
                <img src="/logo-ppmh.png" alt="Logo PPMH" className="h-8 w-8 object-contain" />
                <h1 className="text-xl font-bold font-outfit gradient-text">PPMH ADMIN</h1>
              </div>
              <nav className="space-y-2">
                {menuItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => {
                      router.push(item.path)
                      setMobileMenuOpen(false)
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-4 rounded-xl transition-all",
                      pathname === item.path 
                        ? "bg-blue-600/10 text-blue-400 border border-blue-600/20" 
                        : "text-slate-400"
                    )}
                  >
                    <item.icon size={20} />
                    <span className="font-medium">{item.name}</span>
                    {item.name === "Verifikasi" && pendingCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs font-black rounded-full h-6 w-6 flex items-center justify-center shadow-lg shadow-red-900/40">
                        {pendingCount}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
              <div className="absolute bottom-6 left-6 right-6">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-4 text-slate-400 hover:text-red-400 transition-all"
                >
                  <LogOut size={20} />
                  <span className="font-medium">Keluar</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
