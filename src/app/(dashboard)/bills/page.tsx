"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { formatCurrency, isPaymentOverdue, getJenjangLabel, getJenjangColorLight, BILLING_COMPONENTS } from "@/lib/utils"
import { CreditCard, CheckCircle, Clock, AlertCircle, Upload, Search, Copy, Check, QrCode, AlertTriangle, XCircle } from "lucide-react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import UploadProofModal from "@/components/layout/UploadProofModal"

export const dynamic = 'force-dynamic'

export default function BillsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPayment, setSelectedPayment] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [copied, setCopied] = useState(false)
  const [methods, setMethods] = useState<any[]>([])
  const [studentJenjang, setStudentJenjang] = useState<string>('smp_mts')
  const [billingRates, setBillingRates] = useState<Record<string, number>>({})
  const [settings, setSettings] = useState<any>({
    bank_name: "BSI",
    bank_account_number: "7123456789",
    bank_account_name: "PP Miftahul Huda",
    payment_deadline_day: "10"
  })
  const router = useRouter()

  const handleCopy = () => {
    navigator.clipboard.writeText(settings.bank_account_number)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    fetchPayments()
    fetchSettings()
    fetchMethods()
  }, [])

  const fetchMethods = async () => {
    const { data } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("is_enabled", true)
      .order("category", { ascending: false })
    
    setMethods(data || [])
  }

  const fetchSettings = async () => {
    const { data } = await supabase.from("system_settings").select("*")
    if (data) {
      const settingsObj = data.reduce((acc: any, curr) => {
        acc[curr.key] = curr.value
        return acc
      }, {})
      setSettings({
        bank_name: settingsObj.bank_name || "BSI",
        bank_account_number: settingsObj.bank_account_number || "7123456789",
        bank_account_name: settingsObj.bank_account_name || "PP Miftahul Huda",
        payment_deadline_day: settingsObj.payment_deadline_day || "10"
      })
    }
  }

  const fetchPayments = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) return router.push("/")

      const { data: profile } = await supabase
        .from("profiles")
        .select("nisn")
        .eq("id", user.id)
        .single()

      if (!profile?.nisn) return

      const { data: studentData } = await supabase
        .from("students")
        .select("id")
        .eq("nisn", profile.nisn)
        .single()

      if (studentData) {
        // Get student's jenjang
        const { data: fullStudent } = await supabase
          .from("students")
          .select("id, jenjang")
          .eq("nisn", profile.nisn)
          .single()

        const jenjang = fullStudent?.jenjang || 'smp_mts'
        setStudentJenjang(jenjang)

        // Fetch billing rates for this jenjang
        const { data: rateData } = await supabase
          .from("system_settings")
          .select("value")
          .eq("key", `billing_rates_${jenjang}`)
          .single()

        if (rateData) {
          try {
            setBillingRates(JSON.parse(rateData.value))
          } catch {
            setBillingRates({})
          }
        }

        const { data: paymentData } = await supabase
          .from("payments")
          .select("*")
          .eq("student_id", studentData.id)
          .order("year", { ascending: false })
          .order("month", { ascending: false })

        setPayments(paymentData || [])
      }
    } catch (error) {
      console.error("Error fetching payments:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPayments = payments.filter(p => {
    const monthName = new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(new Date(2000, p.month - 1))
    return monthName.toLowerCase().includes(searchQuery.toLowerCase()) || p.year.toString().includes(searchQuery)
  })

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
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
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -mr-20 -mt-20 blur-3xl"></div>
         </div>
         <h1 className="text-3xl font-bold font-outfit text-white relative z-10 uppercase tracking-wide">Tagihan Santri</h1>
         <p className="text-white/70 relative z-10 max-w-md text-sm mt-2 font-medium">Lakukan pelunasan SPP sebelum <span className="text-white font-bold underline decoration-blue-400 underline-offset-4">tanggal {settings.payment_deadline_day}</span> setiap bulannya untuk menghindari keterlambatan.</p>
      </div>

      <div className="px-6 pt-10 space-y-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
          <Search size={20} className="text-slate-400 ml-2" />
          <input 
            type="text"
            placeholder="Cari bulan atau tahun..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-slate-800 text-sm py-1.5 font-medium placeholder:text-slate-300"
          />
        </div>

        {/* Payment Instructions Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-xl"
        >
          <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                      <CreditCard size={24} />
                  </div>
                  <div>
                      <h3 className="text-lg font-bold text-slate-800">Alur Pembayaran</h3>
                      <p className="text-xs text-slate-400">Ikuti langkah mudah berikut ini</p>
                  </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                  {[
                      "Pilih Tagihan",
                      "Pilih Metode",
                      "Setor / Transfer",
                      "Upload Bukti"
                  ].map((step, i) => (
                      <div key={i} className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 transition-colors">
                          <span className="h-7 w-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 font-bold text-[10px] shadow-lg shadow-blue-500/20">{i+1}</span>
                          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-tight">{step}</p>
                      </div>
                  ))}
              </div>
          </div>
        </motion.div>

      <div className="grid grid-cols-1 gap-4">
        {filteredPayments.length === 0 ? (
          <div className="text-center py-20 glass rounded-3xl opacity-50 border border-slate-800/50">
            <CreditCard className="mx-auto mb-4 text-slate-700" size={48} />
            <p className="text-sm">Tidak ada tagihan ditemukan</p>
          </div>
        ) : (
          filteredPayments.map((payment, idx) => (
            <motion.div 
              key={payment.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => {
                if (payment.status === 'unpaid' || payment.status === 'rejected') {
                  setSelectedPayment(payment)
                  setIsModalOpen(true)
                }
              }}
              className={cn(
                "bg-white rounded-[32px] p-6 transition-all group border shadow-sm",
                (payment.status === 'unpaid' || payment.status === 'rejected') && isPaymentOverdue(payment.month, payment.year, parseInt(settings.payment_deadline_day)) 
                  ? "border-red-200 bg-red-50/50" 
                  : "border-slate-100",
                (payment.status === 'unpaid' || payment.status === 'rejected') ? "cursor-pointer hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/5 active:scale-[0.98]" : "opacity-80"
              )}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div className="flex items-center gap-5 mb-4 md:mb-0">
                    <div className={cn(
                      "h-14 w-14 rounded-2xl flex items-center justify-center shadow-md",
                      payment.status === 'paid' ? "bg-green-100 text-green-600" :
                      payment.status === 'pending' ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-600"
                    )}>
                      {payment.status === 'paid' ? <CheckCircle size={24} /> :
                       payment.status === 'pending' ? <Clock size={24} /> : 
                       payment.status === 'rejected' ? <XCircle size={24} /> : <AlertCircle size={24} />}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-slate-800 leading-tight">SPP {new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(new Date(2000, payment.month - 1))}</h4>
                      <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">
                        {payment.year} • <span className="text-blue-600">{formatCurrency(payment.amount)}</span>
                        {(payment.status === 'unpaid' || payment.status === 'rejected') && (
                          <span className="block text-[10px] text-amber-500 mt-1 font-medium lowercase first-letter:uppercase">
                            Batas Bayar: Tgl {settings.payment_deadline_day} {new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(new Date(2000, payment.month - 1))} {payment.year}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-none border-slate-50 pt-4 md:pt-0">
                    <div className="flex flex-col items-end">
                        <span className={cn(
                        "text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border",
                        payment.status === 'paid' ? "bg-green-100 text-green-700 border-green-200" :
                        payment.status === 'pending' ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-red-100 text-red-700 border-red-200"
                        )}>
                        {payment.status === 'paid' ? 'LUNAS' : 
                         payment.status === 'pending' ? 'PROSES' : 
                         payment.status === 'rejected' ? 'DITOLAK' :
                         isPaymentOverdue(payment.month, payment.year, parseInt(settings.payment_deadline_day)) ? 'TERLAMBAT' : 'BELUM BAYAR'}
                        </span>
                    </div>
                    {(payment.status === 'unpaid' || payment.status === 'rejected') && (
                      <div className="bg-blue-600 text-white p-3 rounded-2xl shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform md:ml-4">
                        <Upload size={20} />
                      </div>
                    )}
                  </div>
              </div>
              
              <div className="w-full mt-4 pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn("text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border", getJenjangColorLight(studentJenjang))}>
                      {getJenjangLabel(studentJenjang)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                      {BILLING_COMPONENTS.map(comp => {
                        const amount = billingRates[comp.key] || 0
                        return (
                          <div key={comp.key} className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                              <p className="opacity-50 mb-1 scale-90 origin-left">{comp.label}</p>
                              <p className="text-slate-600">{amount > 0 ? formatCurrency(amount) : '-'}</p>
                          </div>
                        )
                      })}
                  </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {selectedPayment && (
        <UploadProofModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            payment={selectedPayment}
            onSuccess={() => {
            fetchPayments()
            alert("Bukti pembayaran berhasil diupload. Mohon tunggu verifikasi admin.")
            }}
        />
      )}
      </div>
    </div>
  )
}
