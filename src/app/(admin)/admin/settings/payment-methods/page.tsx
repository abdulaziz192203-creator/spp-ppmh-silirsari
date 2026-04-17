"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  Save, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  QrCode,
  Smartphone,
  Banknote,
  Upload,
  X,
  ArrowLeft,
  ToggleLeft,
  ToggleRight
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export default function PaymentMethodsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [methods, setMethods] = useState<any[]>([])
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newMethod, setNewMethod] = useState({
    name: "",
    category: "Transfer Bank",
    account_number: "",
    account_name: ""
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchMethods()
  }, [])

  const fetchMethods = async () => {
    try {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .order("category", { ascending: false })
        .order("name", { ascending: true })
      
      if (error) throw error
      setMethods(data || [])
    } catch (error: any) {
      console.error("Error fetching methods:", error.message)
      setMessage({ type: 'error', text: "Gagal mengambil data metode pembayaran." })
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("payment_methods")
        .update({ is_enabled: !currentStatus })
        .eq("id", id)
      
      if (error) throw error
      setMethods(prev => prev.map(m => m.id === id ? { ...m, is_enabled: !currentStatus } : m))
    } catch (error: any) {
      alert("Gagal mengubah status: " + error.message)
    }
  }

  const handleUpdateDetails = async (id: string, details: any) => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from("payment_methods")
        .update(details)
        .eq("id", id)
      
      if (error) throw error
      setMessage({ type: 'success', text: "Detail berhasil diperbarui!" })
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      alert("Gagal memperbarui detail: " + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (id: string, file: File) => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${id}-${Date.now()}.${fileExt}`
      const filePath = `qris/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('payment-assets')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('payment-assets')
        .getPublicUrl(filePath)

      await handleUpdateDetails(id, { image_url: publicUrl })
      fetchMethods()
    } catch (error: any) {
      alert("Gagal mengunggah gambar: " + error.message)
    }
  }

  const handleAddMethod = async () => {
    if (!newMethod.name) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from("payment_methods")
        .insert([newMethod])
      
      if (error) throw error
      setIsAddModalOpen(false)
      setNewMethod({ name: "", category: "Transfer Bank", account_number: "", account_name: "" })
      fetchMethods()
      setMessage({ type: 'success', text: "Metode baru berhasil ditambahkan!" })
    } catch (error: any) {
      alert("Gagal menambah: " + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteMethod = async (id: string) => {
    if (!confirm("Hapus metode ini?")) return
    try {
      const { error } = await supabase
        .from("payment_methods")
        .delete()
        .eq("id", id)
      
      if (error) throw error
      fetchMethods()
    } catch (error: any) {
      alert("Gagal menghapus: " + error.message)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="animate-spin text-blue-500" size={32} />
    </div>
  )

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-500 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft size={16} />
            <span className="text-sm font-medium">Kembali ke Pengaturan</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-emerald-600/10 text-emerald-400 rounded-xl flex items-center justify-center">
              <CreditCard size={24} />
            </div>
            <h1 className="text-3xl font-bold font-outfit">Metode Pembayaran</h1>
          </div>
          <p className="text-slate-400 mt-1">Aktifkan dan atur instruksi pembayaran untuk orang tua.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg active:scale-95"
        >
          <Plus size={20} />
          Tambah Metode
        </button>
      </div>

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

      <div className="grid grid-cols-1 gap-6">
        {['QRIS', 'E-Wallet', 'Transfer Bank'].map(category => (
          <div key={category} className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 ml-2">{category}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {methods.filter(m => m.category === category).map((method) => (
                <motion.div 
                  key={method.id}
                  layout
                  className={cn(
                    "glass-card rounded-3xl p-6 border transition-all",
                    method.is_enabled ? "border-slate-800/50" : "border-slate-800/20 opacity-60"
                  )}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-12 w-12 rounded-2xl flex items-center justify-center font-bold text-xs shadow-inner",
                        method.category === 'QRIS' ? "bg-purple-500/10 text-purple-400" :
                        method.category === 'E-Wallet' ? "bg-blue-500/10 text-blue-400" : "bg-emerald-500/10 text-emerald-400"
                      )}>
                        {method.name.substring(0, 3)}
                      </div>
                      <div>
                        <h4 className="font-bold">{method.name}</h4>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">{method.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => handleDeleteMethod(method.id)}
                            className="p-2 text-slate-700 hover:text-red-500 transition-colors"
                        >
                            <Trash2 size={18} />
                        </button>
                        <button 
                        onClick={() => handleToggle(method.id, method.is_enabled)}
                        className={cn(
                            "transition-colors",
                            method.is_enabled ? "text-emerald-500" : "text-slate-700 hover:text-slate-500"
                        )}
                        >
                        {method.is_enabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                        </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {method.category !== 'QRIS' && (
                      <>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 uppercase font-bold ml-1">No. Rek / Virtual Account</label>
                          <input 
                            type="text"
                            defaultValue={method.account_number}
                            onBlur={(e) => handleUpdateDetails(method.id, { account_number: e.target.value })}
                            className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500/50 transition-all font-mono"
                            placeholder="Contoh: 7123456789"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 uppercase font-bold ml-1">Atas Nama</label>
                          <input 
                            type="text"
                            defaultValue={method.account_name}
                            onBlur={(e) => handleUpdateDetails(method.id, { account_name: e.target.value })}
                            className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                            placeholder="Contoh: PP Miftahul Huda"
                          />
                        </div>
                      </>
                    )}

                    <div className="space-y-2">
                        <label className="text-[10px] text-slate-500 uppercase font-bold ml-1">
                            {method.category === 'QRIS' ? 'Gambar QR Code' : 'QR Code (Opsional)'}
                        </label>
                        <div className="relative group aspect-square bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center">
                            {method.image_url ? (
                                <>
                                    <img src={method.image_url} alt={method.name} className="w-full h-full object-contain" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <label className="cursor-pointer bg-white text-black px-4 py-2 rounded-xl text-xs font-bold shadow-lg hover:scale-105 transition-transform">
                                            Ganti QR
                                            <input 
                                                type="file" 
                                                className="hidden" 
                                                accept="image/*"
                                                onChange={(e) => e.target.files?.[0] && handleImageUpload(method.id, e.target.files[0])}
                                            />
                                        </label>
                                    </div>
                                </>
                            ) : (
                                <label className="cursor-pointer flex flex-col items-center gap-2 hover:scale-105 transition-transform">
                                    <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center border border-slate-800 text-slate-500">
                                        <Upload size={20} />
                                    </div>
                                    <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Unggah QR</span>
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        accept="image/*"
                                        onChange={(e) => e.target.files?.[0] && handleImageUpload(method.id, e.target.files[0])}
                                    />
                                </label>
                            )}
                        </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add Method Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-8 shadow-2xl"
            >
              <h2 className="text-xl font-bold mb-6">Tambah Metode Baru</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Nama Metode</label>
                  <input 
                    type="text"
                    value={newMethod.name}
                    onChange={(e) => setNewMethod({...newMethod, name: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-all font-bold"
                    placeholder="Contoh: ShopeePay, Bank Mandiri"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Kategori</label>
                  <select 
                    value={newMethod.category}
                    onChange={(e) => setNewMethod({...newMethod, category: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-all appearance-none"
                  >
                    <option value="QRIS">QRIS</option>
                    <option value="E-Wallet">E-Wallet</option>
                    <option value="Transfer Bank">Transfer Bank</option>
                  </select>
                </div>
                
                {newMethod.category !== 'QRIS' && (
                    <>
                    <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400">No. Rekening / Phone</label>
                    <input 
                        type="text"
                        value={newMethod.account_number}
                        onChange={(e) => setNewMethod({...newMethod, account_number: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-all font-mono"
                    />
                    </div>
                    <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400">Atas Nama</label>
                    <input 
                        type="text"
                        value={newMethod.account_name}
                        onChange={(e) => setNewMethod({...newMethod, account_name: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-all"
                    />
                    </div>
                    </>
                )}

                <div className="flex gap-3 pt-6">
                  <button 
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleAddMethod}
                    disabled={saving}
                    className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all"
                  >
                    {saving ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Tambah"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
