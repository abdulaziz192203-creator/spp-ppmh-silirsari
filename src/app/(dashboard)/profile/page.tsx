"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { User, School, LogOut, Loader2, Mail, CreditCard, ShieldCheck } from "lucide-react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchProfileData()
  }, [])

  const fetchProfileData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()
      
      setProfile({ ...profileData, email: user.email })

      if (profileData?.nisn) {
        // Get student data
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
      <div className="space-y-8 pb-12">
        <div>
          <h1 className="text-3xl font-bold font-outfit">Profil Saya</h1>
        <p className="text-slate-400 text-sm">Informasi akun dan data santri Anda.</p>
      </div>

      <div className="space-y-6">
        {/* User Stats/Summary Card */}
        <div className="glass-card rounded-3xl p-6 relative overflow-hidden bg-gradient-to-br from-blue-600/10 to-indigo-600/10 border-blue-500/20 text-center">
          <div className="mx-auto h-24 w-24 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-xl mb-4">
            <User size={48} />
          </div>
          <h2 className="text-xl font-bold">{profile?.full_name || 'Orang Tua Santri'}</h2>
          <p className="text-sm text-slate-400">{profile?.email}</p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-[10px] font-bold uppercase tracking-wider mt-3 border border-blue-500/20">
            <ShieldCheck size={12} />
            Wali Santri Terverifikasi
          </div>
        </div>

        {/* School Info */}
        <div className="glass rounded-3xl p-6 border border-slate-800/50">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
            <School className="text-amber-400" size={20} />
            <h3 className="font-bold">Data Santri</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Nama Santri</span>
              <span className="font-medium text-slate-200">{student?.name || '-'}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">NISN</span>
              <span className="font-medium text-slate-200">{student?.nisn || '-'}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Kelas</span>
              <span className="font-medium text-blue-400">{student?.class_room || '-'}</span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex flex-col gap-1.5">
              <span className="text-xs text-slate-500">Alamat Rumah</span>
              <span className="text-sm text-slate-300 leading-relaxed italic">
                {student?.address || 'Alamat tidak tersedia'}
              </span>
            </div>
          </div>
        </div>

        {/* Account Settings / Actions */}
        <div className="space-y-2 pt-4">
          <button 
            onClick={handleLogout}
            className="w-full h-14 glass rounded-2xl flex items-center justify-center gap-3 text-red-400 font-bold hover:bg-red-500/5 transition-all border border-red-500/20"
          >
            <LogOut size={20} />
            Keluar dari Sistem
          </button>
          <p className="text-center text-[10px] text-slate-600 uppercase tracking-widest font-medium mt-4">PPMH Payment System</p>
        </div>
      </div>
    </div>
  )
}
