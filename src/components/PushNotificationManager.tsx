"use client"

import { useEffect, useState } from "react"
import { requestForToken, onMessageListener } from "@/lib/firebase"
import { supabase } from "@/lib/supabase"
import { Bell, BellOff, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const VAPID_KEY = "BIlb2fX56vIeKTyiMwq8BV9nhftZxiUTimU8nTjNPy_2kv0SJYvqsD-ORuG38kLUukdoTj7kGMTcQVQ45X5gLEo"

export default function PushNotificationManager() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>("default")

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission)
      if (Notification.permission === "default") {
        // Show prompt after 3 seconds
        const timer = setTimeout(() => setShowPrompt(true), 3000)
        return () => clearTimeout(timer)
      }
    }
  }, [])

  const handleEnableNotifications = async () => {
    const token = await requestForToken(VAPID_KEY)
    if (token) {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        // Save to database
        await supabase
          .from("push_subscriptions")
          .upsert([
            { 
              user_id: session.user.id, 
              token: token,
              device_type: /iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'ios' : 'android'
            }
          ], { onConflict: 'token' })
      }
      setPermission("granted")
      setShowPrompt(false)
    }
  }

  // Listen for foreground messages
  useEffect(() => {
    onMessageListener().then((payload: any) => {
      console.log("Foreground notification received:", payload)
      // You can show a custom toast here if you want
    })
  }, [])

  if (!showPrompt) return null

  return (
    <AnimatePresence>
      <div className="fixed bottom-24 left-6 right-6 z-[150] md:left-auto md:right-8 md:bottom-8 md:w-80">
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="bg-slate-900 border border-slate-800 rounded-[32px] p-6 shadow-2xl shadow-blue-900/20"
        >
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 bg-blue-600/20 text-blue-400 rounded-2xl flex items-center justify-center shrink-0">
              <Bell size={24} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-200 text-sm mb-1">Aktifkan Notifikasi?</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Dapatkan info pembayaran & pengumuman penting langsung di HP Anda.</p>
            </div>
            <button onClick={() => setShowPrompt(false)} className="text-slate-600 hover:text-white">
              <X size={18} />
            </button>
          </div>
          <div className="flex gap-3 mt-6">
            <button 
              onClick={() => setShowPrompt(false)}
              className="flex-1 py-3 rounded-xl text-xs font-bold text-slate-400 bg-slate-800/50 hover:bg-slate-800 transition-all"
            >
              Nanti saja
            </button>
            <button 
              onClick={handleEnableNotifications}
              className="flex-1 py-3 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-900/40 transition-all"
            >
              Aktifkan
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
