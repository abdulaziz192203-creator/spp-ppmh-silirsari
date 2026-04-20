"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { 
  Settings as SettingsIcon, 
  School, 
  CreditCard, 
  Calendar, 
  User, 
  Save, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  QrCode,
  ChevronRight
} from "lucide-react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const router = useRouter()
  
  const [settings, setSettings] = useState({
    school_name: "",
    school_address: "",
    academic_year: "",
    emergency_whatsapp: ""
  })

  const [adminProfile, setAdminProfile] = useState({
    full_name: "",
    nisn: ""
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // 1. Fetch System Settings
      const { data: settingsData, error: settingsError } = await supabase
        .from("system_settings")
        .select("*")
      
      if (settingsError) throw settingsError
      
      const settingsObj = settingsData.reduce((acc: any, curr) => {
        acc[curr.key] = curr.value
        return acc
      }, {})

      setSettings({
        school_name: settingsObj.school_name || "Pondok Pesantren Miftahul Huda",
        school_address: settingsObj.school_address || "",
        academic_year: settingsObj.academic_year || "2025/2026",
        emergency_whatsapp: settingsObj.emergency_whatsapp || ""
      })

      // 2. Fetch Admin Profile
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()
        
        if (profileError) throw profileError
        setAdminProfile({
          full_name: profile.full_name || "",
          nisn: profile.nisn || ""
        })
      }
    } catch (error: any) {
      console.error("Error fetching data:", error.message)
      setMessage({ type: 'error', text: "Gagal mengambil data pengaturan." })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    
    try {
      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
        updated_at: new Date().toISOString()
      }))

      const { error } = await supabase
        .from("system_settings")
        .upsert(updates, { onConflict: 'key' })
      
      if (error) throw error

      // Also update admin profile
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ full_name: adminProfile.full_name })
          .eq("id", user.id)
        
        if (profileError) throw profileError
      }

      setMessage({ type: 'success', text: "Pengaturan berhasil disimpan!" })
    } catch (error: any) {
      console.error("Error saving settings details:", error)
      setMessage({ type: 'error', text: "Gagal menyimpan pengaturan: " + (error.message || "Terjadi kesalahan tidak dikenal") })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 bg-blue-600/10 text-blue-400 rounded-xl flex items-center justify-center">
            <SettingsIcon size={24} />
          </div>
          <h1 className="text-3xl font-bold font-outfit">Pengaturan Sistem</h1>
        </div>
        <p className="text-slate-400">Kelola identitas instansi, periode akademik, dan parameter pembayaran.</p>
      </div>

      <form id="settings-form" onSubmit={handleSaveSettings} className="space-y-6">
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "p-4 rounded-2xl flex items-center gap-3",
              message.type === 'success' ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
            )}
          >
            {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span className="text-sm font-medium">{message.text}</span>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Section: Identitas Instansi */}
          <div className="glass-card rounded-3xl p-6 border border-slate-800/50 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <School className="text-blue-400" size={20} />
              <h3 className="font-bold text-lg">Identitas Instansi</h3>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Nama Sekolah / Pesantren</label>
                <input 
                  type="text"
                  value={settings.school_name}
                  onChange={(e) => setSettings({...settings, school_name: e.target.value})}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-all"
                  placeholder="Masukkan nama instansi"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Alamat Lengkap</label>
                <textarea 
                  rows={3}
                  value={settings.school_address}
                  onChange={(e) => setSettings({...settings, school_address: e.target.value})}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-all resize-none"
                  placeholder="Alamat lengkap instansi"
                />
              </div>
            </div>
          </div>

          {/* Section: Akademik & Deadline */}
          <div className="glass-card rounded-3xl p-6 border border-slate-800/50 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <Calendar className="text-amber-400" size={20} />
              <h3 className="font-bold text-lg">Akademik & Periode</h3>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Tahun Ajaran Aktif</label>
                <input 
                  type="text"
                  value={settings.academic_year}
                  onChange={(e) => setSettings({...settings, academic_year: e.target.value})}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-all"
                  placeholder="Contoh: 2023/2024"
                />
              </div>
            </div>
          </div>

          {/* Section: Kontak Darurat */}
          <div className="glass-card rounded-3xl p-6 border border-slate-800/50 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <AlertCircle className="text-red-400" size={20} />
              <h3 className="font-bold text-lg">Layanan Darurat</h3>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Nomor WhatsApp Darurat</label>
                <input 
                  type="text"
                  value={settings.emergency_whatsapp}
                  onChange={(e) => setSettings({...settings, emergency_whatsapp: e.target.value})}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-all"
                  placeholder="Contoh: 628123456789"
                />
                <p className="text-[10px] text-slate-500 italic">Gunakan format internasional tanpa tanda + (contoh: 628...)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button at Bottom */}
        <div className="flex justify-end pt-6">
          <button 
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-xl shadow-blue-900/20 disabled:opacity-50 active:scale-95"
          >
            {saving ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
            Simpan Semua Perubahan
          </button>
        </div>
      </form>

      {/* Section: Kelola Metode Pembayaran (Full Width Card) - Moved outside form */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => router.push('/admin/settings/payment-methods')}
        className="glass-card rounded-3xl p-8 border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all cursor-pointer group relative overflow-hidden"
      >
        <div className="absolute right-0 top-0 h-full w-32 bg-emerald-500/10 skew-x-[-20deg] translate-x-16 group-hover:translate-x-12 transition-transform" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="h-16 w-16 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <QrCode size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-1">Metode Pembayaran Wali Santri</h3>
              <p className="text-slate-400 text-sm">Aktifkan QRIS, GoPay, DANA, atau Transfer Bank secara dinamis.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-emerald-500 text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-emerald-900/40 group-hover:translate-x-2 transition-all">
            Kelola Sekarang
            <ChevronRight size={20} />
          </div>
        </div>
      </motion.div>
    </div>
  )
}
