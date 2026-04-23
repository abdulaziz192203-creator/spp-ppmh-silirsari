"use server"

import { supabaseAdmin } from "@/lib/supabase-admin"
import { revalidatePath } from "next/cache"
import { sendPushNotification } from "@/lib/firebase-admin"

export async function verifyPayment(id: string, status: 'paid' | 'rejected') {
  try {
    // 1. Dapatkan info pembayaran dan user id santri tersebut
    const { data: payment, error: fetchError } = await supabaseAdmin
      .from("payments")
      .select("*, students(name, parent_id)")
      .eq("id", id)
      .single()

    if (fetchError || !payment) {
      throw new Error("Gagal mengambil data pembayaran")
    }

    // 2. Update status pembayaran
    const { error: updateError } = await supabaseAdmin
      .from("payments")
      .update({ 
        status, 
        verified_at: status === 'paid' ? new Date().toISOString() : null 
      })
      .eq("id", id)

    if (updateError) {
      throw new Error(`Gagal update status: ${updateError.message}`)
    }

    // 3. Kirim Push Notifikasi
    const parentId = payment.students?.parent_id
    if (parentId) {
      const { data: subs } = await supabaseAdmin
        .from("push_subscriptions")
        .select("token")
        .eq("user_id", parentId)

      if (subs && subs.length > 0) {
        const tokens = subs.map((s: any) => s.token)
        const monthName = new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(new Date(2000, payment.month - 1))
        
        const title = status === 'paid' ? '✅ Pembayaran Berhasil' : '❌ Pembayaran Ditolak'
        const body = status === 'paid' 
          ? `Alhamdulillah, pembayaran SPP bulan ${monthName} untuk santri ${payment.students?.name} telah berhasil dikonfirmasi.`
          : `Mohon maaf, bukti pembayaran SPP bulan ${monthName} untuk santri ${payment.students?.name} ditolak oleh Admin. Silakan cek dan upload ulang.`

        await sendPushNotification(tokens, title, body, { type: 'payment_status', paymentId: payment.id })
      }
    }

    revalidatePath("/admin/verify")
    revalidatePath("/admin/payments")
    revalidatePath("/dashboard")
    
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function bulkDeletePayments(ids: string[]) {
  try {
    const { error } = await supabaseAdmin
      .from("payments")
      .delete()
      .in("id", ids)

    if (error) throw error

    revalidatePath("/admin/payments")
    revalidatePath("/admin/verify")
    return { success: true, message: `${ids.length} data pembayaran berhasil dihapus.` }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
