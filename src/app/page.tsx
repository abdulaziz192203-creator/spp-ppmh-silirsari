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
    <div className="flex min-h-screen items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="glass-card rounded-3xl p-8 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold font-outfit gradient-text mb-2">SPP PPMH</h1>
            <p className="text-slate-400 text-sm">Pondok Pesantren Miftahul Huda Silir Sari</p>
          </div>

          <div className="flex bg-slate-900/50 p-1 rounded-xl mb-8">
            <button
              onClick={() => setRole("parent")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all text-sm font-medium",
                role === "parent" ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"
              )}
            >
              <User size={16} /> Orang Tua
            </button>
            <button
              onClick={() => setRole("admin")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all text-sm font-medium",
                role === "admin" ? "bg-purple-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"
              )}
            >
              <ShieldCheck size={16} /> Admin
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">
                {role === "parent" ? "NISN Santri" : "Email Admin"}
              </label>
              <input
                type={role === "parent" ? "text" : "email"}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={role === "parent" ? "Masukkan NISN" : "admin@example.com"}
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">
                Kata Sandi
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                required
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full flex items-center justify-center gap-2 font-semibold py-4 rounded-xl transition-all duration-300 shadow-xl",
                role === "parent" 
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/20" 
                  : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-purple-500/20",
                loading && "opacity-70 cursor-not-allowed scale-[0.98]"
              )}
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <LogIn size={20} />
                  Masuk ke Sistem
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-500 text-xs uppercase tracking-widest font-medium">Santri Tidak Terlibat Pembayaran</p>
          </div>
        </div>

        <p className="mt-8 text-center text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} PPMH Silir Sari. Modern Payment System.
        </p>
      </motion.div>
    </div>
  )
}
