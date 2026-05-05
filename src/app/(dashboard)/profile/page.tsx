"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { User, School, LogOut, Loader2, ShieldCheck, KeyRound, Save, CheckCircle2, XCircle, Eye, EyeOff } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Edit name
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState("")
  const [savingName, setSavingName] = useState(false)
  const [nameMsg, setNameMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Change password
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)

  useEffect(() => { fetchProfileData() }, [])

  const fetchProfileData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) return

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()
      
      setProfile({ ...profileData, email: user.email })
      setNewName(profileData?.full_name || "")

      if (profileData?.nisn) {
        const { data: studentData } = await supabase
          .from("students")
          .select("*")
          .eq("nisn", profileData.nisn)
          .single()
        setStudent(studentData)
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveName = async () => {
    if (!newName.trim()) return
    setSavingName(true)
    setNameMsg(null)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: newName.trim() })
        .eq("id", profile.id)
      if (error) throw error
      setProfile({ ...profile, full_name: newName.trim() })
      setEditingName(false)
      setNameMsg({ type: 'success', text: 'Nama berhasil diperbarui!' })
      setTimeout(() => setNameMsg(null), 3000)
    } catch (err: any) {
      setNameMsg({ type: 'error', text: err.message || 'Gagal memperbarui nama' })
    } finally {
      setSavingName(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password minimal 6 karakter' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Konfirmasi password tidak cocok' })
      return
    }
    setSavingPassword(true)
    setPasswordMsg(null)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setPasswordMsg({ type: 'success', text: 'Password berhasil diubah!' })
      setNewPassword("")
      setConfirmPassword("")
      setShowPasswordForm(false)
      setTimeout(() => setPasswordMsg(null), 3000)
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Gagal mengubah password' })
    } finally {
      setSavingPassword(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="animate-spin text-blue-500" size={32} />
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 -mt-24 -mx-6 md:-mx-12 pb-24 md:pb-12">
      {/* Blue Header */}
      <div className="bg-blue-600 bg-gradient-to-b from-blue-700 to-blue-600 rounded-b-[40px] pt-24 pb-12 px-6 shadow-2xl relative overflow-hidden text-center flex flex-col items-center">
         <div className="absolute inset-0 opacity-30 pointer-events-none">
            <img src="/building.jpg" alt="Building" className="w-full h-full object-cover mix-blend-overlay" onError={(e) => (e.currentTarget.style.display = 'none')} />
         </div>
         <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -ml-20 -mt-20 blur-3xl"></div>
         </div>
         <h1 className="text-3xl font-bold font-outfit text-white relative z-10 uppercase tracking-wide">Profil Wali</h1>
         <p className="text-white/70 relative z-10 max-w-md text-sm mt-2 font-medium">Kelola informasi akun dan pantau data santri yang terdaftar dalam sistem.</p>
      </div>

      <div className="px-6 pt-10 space-y-6 max-w-4xl mx-auto">
        {/* User Card */}
        <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-xl text-center relative overflow-hidden">
          <div className="mx-auto h-24 w-24 rounded-[32px] bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white shadow-xl mb-4 relative z-10">
            <User size={48} />
          </div>

          {/* Editable Name */}
          {editingName ? (
            <div className="flex items-center justify-center gap-2 mb-1">
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
                className="text-xl font-bold text-slate-800 text-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-64"
                autoFocus />
              <button onClick={handleSaveName} disabled={savingName}
                className="h-10 w-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition-all active:scale-95">
                {savingName ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              </button>
              <button onClick={() => { setEditingName(false); setNewName(profile?.full_name || "") }}
                className="h-10 w-10 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-all">
                <XCircle size={16} />
              </button>
            </div>
          ) : (
            <button onClick={() => setEditingName(true)} className="group">
              <h2 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{profile?.full_name || 'Orang Tua Santri'}</h2>
              <p className="text-[10px] text-blue-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Klik untuk mengubah nama</p>
            </button>
          )}

          <p className="text-xs text-slate-400 font-medium mt-1">{profile?.email}</p>
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest mt-4 border border-blue-100">
            <ShieldCheck size={12} /> WALI SANTRI TERVERIFIKASI
          </div>
        </div>

        {/* Status Messages */}
        <AnimatePresence>
          {(nameMsg || passwordMsg) && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className={cn("rounded-2xl px-5 py-4 text-sm font-bold flex items-center gap-3 border",
                (nameMsg || passwordMsg)?.type === 'success'
                  ? "bg-green-50 text-green-600 border-green-100"
                  : "bg-red-50 text-red-600 border-red-100"
              )}>
              {(nameMsg || passwordMsg)?.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
              {(nameMsg || passwordMsg)?.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* School Info */}
        <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-50 pb-4">
            <School className="text-blue-600" size={20} />
            <h3 className="font-bold text-slate-800">Detail Santri</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm font-medium">
              <span className="text-slate-400">Nama Santri</span>
              <span className="text-slate-800">{student?.name || '-'}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-medium">
              <span className="text-slate-400">NISN</span>
              <span className="text-slate-800">{student?.nisn || '-'}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-medium">
              <span className="text-slate-400">Kelas</span>
              <span className="text-blue-600 font-bold">{student?.class_room || '-'}</span>
            </div>
            <div className="pt-4 border-t border-slate-50 flex flex-col gap-1.5">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Alamat Terdaftar</span>
              <span className="text-sm text-slate-600 leading-relaxed font-medium">{student?.address || 'Alamat tidak tersedia'}</span>
            </div>
          </div>
        </div>

        {/* Change Password Section */}
        <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <KeyRound className="text-amber-500" size={20} />
              <h3 className="font-bold text-slate-800">Ubah Kata Sandi</h3>
            </div>
            <button onClick={() => setShowPasswordForm(!showPasswordForm)}
              className={cn("text-xs font-bold px-4 py-2 rounded-xl transition-all border",
                showPasswordForm
                  ? "bg-slate-100 text-slate-500 border-slate-200"
                  : "bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100"
              )}>
              {showPasswordForm ? 'Batal' : 'Ganti Password'}
            </button>
          </div>

          <AnimatePresence>
            {showPasswordForm && (
              <motion.form onSubmit={handleChangePassword}
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="space-y-4 overflow-hidden">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Password Baru</label>
                  <div className="relative">
                    <input type={showNewPw ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimal 6 karakter" required minLength={6}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 pr-12" />
                    <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Konfirmasi Password</label>
                  <div className="relative">
                    <input type={showConfirmPw ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi password baru" required minLength={6}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 pr-12" />
                    <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={savingPassword}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-amber-500/20">
                  {savingPassword ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  Simpan Password Baru
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Logout */}
        <div className="space-y-2 pt-4 pb-12">
          <button onClick={handleLogout}
            className="w-full h-14 bg-white rounded-2xl flex items-center justify-center gap-3 text-red-500 font-bold hover:bg-red-50 transition-all border border-red-100 shadow-sm active:scale-95">
            <LogOut size={20} /> Keluar dari Sistem
          </button>
          <p className="text-center text-[10px] text-slate-300 uppercase tracking-widest font-black mt-6">Sistem Pembayaran PPMH v2.0</p>
        </div>
      </div>
    </div>
  )
}
