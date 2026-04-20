"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { 
  Upload, 
  X, 
  Loader2, 
  CheckCircle2, 
  ChevronRight, 
  ArrowLeft, 
  QrCode, 
  Wallet, 
  Building2,
  Copy,
  Check
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface UploadProofModalProps {
  payment: any
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function UploadProofModal({ payment, isOpen, onClose, onSuccess }: UploadProofModalProps) {
  const [step, setStep] = useState(1) // 1: Selection, 2: Instructions & Upload
  const [methods, setMethods] = useState<any[]>([])
  const [selectedMethod, setSelectedMethod] = useState<any>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      fetchMethods()
      setStep(1)
      setFile(null)
      setPreview(null)
      setSelectedMethod(null)
    }
  }, [isOpen])

  const fetchMethods = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("is_enabled", true)
        .order("category", { ascending: false })
      
      setMethods(data || [])
    } catch (error) {
      console.error("Error fetching methods:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      setPreview(URL.createObjectURL(selectedFile))
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleUpload = async () => {
    if (!file || !selectedMethod) return
    setUploading(true)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${payment.id}-${Date.now()}.${fileExt}`
      const filePath = `proofs/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('payments')
        .update({ 
          proof_url: publicUrl,
          status: 'pending',
          payment_method: selectedMethod.name
        })
        .eq('id', payment.id)

      if (updateError) throw updateError

      onSuccess()
      onClose()
    } catch (error: any) {
      alert("Upload gagal: " + error.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white border border-slate-200 rounded-[32px] w-full max-w-md shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                {step === 2 && (
                    <button onClick={() => setStep(1)} className="text-slate-400 hover:text-blue-600 transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                )}
                <h2 className="text-lg font-bold font-outfit text-slate-800 uppercase tracking-wide">
                    {step === 1 ? "Pilih Metode" : "Konfirmasi"}
                </h2>
              </div>
              <button onClick={onClose} className="text-slate-300 hover:text-red-500 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {step === 1 ? (
                <div className="space-y-6">
                   {loading ? (
                       <div className="flex flex-col items-center justify-center py-12 gap-4">
                           <Loader2 className="animate-spin text-blue-500" size={32} />
                           <p className="text-sm text-slate-500">Memuat metode pembayaran...</p>
                       </div>
                   ) : (
                       <>
                        {['QRIS', 'E-Wallet', 'Transfer Bank'].map(category => {
                            const categoryMethods = methods.filter(m => m.category === category)
                            if (categoryMethods.length === 0) return null
                            return (
                                <div key={category} className="space-y-3">
                                    <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase px-2">{category}</h3>
                                    <div className="space-y-2">
                                        {categoryMethods.map(method => (
                                            <button 
                                                key={method.id}
                                                onClick={() => {
                                                    setSelectedMethod(method)
                                                    setStep(2)
                                                }}
                                                className="w-full group bg-white hover:bg-blue-50 border border-slate-100 hover:border-blue-200 rounded-2xl p-4 flex items-center justify-between transition-all shadow-sm active:scale-[0.98]"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "h-10 w-10 rounded-xl flex items-center justify-center shadow-md",
                                                        method.category === 'QRIS' ? "bg-purple-100 text-purple-600" :
                                                        method.category === 'E-Wallet' ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600"
                                                    )}>
                                                        {method.category === 'QRIS' ? <QrCode size={20} /> :
                                                         method.category === 'E-Wallet' ? <Wallet size={20} /> : <Building2 size={20} />}
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="font-bold text-sm text-slate-800">{method.name}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{method.account_number || "Klik untuk detail"}</p>
                                                    </div>
                                                </div>
                                                <ChevronRight size={18} className="text-slate-200 group-hover:text-blue-600 transition-colors" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                       </>
                   )}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Selected Method Summary */}
                  <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black text-[10px] shadow-lg shadow-blue-500/20">
                            {selectedMethod.name.substring(0, 3).toUpperCase()}
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">Pilihan</p>
                            <p className="font-bold text-sm text-slate-800">{selectedMethod.name}</p>
                        </div>
                    </div>
                    <button onClick={() => setStep(1)} className="text-[10px] font-bold text-blue-400 uppercase tracking-wider hover:underline">
                        Ganti
                    </button>
                  </div>

                  {/* Payment Details */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-6">
                      {/* Account Info (Show if not solely QRIS or if details exist) */}
                      {(selectedMethod.category !== 'QRIS' || (selectedMethod.account_number && selectedMethod.account_name)) && (
                          <div className="space-y-4">
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2 text-center">Tujuan Transfer</p>
                                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <div>
                                        <p className="text-sm font-black text-slate-800 tracking-wider font-mono">{selectedMethod.account_number || '-'}</p>
                                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-tight">Atas Nama: {selectedMethod.account_name || '-'}</p>
                                    </div>
                                    <button 
                                        onClick={() => handleCopy(selectedMethod.account_number)}
                                        className={cn(
                                            "p-3 rounded-xl transition-all",
                                            copied ? "bg-green-600 text-white" : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                                        )}
                                    >
                                        {copied ? <Check size={16} /> : <Copy size={16} />}
                                    </button>
                                </div>
                            </div>
                          </div>
                      )}

                      {/* QR Code (Show if image exists) */}
                      {selectedMethod.image_url && (
                          <div className="space-y-3">
                              <p className="text-[10px] text-slate-500 uppercase font-black text-center tracking-widest">
                                {selectedMethod.category === 'QRIS' ? 'Pindai QR Kode' : 'Atau Pindai QR Berikut'}
                              </p>
                              <div className="aspect-square bg-white p-4 rounded-xl max-w-[180px] mx-auto shadow-2xl">
                                  <img src={selectedMethod.image_url} alt="QR Code" className="w-full h-full object-contain" />
                              </div>
                              <p className="text-[10px] text-slate-600 italic text-center">Silakan simpan/screenshot QR ini</p>
                          </div>
                      )}

                      <div className="pt-4 border-t border-slate-100">
                          <div className="flex justify-between items-end mb-1">
                              <span className="text-[10px] text-slate-400 font-black tracking-widest uppercase">Total Bayar</span>
                              <span className="text-xl font-black text-blue-600 leading-none">Rp {payment.amount.toLocaleString('id-ID')}</span>
                          </div>
                          <p className="text-[9px] text-slate-300 font-bold uppercase tracking-tighter mt-1 text-right">Bulan {new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(new Date(2000, payment.month - 1))} {payment.year}</p>
                      </div>
                  </div>

                  {/* Upload Area */}
                  <div className="space-y-3">
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest ml-1">Unggah Bukti Transfer</p>
                    <div 
                        className="aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer hover:border-blue-400 transition-colors"
                        onClick={() => document.getElementById('file-upload')?.click()}
                    >
                        {preview ? (
                        <img src={preview} alt="Pratinjau" className="w-full h-full object-contain" />
                        ) : (
                        <div className="flex flex-col items-center">
                            <Upload size={24} className="text-slate-300 mb-2 group-hover:text-blue-600 transition-colors" />
                            <p className="text-[10px] text-slate-300 text-center px-4 font-black uppercase tracking-widest">Sentuh Untuk Unggah</p>
                        </div>
                        )}
                        <input 
                        id="file-upload"
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileChange}
                        className="hidden"
                        />
                    </div>
                  </div>

                  <button 
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 bg-blue-600 text-white font-bold shadow-xl shadow-blue-900/40 disabled:opacity-50 disabled:grayscale transition-all active:scale-95"
                  >
                    {uploading ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <>
                        <CheckCircle2 size={20} />
                        Konfirmasi Pembayaran
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
