"use client"

import { useEffect, useState } from "react"
import { 
  Newspaper, 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Info,
  MoreVertical,
  Loader2,
  Save,
  Megaphone
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn, formatDate } from "@/lib/utils"
import { 
  getAnnouncements, 
  createAnnouncement, 
  updateAnnouncement, 
  deleteAnnouncement,
  toggleAnnouncementStatus
} from "@/app/actions/announcement-actions"

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "info",
    is_active: true
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const data = await getAnnouncements()
    setAnnouncements(data)
    setLoading(false)
  }

  const handleOpenModal = (item: any = null) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        title: item.title,
        content: item.content,
        type: item.type,
        is_active: item.is_active
      })
    } else {
      setEditingItem(null)
      setFormData({
        title: "",
        content: "",
        type: "info",
        is_active: true
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    let res
    if (editingItem) {
      res = await updateAnnouncement(editingItem.id, formData)
    } else {
      res = await createAnnouncement(formData)
    }

    if (res.success) {
      setIsModalOpen(false)
      fetchData()
    } else {
      alert("Gagal menyimpan pengumuman: " + res.error)
    }
    setIsSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus pengumuman ini?")) return
    const res = await deleteAnnouncement(id)
    if (res.success) fetchData()
    else alert("Gagal menghapus: " + res.error)
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const res = await toggleAnnouncementStatus(id, !currentStatus)
    if (res.success) fetchData()
  }

  const filteredItems = announcements.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'important': return "bg-red-500/10 text-red-500 border-red-500/20"
      case 'warning': return "bg-amber-500/10 text-amber-500 border-amber-500/20"
      default: return "bg-blue-500/10 text-blue-500 border-blue-500/20"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'important': return <AlertCircle size={14} />
      case 'warning': return <AlertCircle size={14} />
      default: return <Info size={14} />
    }
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-outfit">Manajemen Pengumuman</h1>
          <p className="text-slate-400">Siarkan informasi penting kepada seluruh orang tua santri.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20 active:scale-95"
        >
          <Plus size={20} /> Buat Pengumuman
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 flex items-center gap-3 bg-slate-900/50 border border-slate-800 rounded-2xl px-4 py-3">
          <Search size={20} className="text-slate-500" />
          <input 
            type="text"
            placeholder="Cari pengumuman..."
            className="bg-transparent border-none outline-none text-sm w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-20">
            <Loader2 className="animate-spin text-blue-500" size={40} />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="col-span-full bg-slate-900/30 border border-slate-800 border-dashed rounded-3xl p-20 text-center">
            <Megaphone className="mx-auto mb-4 text-slate-700" size={48} />
            <p className="text-slate-500">Belum ada pengumuman.</p>
          </div>
        ) : (
          filteredItems.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={cn(
                "glass-card rounded-3xl p-6 border border-slate-800/50 hover:border-blue-500/30 transition-all flex flex-col justify-between",
                !item.is_active && "opacity-60 grayscale-[0.5]"
              )}
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className={cn(
                    "px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5",
                    getTypeStyle(item.type)
                  )}>
                    {getTypeIcon(item.type)}
                    {item.type}
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleOpenModal(item)}
                      className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2 line-clamp-2">{item.title}</h3>
                <p className="text-sm text-slate-400 line-clamp-3 mb-6 whitespace-pre-wrap">{item.content}</p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  {formatDate(item.created_at)}
                </span>
                <button 
                  onClick={() => handleToggleStatus(item.id, item.is_active)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                    item.is_active 
                      ? "bg-green-500/10 text-green-400 border border-green-500/20" 
                      : "bg-slate-800 text-slate-500 border border-slate-700"
                  )}
                >
                  {item.is_active ? '● Aktif' : '○ Nonaktif'}
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-slate-900 border border-slate-800 rounded-3xl p-8 w-full max-w-lg shadow-2xl"
            >
              <h2 className="text-2xl font-bold font-outfit mb-6">
                {editingItem ? 'Edit Pengumuman' : 'Buat Pengumuman Baru'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs text-slate-500 font-bold uppercase tracking-widest">Judul</label>
                  <input 
                    required
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none"
                    placeholder="Judul pengumuman..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-slate-500 font-bold uppercase tracking-widest">Tipe</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['info', 'warning', 'important'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setFormData({...formData, type: t})}
                        className={cn(
                          "py-2 rounded-xl text-[10px] font-bold uppercase border transition-all",
                          formData.type === t 
                            ? getTypeStyle(t)
                            : "border-slate-800 text-slate-500 hover:border-slate-700"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-slate-500 font-bold uppercase tracking-widest">Konten / Isi</label>
                  <textarea 
                    required
                    rows={5}
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none resize-none"
                    placeholder="Tuliskan isi pengumuman..."
                  />
                </div>

                <div className="flex items-center gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <input 
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="h-5 w-5 rounded border-slate-800 bg-slate-900 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-slate-300">Tampilkan ke orang tua sekarang</label>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-4 rounded-2xl transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    Simpan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
