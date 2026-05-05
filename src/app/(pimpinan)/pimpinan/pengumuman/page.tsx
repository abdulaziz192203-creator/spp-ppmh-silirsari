"use client"

import { useEffect, useState } from "react"
import { Newspaper, Search, AlertCircle, Info, Megaphone, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { cn, formatDate } from "@/lib/utils"
import { getAnnouncements } from "@/app/actions/announcement-actions"

export const dynamic = 'force-dynamic'

export default function PimpinanPengumumanPage() {
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const data = await getAnnouncements()
    setAnnouncements(data)
    setLoading(false)
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

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'important': return 'Penting'
      case 'warning': return 'Peringatan'
      default: return 'Informasi'
    }
  }

  const activeCount = announcements.filter(a => a.is_active).length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-outfit">Pengumuman</h1>
        <p className="text-slate-400">Daftar pengumuman yang telah dipublikasikan oleh Admin.</p>
      </div>

      {/* Stats */}
      <div className="flex gap-4">
        <div className="glass-card rounded-2xl px-5 py-3 border border-slate-800/50 flex items-center gap-3">
          <Newspaper size={18} className="text-amber-400" />
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Total</p>
            <p className="text-lg font-bold">{announcements.length}</p>
          </div>
        </div>
        <div className="glass-card rounded-2xl px-5 py-3 border border-green-500/20 flex items-center gap-3">
          <div className="h-2.5 w-2.5 bg-green-500 rounded-full animate-pulse" />
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Aktif</p>
            <p className="text-lg font-bold text-green-400">{activeCount}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 bg-slate-900/50 border border-slate-800 rounded-2xl px-4 py-3">
        <Search size={18} className="text-slate-500" />
        <input
          type="text"
          placeholder="Cari pengumuman..."
          className="bg-transparent border-none outline-none text-sm w-full text-slate-200 placeholder-slate-600"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-amber-400" size={36} />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-slate-900/30 border border-slate-800 border-dashed rounded-3xl p-20 text-center">
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
              onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
              className={cn(
                "glass-card rounded-3xl p-6 border border-slate-800/50 hover:border-amber-500/20 transition-all cursor-pointer",
                !item.is_active && "opacity-50 grayscale-[0.5]"
              )}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className={cn(
                    "px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5",
                    getTypeStyle(item.type)
                  )}>
                    {getTypeIcon(item.type)}
                    {getTypeLabel(item.type)}
                  </div>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                    item.is_active
                      ? "bg-green-500/10 text-green-400 border-green-500/20"
                      : "bg-slate-800 text-slate-500 border-slate-700"
                  )}>
                    {item.is_active ? '● Aktif' : '○ Nonaktif'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider whitespace-nowrap">
                  {formatDate(item.created_at)}
                </span>
              </div>

              <h3 className="text-lg font-bold mb-2">{item.title}</h3>
              <p className={cn(
                "text-sm text-slate-400 whitespace-pre-wrap transition-all",
                expandedId === item.id ? "" : "line-clamp-2"
              )}>
                {item.content}
              </p>
              {item.content.length > 100 && (
                <p className="text-[10px] text-amber-400 font-bold mt-2 uppercase tracking-widest">
                  {expandedId === item.id ? "Tutup ▲" : "Baca Selengkapnya ▼"}
                </p>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
