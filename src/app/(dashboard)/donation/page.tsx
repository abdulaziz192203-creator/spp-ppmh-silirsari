"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { motion, AnimatePresence } from "framer-motion"
import { Heart, ArrowLeft, Send, History, CheckCircle2, Clock, XCircle, Loader2, MessageSquareHeart, Camera, Wallet, Copy } from "lucide-react"
import { useRouter } from "next/navigation"
import { formatCurrency, formatDate, cn } from "@/lib/utils"

export default function DonationPage() {
  const [student, setStudent] = useState<any>(null)
  const [donations, setDonations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [proofUrl, setProofUrl] = useState("")
  
  const [settings, setSettings] = useState({
    donation_thank_you_message: "Syukran Katsiran, Jazaakumullah Khairan Katsiran.",
    donation_prayer: "Semoga Allah SWT membalas kebaikan Anda dengan pahala yang berlipat ganda.",
    bank_name: "BSI",
    bank_account_number: "7123456789",
    bank_account_name: "PP Miftahul Huda"
  })
  
  const router = useRouter()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) return router.push("/")

      const { data: profile } = await supabase.from("profiles").select("nisn").eq("id", user.id).single()
      if (!profile?.nisn) return

      const { data: studentData } = await supabase.from("students").select("*").eq("nisn", profile.nisn).single()
      setStudent(studentData)

      if (studentData) {
        const { data: donationData } = await supabase
          .from("donations")
          .select("*")
          .eq("student_id", studentData.id)
          .order("created_at", { ascending: false })
        
        setDonations(donationData || [])
      }

      // Fetch Settings
      const { data: setts } = await supabase.from("system_settings").select("*")
      if (setts) {
        const sObj = setts.reduce((acc: any, curr) => {
          acc[curr.key] = curr.value
          return acc
        }, {})
        setSettings({
          donation_thank_you_message: sObj.donation_thank_you_message || settings.donation_thank_you_message,
          donation_prayer: sObj.donation_prayer || settings.donation_prayer,
          bank_name: sObj.bank_name || "BSI",
          bank_account_number: sObj.bank_account_number || "7123456789",
          bank_account_name: sObj.bank_account_name || "PP Miftahul Huda"
        })
      }
    } catch (error) {
      console.error("Error fetching donation data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `donation-proofs/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(filePath)

      setProofUrl(publicUrl)
    } catch (error) {
      alert("Gagal mengupload bukti")
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !proofUrl) return alert("Mohon isi nominal dan upload bukti transfer")
    
    setSubmitting(true)
    try {
      const { error } = await supabase
        .from("donations")
        .insert({
          student_id: student.id,
          amount: parseInt(amount),
          note,
          proof_url: proofUrl,
          status: 'pending'
        })
      
      if (error) throw error
      
      setAmount("")
      setNote("")
      setProofUrl("")
      fetchData()
      alert("Donasi berhasil dikirim! Mohon tunggu verifikasi admin.")
    } catch (error) {
      alert("Gagal mengirim donasi: " + (error as any).message)
    } finally {
      setSubmitting(false)
    }
  }

  const confirmedDonation = donations.find(d => d.status === 'paid')

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 -mt-24 -mx-6 md:-mx-12 pb-24 md:pb-12">
      <div className="bg-blue-600 bg-gradient-to-b from-blue-700 to-blue-600 rounded-b-[40px] pt-24 pb-12 px-6 shadow-2xl relative overflow-hidden text-center flex flex-col items-center">
         <div className="absolute inset-0 opacity-30 pointer-events-none">
            <img 
              src="/building.jpg" 
              alt="Building" 
              className="w-full h-full object-cover mix-blend-overlay"
              onError={(e) => (e.currentTarget.style.display = 'none')} 
            />
         </div>
         <button 
           onClick={() => router.back()}
           className="absolute top-28 left-6 text-white/80 hover:text-white transition-colors"
         >
           <ArrowLeft size={24} />
         </button>
         <h1 className="text-3xl font-bold font-outfit text-white relative z-10 uppercase tracking-wide">Donasi / Jariyah</h1>
         <p className="text-white/70 relative z-10 max-w-md text-sm mt-2 font-medium">Salurkan amal terbaik Anda untuk pembangunan dan pengembangan pesantren.</p>
      </div>

      <div className="px-6 pt-10 space-y-8 max-w-4xl mx-auto">
        {/* Thank You Message Area */}
        <AnimatePresence>
          {confirmedDonation && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Heart size={120} />
              </div>
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="h-16 w-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 border border-white/30">
                  <MessageSquareHeart size={32} />
                </div>
                <h3 className="text-2xl font-black mb-2 font-outfit uppercase tracking-wide">{settings.donation_thank_you_message}</h3>
                <p className="text-blue-100 italic text-sm leading-relaxed max-w-md">
                  "{settings.donation_prayer}"
                </p>
                <div className="mt-6 pt-6 border-t border-white/10 w-full flex justify-center gap-8">
                  <div className="text-center">
                    <p className="text-[10px] text-blue-200 uppercase font-black tracking-widest mb-1">Total Amal Anda</p>
                    <p className="font-bold text-lg">{formatCurrency(donations.filter(d => d.status === 'paid').reduce((a, b) => a + Number(b.amount), 0))}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Form & Bank Info */}
          <div className="space-y-6">
            {/* Bank Info Card */}
            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 bg-gradient-to-br from-white to-blue-50/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                  <Wallet className="size-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">Rekening Donasi</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Silakan transfer ke rekening berikut</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="bg-slate-900 rounded-2xl p-4 text-white relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                    <CheckCircle2 size={60} />
                  </div>
                  <div className="relative z-10">
                    <p className="text-[9px] text-white/50 font-black uppercase tracking-widest mb-1">{settings.bank_name}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xl font-mono font-bold tracking-wider">{settings.bank_account_number}</p>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(settings.bank_account_number)
                          alert("Nomor rekening disalin!")
                        }}
                        className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                    <p className="text-xs text-white/70 mt-2 font-medium">a.n {settings.bank_account_name}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Donation Form */}
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Send className="text-blue-600" size={20} /> Kirim Donasi Baru
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Nominal Donasi (Rp)</label>
                <input 
                  type="number"
                  placeholder="Contoh: 100000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Catatan / Niat (Opsional)</label>
                <textarea 
                  rows={2}
                  placeholder="Contoh: Untuk pembangunan masjid..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Upload Bukti Transfer</label>
                <div className="relative">
                   <input 
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="proof-upload"
                   />
                   <label 
                      htmlFor="proof-upload"
                      className={cn(
                        "w-full flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer",
                        proofUrl ? "border-green-200 bg-green-50" : "border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50"
                      )}
                   >
                      {uploading ? (
                        <Loader2 className="animate-spin text-blue-500" size={24} />
                      ) : proofUrl ? (
                        <>
                          <CheckCircle2 className="text-green-500 mb-1" size={24} />
                          <span className="text-[10px] text-green-600 font-bold uppercase">Berhasil Diupload</span>
                        </>
                      ) : (
                        <>
                          <Camera className="text-slate-400 mb-1" size={24} />
                          <span className="text-[10px] text-slate-500 font-bold uppercase">Klik untuk Upload Bukti</span>
                        </>
                      )}
                   </label>
                </div>
              </div>

              <button 
                type="submit"
                disabled={submitting || uploading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50 mt-4"
              >
                {submitting ? "Mengirim..." : "Kirim Donasi Sekarang"}
              </button>
            </form>
          </div>
        </div>

          {/* Donation History */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <History className="text-slate-400" size={20} /> Riwayat Donasi
            </h3>
            
            <div className="space-y-4">
              {donations.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 border border-slate-100 text-center opacity-50">
                  <p className="text-sm font-medium text-slate-400 italic">Belum ada riwayat donasi.</p>
                </div>
              ) : (
                donations.map((donation, idx) => (
                  <motion.div 
                    key={donation.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center",
                        donation.status === 'paid' ? "bg-green-100 text-green-600" :
                        donation.status === 'pending' ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-600"
                      )}>
                        {donation.status === 'paid' ? <CheckCircle2 size={20} /> :
                         donation.status === 'pending' ? <Clock size={20} /> : <XCircle size={20} />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{formatCurrency(donation.amount)}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">{formatDate(donation.created_at)}</p>
                      </div>
                    </div>
                    <div className={cn(
                      "text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md border",
                      donation.status === 'paid' ? "bg-green-100 text-green-700 border-green-200" :
                      donation.status === 'pending' ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-red-100 text-red-700 border-red-200"
                    )}>
                      {donation.status === 'paid' ? 'Lunas' : donation.status === 'pending' ? 'Proses' : 'Ditolak'}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
