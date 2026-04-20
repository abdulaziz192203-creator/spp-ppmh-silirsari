"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { 
  Heart, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye, 
  Loader2, 
  Save,
  MessageSquareHeart,
  Calendar
} from "lucide-react"
import { motion } from "framer-motion"
import { formatCurrency, formatDate, cn } from "@/lib/utils"

export default function AdminDonationsPage() {
  const [donations, setDonations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  
  const [settings, setSettings] = useState({
    donation_thank_you_message: "Syukran Katsiran, Jazaakumullah Khairan Katsiran.",
    donation_prayer: "Semoga Allah SWT membalas kebaikan Anda dengan pahala yang berlipat ganda dan memberkahi harta serta keluarga Anda. Aamiin.",
    bank_name: "",
    bank_account_number: "",
    bank_account_name: ""
  })

  useEffect(() => {
    fetchDonations()
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    const { data } = await supabase.from("system_settings").select("*")
    if (data) {
      const settingsObj = data.reduce((acc: any, curr) => {
        acc[curr.key] = curr.value
        return acc
      }, {})
      setSettings({
        donation_thank_you_message: settingsObj.donation_thank_you_message || settings.donation_thank_you_message,
        donation_prayer: settingsObj.donation_prayer || settings.donation_prayer,
        bank_name: settingsObj.bank_name || "BSI (Mandiri Syariah)",
        bank_account_number: settingsObj.bank_account_number || "7123456789",
        bank_account_name: settingsObj.bank_account_name || "PP Miftahul Huda"
      })
    }
  }

  const fetchDonations = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("donations")
        .select(`
          *,
          students (
            name,
            nisn,
            class_room
          )
        `)
        .order("created_at", { ascending: false })
      
      if (error) throw error
      setDonations(data || [])
    } catch (error) {
      console.error("Error fetching donations:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (id: string, status: 'paid' | 'rejected') => {
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) return

    try {
      const { error } = await supabase
        .from("donations")
        .update({ 
          status, 
          verified_at: new Date().toISOString(),
          verified_by: user.id
        })
        .eq("id", id)
      
      if (error) throw error
      fetchDonations()
    } catch (error) {
      alert("Gagal memverifikasi donasi")
    }
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      const updates = [
        { key: "donation_thank_you_message", value: settings.donation_thank_you_message },
        { key: "donation_prayer", value: settings.donation_prayer },
        { key: "bank_name", value: settings.bank_name },
        { key: "bank_account_number", value: settings.bank_account_number },
        { key: "bank_account_name", value: settings.bank_account_name }
      ]

      const { error } = await supabase
        .from("system_settings")
        .upsert(updates, { onConflict: 'key' })
      
      if (error) throw error
      alert("Pengaturan donasi berhasil disimpan!")
    } catch (error) {
      alert("Gagal menyimpan pengaturan")
    } finally {
      setSaving(false)
    }
  }

  const filteredDonations = donations.filter(d => {
    const matchesSearch = d.students?.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         d.note?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || d.status === filterStatus
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-outfit">Manajemen Donasi</h1>
          <p className="text-slate-400">Verifikasi dan kelola amal jariyah dari wali santri.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Donation List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex items-center gap-3 bg-slate-900/50 border border-slate-800 rounded-2xl px-4 py-3">
              <Search size={20} className="text-slate-500" />
              <input 
                type="text"
                placeholder="Cari nama santri atau catatan..."
                className="bg-transparent border-none outline-none text-sm w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-900/50 border border-slate-800 rounded-2xl px-4 py-3 text-sm outline-none"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Menunggu</option>
              <option value="paid">Diverifikasi</option>
              <option value="rejected">Ditolak</option>
            </select>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-blue-500" size={40} />
              </div>
            ) : filteredDonations.length === 0 ? (
              <div className="bg-slate-900/30 border border-slate-800 border-dashed rounded-3xl p-20 text-center">
                <Heart className="mx-auto mb-4 text-slate-700" size={48} />
                <p className="text-slate-500">Belum ada donasi yang masuk.</p>
              </div>
            ) : (
              filteredDonations.map((donation, idx) => (
                <motion.div
                  key={donation.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="glass-card rounded-3xl p-6 border border-slate-800/50 hover:border-blue-500/30 transition-all"
                >
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0",
                          donation.status === 'paid' ? "bg-green-500/10 text-green-400" :
                          donation.status === 'pending' ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400"
                        )}>
                          <Heart size={24} />
                        </div>
                        <div>
                          <h4 className="font-bold text-lg leading-tight">{donation.students?.name}</h4>
                          <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">
                            NISN: {donation.students?.nisn} • {donation.students?.class_room}
                          </p>
                          <p className="text-sm text-slate-300 mt-2 italic">"{donation.note || 'Tanpa catatan'}"</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-2 pt-2 md:pt-0 border-t border-slate-800/50 md:border-none">
                        <div className="text-left md:text-right">
                          <p className="text-xl font-bold text-blue-400 leading-none">{formatCurrency(donation.amount)}</p>
                          <p className="text-[10px] text-slate-500 font-bold mt-1">{formatDate(donation.created_at)}</p>
                        </div>
                        <div className={cn(
                          "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md border",
                          donation.status === 'paid' ? "bg-green-500/10 text-green-400 border-green-500/20" :
                          donation.status === 'pending' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                        )}>
                          {donation.status === 'paid' ? 'Lunas' : donation.status === 'pending' ? 'Proses' : 'Ditolak'}
                        </div>
                      </div>
                    </div>

                  <div className="mt-6 pt-6 border-t border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {donation.proof_url && (
                        <a 
                          href={donation.proof_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center gap-2 text-xs font-bold text-blue-400 hover:underline"
                        >
                          <Eye size={16} /> Lihat Bukti
                        </a>
                      )}
                    </div>
                    
                    {donation.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleVerify(donation.id, 'rejected')}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-all"
                        >
                          Tolak
                        </button>
                        <button 
                          onClick={() => handleVerify(donation.id, 'paid')}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-900/40 transition-all"
                        >
                          Konfirmasi
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Donation Settings */}
        <div className="space-y-6">
          <div className="glass-card rounded-3xl p-6 border border-slate-800/50">
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
              <MessageSquareHeart className="text-blue-400" size={20} /> Teks Ucapan & Doa
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Ucapan Terima Kasih</label>
                <textarea 
                  rows={3}
                  value={settings.donation_thank_you_message}
                  onChange={(e) => setSettings({...settings, donation_thank_you_message: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none resize-none"
                  placeholder="Contoh: Syukran Katsiran..."
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Doa Untuk Donatur</label>
                <textarea 
                  rows={4}
                  value={settings.donation_prayer}
                  onChange={(e) => setSettings({...settings, donation_prayer: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none resize-none"
                  placeholder="Tuliskan doa terbaik..."
                />
              </div>

              <button 
                onClick={handleSaveSettings}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Simpan Teks
              </button>
            </div>
          </div>

          <div className="glass-card rounded-3xl p-6 border border-slate-800/50 space-y-6">
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
              <Calendar className="text-emerald-400" size={20} /> Rekening Donasi
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Nama Bank</label>
                <input 
                  type="text"
                  value={settings.bank_name}
                  onChange={(e) => setSettings({...settings, bank_name: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Nomor Rekening</label>
                <input 
                  type="text"
                  value={settings.bank_account_number}
                  onChange={(e) => setSettings({...settings, bank_account_number: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none font-mono"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Nama Pemilik</label>
                <input 
                  type="text"
                  value={settings.bank_account_name}
                  onChange={(e) => setSettings({...settings, bank_account_name: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none"
                />
              </div>

              <button 
                onClick={handleSaveSettings}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Simpan Rekening
              </button>
            </div>
          </div>

          <div className="glass-card rounded-3xl p-6 border border-slate-800/50 bg-blue-600/5">
             <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 bg-blue-600/10 text-blue-400 rounded-xl flex items-center justify-center">
                   <Calendar size={20} />
                </div>
                <h4 className="font-bold">Info Donasi</h4>
             </div>
             <p className="text-xs text-slate-400 leading-relaxed">
                Pesan ucapan dan doa ini akan muncul di dashboard orang tua segera setelah Anda mengklik tombol <strong>Konfirmasi</strong> pada bukti donasi mereka.
             </p>
          </div>
        </div>
      </div>
    </div>
  )
}
