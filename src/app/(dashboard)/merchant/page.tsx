"use client"

import { motion } from "framer-motion"
import { Store, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function MerchantPage() {
  const router = useRouter()
  
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
         <h1 className="text-3xl font-bold font-outfit text-white relative z-10 uppercase tracking-wide">Merchant (BUMP)</h1>
      </div>

      <div className="px-6 pt-20 flex flex-col items-center justify-center text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="h-24 w-24 bg-teal-50 text-teal-600 rounded-[32px] flex items-center justify-center mb-6 shadow-sm border border-teal-100"
        >
          <Store size={48} />
        </motion.div>
        <h2 className="text-xl font-bold text-slate-800 mb-2 font-outfit">Fitur Segera Hadir</h2>
        <p className="text-slate-500 max-w-xs text-sm font-medium">
          Kami sedang mempersiapkan fitur <span className="text-teal-600">Merchant (BUMP)</span> untuk memudahkan transaksi Anda di lingkungan pesantren.
        </p>
        <button 
          onClick={() => router.push('/dashboard')}
          className="mt-10 bg-blue-600 text-white px-8 py-3 rounded-full font-bold text-sm shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
        >
          Kembali ke Dashboard
        </button>
      </div>
    </div>
  )
}
