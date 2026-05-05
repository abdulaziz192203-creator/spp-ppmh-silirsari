"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { LogIn, User, ShieldCheck, Loader2, Crown } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

export default function LoginPage() {
  const [role, setRole] = useState<"parent" | "admin" | "pimpinan">("parent")
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
        const roleLabels: Record<string, string> = {
          admin: "Admin",
          parent: "Wali Santri",
          pimpinan: "Pemimpin"
        }
        throw new Error(`Anda bukan ${roleLabels[role] || role}`)
      }

      const redirectMap: Record<string, string> = {
        admin: "/admin",
        parent: "/dashboard",
        pimpinan: "/pimpinan"
      }
      router.push(redirectMap[role] || "/")
    } catch (err: any) {
      setError(err.message || "Gagal login. Periksa kembali kredensial Anda.")
    } finally {
      setLoading(false)
    }
  }

  const roleConfig = {
    parent: {
      buttonColor: "bg-blue-600 text-white shadow-lg shadow-blue-500/20",
      submitColor: "bg-blue-600 text-white shadow-blue-500/30 hover:bg-blue-700",
      label: "NISN Santri",
      placeholder: "Masukkan NISN",
      inputType: "text" as const,
    },
    admin: {
      buttonColor: "bg-slate-800 text-white shadow-lg",
      submitColor: "bg-slate-800 text-white shadow-slate-500/30 hover:bg-slate-900",
      label: "Email Admin",
      placeholder: "admin@example.com",
      inputType: "email" as const,
    },
    pimpinan: {
      buttonColor: "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20",
      submitColor: "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-amber-500/30 hover:from-amber-400 hover:to-orange-500",
      label: "Email Pemimpin",
      placeholder: "pimpinan@example.com",
      inputType: "email" as const,
    }
  }

  const currentConfig = roleConfig[role]

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
      {/* Background Decorative Blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full -mr-32 -mt-32 blur-3xl opacity-50"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-100 rounded-full -ml-32 -mb-32 blur-3xl opacity-50"></div>
      {role === "pimpinan" && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-100 rounded-full blur-3xl opacity-30 transition-opacity duration-700"></div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white rounded-[40px] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 relative overflow-hidden">
          <div className={cn(
            "absolute top-0 left-0 w-full h-2 transition-all duration-500",
            role === "parent" ? "bg-gradient-to-r from-blue-600 to-indigo-600" :
            role === "admin" ? "bg-gradient-to-r from-slate-700 to-slate-900" :
            "bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600"
          )}></div>
          
          <div className="text-center mb-10">
            <div className={cn(
              "h-16 w-16 rounded-3xl mx-auto mb-4 flex items-center justify-center text-white shadow-xl transition-all duration-500",
              role === "parent" ? "bg-blue-600 shadow-blue-500/20" :
              role === "admin" ? "bg-slate-800 shadow-slate-500/20" :
              "bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-500/20"
            )}>
               {role === "pimpinan" ? <Crown size={32} /> : <LogIn size={32} />}
            </div>
            <h1 className="text-3xl font-bold font-outfit text-slate-800 tracking-tight">SPP PPMH</h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Miftahul Huda Silir Sari</p>
          </div>

          {/* Role Switcher - 3 tabs */}
          <div className="flex bg-slate-50 p-1.5 rounded-[20px] mb-8 border border-slate-100">
            <button
              onClick={() => setRole("parent")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-3 rounded-[15px] transition-all text-[10px] font-black uppercase tracking-wider",
                role === "parent" ? roleConfig.parent.buttonColor : "text-slate-400 hover:text-slate-600"
              )}
            >
              <User size={14} /> Wali
            </button>
            <button
              onClick={() => setRole("pimpinan")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-3 rounded-[15px] transition-all text-[10px] font-black uppercase tracking-wider",
                role === "pimpinan" ? roleConfig.pimpinan.buttonColor : "text-slate-400 hover:text-slate-600"
              )}
            >
              <Crown size={14} /> Pimpinan
            </button>
            <button
              onClick={() => setRole("admin")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-3 rounded-[15px] transition-all text-[10px] font-black uppercase tracking-wider",
                role === "admin" ? roleConfig.admin.buttonColor : "text-slate-400 hover:text-slate-600"
              )}
            >
              <ShieldCheck size={14} /> Admin
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                {currentConfig.label}
              </label>
              <input
                type={currentConfig.inputType}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={currentConfig.placeholder}
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
                currentConfig.submitColor,
                loading && "opacity-70 cursor-not-allowed grayscale"
              )}
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  {role === "pimpinan" ? <Crown size={20} /> : <LogIn size={20} />}
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
