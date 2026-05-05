"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Users, Search, Filter } from "lucide-react"
import { motion } from "framer-motion"
import { getJenjangLabel, getJenjangColor, cn, JENJANG_OPTIONS } from "@/lib/utils"

export const dynamic = 'force-dynamic'

interface Student {
  id: string
  name: string
  nisn: string
  class_room: string | null
  jenjang: string
  address: string | null
}

export default function SantriPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [filtered, setFiltered] = useState<Student[]>([])
  const [search, setSearch] = useState("")
  const [filterJenjang, setFilterJenjang] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStudents()
  }, [])

  useEffect(() => {
    let result = students
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(s => s.name.toLowerCase().includes(q) || s.nisn.includes(q))
    }
    if (filterJenjang) {
      result = result.filter(s => s.jenjang === filterJenjang)
    }
    setFiltered(result)
  }, [search, filterJenjang, students])

  const fetchStudents = async () => {
    setLoading(true)
    const { data } = await supabase
      .from("students")
      .select("id, name, nisn, class_room, jenjang, address")
      .order("name")
    setStudents(data || [])
    setFiltered(data || [])
    setLoading(false)
  }

  // Stats per jenjang
  const jenjangCounts: Record<string, number> = {}
  students.forEach(s => {
    const j = s.jenjang || 'tidak_sekolah'
    jenjangCounts[j] = (jenjangCounts[j] || 0) + 1
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-outfit">Data Santri</h1>
        <p className="text-slate-400">Daftar seluruh santri Pondok Pesantren Miftahul Huda.</p>
      </div>

      {/* Jenjang Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {JENJANG_OPTIONS.map((j, idx) => (
          <motion.button
            key={j.value}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => setFilterJenjang(filterJenjang === j.value ? "" : j.value)}
            className={cn(
              "glass-card rounded-2xl p-4 border transition-all text-left",
              filterJenjang === j.value
                ? "border-amber-500/40 bg-amber-500/5"
                : "border-slate-800/50 hover:border-slate-700"
            )}
          >
            <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">{j.label}</p>
            <p className="text-xl font-bold mt-1">{jenjangCounts[j.value] || 0}</p>
          </motion.button>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau NISN..."
            className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
          />
        </div>
        <div className="relative">
          <Filter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <select
            value={filterJenjang}
            onChange={(e) => setFilterJenjang(e.target.value)}
            className="bg-slate-900/50 border border-slate-800 rounded-xl pl-11 pr-8 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 appearance-none cursor-pointer min-w-[160px]"
          >
            <option value="">Semua Jenjang</option>
            {JENJANG_OPTIONS.map(j => (
              <option key={j.value} value={j.value}>{j.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center gap-2">
        <Users size={16} className="text-amber-400" />
        <p className="text-sm text-slate-400">
          Menampilkan <span className="text-white font-bold">{filtered.length}</span> dari <span className="text-white font-bold">{students.length}</span> santri
        </p>
        {filterJenjang && (
          <button onClick={() => setFilterJenjang("")}
            className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider hover:bg-amber-500/20 transition-colors">
            Reset Filter ✕
          </button>
        )}
      </div>

      {/* Students Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="glass-card rounded-3xl border border-slate-800/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-800 bg-slate-900/30">
                <th className="text-left py-3.5 px-4">#</th>
                <th className="text-left py-3.5 px-4">Nama</th>
                <th className="text-left py-3.5 px-4">NISN</th>
                <th className="text-left py-3.5 px-4">Kelas</th>
                <th className="text-left py-3.5 px-4">Jenjang</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-12 text-slate-600">Memuat data...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-slate-600">Tidak ada data santri ditemukan</td></tr>
              ) : (
                filtered.map((s, i) => (
                  <tr key={s.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                    <td className="py-3 px-4 text-slate-600 font-mono text-xs">{i + 1}</td>
                    <td className="py-3 px-4 font-medium text-slate-200">{s.name}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-xs">{s.nisn}</td>
                    <td className="py-3 px-4 text-slate-400">{s.class_room || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border", getJenjangColor(s.jenjang))}>
                        {getJenjangLabel(s.jenjang)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
