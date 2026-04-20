"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { LogIn, User, ShieldCheck, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

export default function LoginPage() {
  const [role, setRole] = useState<"parent" | "admin">("parent")
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const email = role === "parent" ? `${identifier}@spp-ppmh.id` : identifier
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) throw authError

      // Check role in profiles table
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user?.id)
        .single()

      if (profileError) throw profileError

      if (profile.role !== role) {
        await supabase.auth.signOut()
        throw new Error(`Anda bukan ${role === "admin" ? "Admin" : "Orang Tua"}`)
      }

      router.push(role === "admin" ? "/admin" : "/dashboard")
    } catch (err: any) {
      setError(err.message || "Gagal login. Periksa kembali kredensial Anda.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
      {/* Background Decorative Blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full -mr-32 -mt-32 blur-3xl opacity-50"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-100 rounded-full -ml-32 -mb-32 blur-3xl opacity-50"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white rounded-[40px] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
          
          <div className="text-center mb-10">
            <div className="h-16 w-16 bg-blue-600 rounded-3xl mx-auto mb-4 flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
               <LogIn size={32} />
            </div>
            <h1 className="text-3xl font-bold font-outfit text-slate-800 tracking-tight">SPP PPMH</h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Miftahul Huda Silir Sari</p>
          </div>

          <div className="flex bg-slate-50 p-1.5 rounded-[20px] mb-8 border border-slate-100">
            <button
              onClick={() => setRole("parent")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-[15px] transition-all text-xs font-black uppercase tracking-wider",
                role === "parent" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <User size={16} /> Wali Santri
            </button>
            <button
              onClick={() => setRole("admin")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-[15px] transition-all text-xs font-black uppercase tracking-wider",
                role === "admin" ? "bg-slate-800 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <ShieldCheck size={16} /> Admin
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                {role === "parent" ? "NISN Santri" : "Email Admin"}
              </label>
              <input
                type={role === "parent" ? "text" : "email"}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={role === "parent" ? "Masukkan NISN" : "admin@example.com"}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-bold text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                Kata Sandi
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-bold text-sm"
                required
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-50 border border-red-100 text-red-600 text-[10px] font-bold p-4 rounded-2xl uppercase tracking-tight text-center"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full flex items-center justify-center gap-3 font-black uppercase tracking-widest text-xs py-5 rounded-[24px] transition-all duration-300 shadow-xl active:scale-[0.98]",
                role === "parent" 
                  ? "bg-blue-600 text-white shadow-blue-500/30 hover:bg-blue-700" 
                  : "bg-slate-800 text-white shadow-slate-500/30 hover:bg-slate-900",
                loading && "opacity-70 cursor-not-allowed grayscale"
              )}
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <LogIn size={20} />
                  Masuk Ke Sistem
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-6 border-t border-slate-50 text-center">
            <p className="text-slate-300 text-[9px] uppercase font-black tracking-widest leading-relaxed">
               PPMH Silir Sari © {new Date().getFullYear()}<br/>
               V2.0 Premium Payment System
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
