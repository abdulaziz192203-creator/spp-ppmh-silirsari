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
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
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
    <div className="min-h-screen bg-slate-50 -mt-24 -mx-6 md:-mx-12 pb-24 md:pb-12">
      {/* Blue Header Section with Background Image */}
      <div className="bg-blue-600 bg-gradient-to-b from-blue-700 to-blue-600 rounded-b-[40px] pt-24 pb-12 px-6 shadow-2xl relative overflow-hidden text-center flex flex-col items-center">
         {/* Building Background Image */}
         <div className="absolute inset-0 opacity-30 pointer-events-none">
            <img 
              src="/building.jpg" 
              alt="Building" 
              className="w-full h-full object-cover mix-blend-overlay"
              onError={(e) => (e.currentTarget.style.display = 'none')} 
            />
         </div>
         <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -ml-20 -mt-20 blur-3xl"></div>
         </div>
         <h1 className="text-3xl font-bold font-outfit text-white relative z-10 uppercase tracking-wide">Profil Wali</h1>
         <p className="text-white/70 relative z-10 max-w-md text-sm mt-2 font-medium">Kelola informasi akun dan pantau data santri yang terdaftar dalam sistem.</p>
      </div>

      <div className="px-6 pt-10 space-y-6 max-w-4xl mx-auto">
        {/* User Stats/Summary Card */}
        <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-xl text-center relative overflow-hidden">
          <div className="mx-auto h-24 w-24 rounded-[32px] bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white shadow-xl mb-4 relative z-10">
            <User size={48} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 relative z-10">{profile?.full_name || 'Orang Tua Santri'}</h2>
          <p className="text-xs text-slate-400 font-medium relative z-10 mt-1">{profile?.email}</p>
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest mt-4 border border-blue-100 relative z-10">
            <ShieldCheck size={12} />
            WALI SANTRI TERVERIFIKASI
          </div>
        </div>

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
              <span className="text-sm text-slate-600 leading-relaxed font-medium">
                {student?.address || 'Alamat tidak tersedia'}
              </span>
            </div>
          </div>
        </div>

        {/* Account Settings / Actions */}
        <div className="space-y-2 pt-4 pb-12">
          <button 
            onClick={handleLogout}
            className="w-full h-14 bg-white rounded-2xl flex items-center justify-center gap-3 text-red-500 font-bold hover:bg-red-50 transition-all border border-red-100 shadow-sm active:scale-95"
          >
            <LogOut size={20} />
            Keluar dari Sistem
          </button>
          <p className="text-center text-[10px] text-slate-300 uppercase tracking-widest font-black mt-6">Sistem Pembayaran PPMH v2.0</p>
        </div>
      </div>
    </div>
  )
}
