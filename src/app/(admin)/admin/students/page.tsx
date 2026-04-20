"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Mail, 
  Trash2, 
  Edit2,
  X,
  Check,
  MessageCircle
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { createStudentWithAuth, deleteStudentWithAuth, updateStudent } from "@/app/actions/student-actions"

export const dynamic = 'force-dynamic'

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [newStudent, setNewStudent] = useState({
    name: "",
    nisn: "",
    class_room: "",
    address: "",
    password: "", // New password field
    parent_name: "",
    parent_phone: ""
  })
  const [schoolName, setSchoolName] = useState("Pondok Pesantren Miftahul Huda")

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    const { data } = await supabase
      .from("students")
      .select("*")
      .order("name")
    setStudents(data || [])
    
    const { data: settings } = await supabase.from("system_settings").select("value").eq("key", "school_name").single()
    if (settings) setSchoolName(settings.value)
    
    setLoading(false)
  }

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const response = await createStudentWithAuth(newStudent)
    if (response.success) {
      setIsModalOpen(false)
      setNewStudent({ name: "", nisn: "", class_room: "", address: "", password: "", parent_name: "", parent_phone: "" })
      fetchStudents()
      alert(response.message)
    } else {
      alert("Gagal: " + response.error)
    }
    setLoading(false)
  }

  const handleDeleteStudent = async (studentId: string, parentId: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus santri ${name}?\nAkun login orang tua juga akan dihapus.`)) return
    
    setLoading(true)
    const response = await deleteStudentWithAuth(studentId, parentId)
    if (response.success) {
      fetchStudents()
      alert("Berhasil: " + response.message)
    } else {
      alert("Error: " + response.error)
    }
    setLoading(false)
  }

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const response = await updateStudent(selectedStudent.id, {
      name: selectedStudent.name,
      class_room: selectedStudent.class_room,
      address: selectedStudent.address,
      parent_name: selectedStudent.parent_name,
      parent_phone: selectedStudent.parent_phone,
      parentId: selectedStudent.parent_id
    })
    
    if (response.success) {
      setIsEditModalOpen(false)
      fetchStudents()
      alert(response.message)
    } else {
      alert("Error: " + response.error)
    }
    setLoading(false)
  }

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.nisn.includes(search)
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-outfit">Data Santri</h1>
          <p className="text-slate-400">Kelola informasi santri dan akun orang tua.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Plus size={20} /> Tambah Santri
        </button>
      </div>

      <div className="flex items-center gap-4 bg-slate-900/50 p-2 rounded-2xl border border-slate-800/50">
        <div className="pl-3 text-slate-500">
          <Search size={20} />
        </div>
        <input 
          type="text" 
          placeholder="Cari nama atau NISN..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent border-none focus:ring-0 text-slate-200 py-2"
        />
      </div>

      {/* Table - Desktop Only */}
      <div className="hidden md:block glass-card rounded-3xl overflow-hidden border border-slate-800/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Nama Santri</th>
                <th className="px-6 py-4 font-semibold">NISN</th>
                <th className="px-6 py-4 font-semibold">Kelas</th>
                <th className="px-6 py-4 font-semibold">Orang Tua</th>
                <th className="px-6 py-4 font-semibold">No. WA</th>
                <th className="px-6 py-4 font-semibold">Alamat</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    Tidak ada data santri ditemukan.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-200">{student.name}</td>
                    <td className="px-6 py-4 text-slate-400">{student.nisn}</td>
                    <td className="px-6 py-4">
                      <span className="bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-lg text-xs font-medium">
                        {student.class_room}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{student.parent_name || "-"}</td>
                    <td className="px-6 py-4 text-slate-400">{student.parent_phone || "-"}</td>
                    <td className="px-6 py-4 text-slate-400 text-sm truncate max-w-[150px]">{student.address}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => {
                            const phone = student.parent_phone?.replace(/[^0-9]/g, '')
                            if (!phone) return alert("Nomor WA tidak tersedia")
                            const formattedPhone = phone.startsWith('0') ? '62' + phone.substring(1) : phone
                            const message = encodeURIComponent(`Halo Bapak/Ibu ${student.parent_name || 'Wali Santri'}, ini adalah pengingat dari ${schoolName} untuk pembayaran SPP ananda ${student.name} yang masih tertunda. Mohon segera melakukan pelunasan melalui aplikasi. Terima kasih.`)
                            window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank')
                          }}
                          className="p-2 hover:bg-emerald-500/10 rounded-lg text-slate-400 hover:text-emerald-400 transition-all"
                          title="Kirim Pengingat WhatsApp"
                        >
                          <MessageCircle size={16} />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedStudent(student)
                            setIsEditModalOpen(true)
                          }}
                          className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteStudent(student.id, student.parent_id, student.name)}
                          className="p-2 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-400 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Card List - Mobile Only */}
      <div className="md:hidden space-y-4">
        {filteredStudents.length === 0 ? (
          <div className="text-center py-12 text-slate-500 glass-card rounded-3xl">
            Tidak ada data santri ditemukan.
          </div>
        ) : (
          filteredStudents.map((student) => (
            <motion.div 
              key={student.id}
              className="glass-card rounded-2xl p-5 border border-slate-800/50 space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-slate-200">{student.name}</h4>
                  <p className="text-xs text-slate-500 font-medium">NISN: {student.nisn}</p>
                </div>
                <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded-lg text-[10px] font-bold uppercase">
                  {student.class_room}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-slate-500 mb-1">Orang Tua</p>
                  <p className="text-slate-300 font-medium">{student.parent_name || "-"}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">No. WA</p>
                  <p className="text-slate-300 font-medium">{student.parent_phone || "-"}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/50 flex justify-end gap-3">
                 <button 
                    onClick={() => {
                      const phone = student.parent_phone?.replace(/[^0-9]/g, '')
                      if (!phone) return alert("Nomor WA tidak tersedia")
                      const formattedPhone = phone.startsWith('0') ? '62' + phone.substring(1) : phone
                      const message = encodeURIComponent(`Halo Bapak/Ibu ${student.parent_name || 'Wali Santri'}, ini adalah pengingat dari ${schoolName} untuk pembayaran SPP ananda ${student.name} yang masih tertunda. Mohon segera melakukan pelunasan melalui aplikasi. Terima kasih.`)
                      window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank')
                    }}
                    className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400"
                  >
                    <MessageCircle size={18} />
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedStudent(student)
                      setIsEditModalOpen(true)
                    }}
                    className="p-2.5 bg-slate-800 rounded-xl text-slate-200"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => handleDeleteStudent(student.id, student.parent_id, student.name)}
                    className="p-2.5 bg-red-500/10 rounded-xl text-red-400"
                  >
                    <Trash2 size={18} />
                  </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Add Student Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-slate-900 border border-slate-800 rounded-3xl p-8 w-full max-w-lg shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold font-outfit">Tambah Santri</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddStudent} className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Nama Lengkap</label>
                  <input 
                    type="text" 
                    required 
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none"
                    placeholder="Masukkan nama lengkap"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">NISN</label>
                    <input 
                      type="text" 
                      required 
                      value={newStudent.nisn}
                      onChange={(e) => setNewStudent({...newStudent, nisn: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none"
                      placeholder="Contoh: 001234567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Kelas</label>
                    <input 
                      type="text" 
                      required 
                      value={newStudent.class_room}
                      onChange={(e) => setNewStudent({...newStudent, class_room: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none"
                      placeholder="Contoh: 7-A"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Alamat</label>
                  <textarea 
                    rows={2}
                    value={newStudent.address}
                    onChange={(e) => setNewStudent({...newStudent, address: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none"
                    placeholder="Masukkan alamat lengkap"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Nama Orang Tua</label>
                    <input 
                      type="text" 
                      required
                      value={newStudent.parent_name}
                      onChange={(e) => setNewStudent({...newStudent, parent_name: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none"
                      placeholder="Masukkan nama orang tua"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">No. WA Orang Tua</label>
                    <input 
                      type="text" 
                      required
                      value={newStudent.parent_phone}
                      onChange={(e) => setNewStudent({...newStudent, parent_phone: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none"
                      placeholder="Contoh: 0812345678"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Set Password Login (Opsional)</label>
                  <input 
                    type="password" 
                    value={newStudent.password}
                    onChange={(e) => setNewStudent({...newStudent, password: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none"
                    placeholder="Kosongkan untuk default (santriNISN)"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-3 border border-slate-800 rounded-xl hover:bg-slate-800 transition-all font-semibold"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="flex-1 btn-primary flex items-center justify-center gap-2"
                  >
                    {loading ? "Menyimpan..." : <><Check size={20} /> Simpan</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Student Modal */}
      <AnimatePresence>
        {isEditModalOpen && selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-slate-900 border border-slate-800 rounded-3xl p-8 w-full max-w-lg shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold font-outfit">Edit Santri</h2>
                <button onClick={() => setIsEditModalOpen(false)} className="text-slate-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleUpdateStudent} className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Nama Lengkap</label>
                  <input 
                    type="text" 
                    required 
                    value={selectedStudent.name}
                    onChange={(e) => setSelectedStudent({...selectedStudent, name: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">NISN (Tidak dapat diubah)</label>
                    <input 
                      type="text" 
                      disabled
                      value={selectedStudent.nisn}
                      className="w-full bg-slate-950/50 border border-slate-800 text-slate-500 rounded-xl px-4 py-3 outline-none cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Kelas</label>
                    <input 
                      type="text" 
                      required 
                      value={selectedStudent.class_room}
                      onChange={(e) => setSelectedStudent({...selectedStudent, class_room: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Alamat</label>
                  <textarea 
                    rows={2}
                    value={selectedStudent.address}
                    onChange={(e) => setSelectedStudent({...selectedStudent, address: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Nama Orang Tua</label>
                    <input 
                      type="text" 
                      required
                      value={selectedStudent.parent_name || ""}
                      onChange={(e) => setSelectedStudent({...selectedStudent, parent_name: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">No. WA Orang Tua</label>
                    <input 
                      type="text" 
                      required
                      value={selectedStudent.parent_phone || ""}
                      onChange={(e) => setSelectedStudent({...selectedStudent, parent_phone: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 px-6 py-3 border border-slate-800 rounded-xl hover:bg-slate-800 transition-all font-semibold"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="flex-1 btn-primary flex items-center justify-center gap-2"
                  >
                    {loading ? "Menyimpan..." : <><Check size={20} /> Simpan Perubahan</>}
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
