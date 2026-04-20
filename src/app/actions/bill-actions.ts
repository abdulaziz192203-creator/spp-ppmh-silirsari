"use server"

import { supabaseAdmin } from "@/lib/supabase-admin"
import { revalidatePath } from "next/cache"

export async function generateBulkBills(month: number, year: number, amount: number) {
  try {
    // 1. Ambil semua ID santri
    const { data: students, error: studentError } = await supabaseAdmin
      .from("students")
      .select("id")
    
    if (studentError) throw studentError
    if (!students || students.length === 0) {
      return { success: false, error: "Tidak ada data santri ditemukan." }
    }

    // 2. Siapkan data tagihan
    const billingData = students.map(s => ({
      student_id: s.id,
      month,
      year,
      amount,
      status: 'unpaid'
    }))

    // 3. Insert menggunakan admin client (Bypass RLS)
    const { error: insertError } = await supabaseAdmin
      .from("payments")
      .insert(billingData)
    
    if (insertError) {
      // Jika error karena sudah ada (unique constraint), beri pesan yang jelas
      if (insertError.code === '23505') {
        throw new Error("Tagihan untuk periode ini sudah pernah dibuat sebelumnya.")
      }
      throw insertError
    }

    revalidatePath("/admin/bills")
    revalidatePath("/admin")
    
    return { 
      success: true, 
      message: `Berhasil membuat tagihan untuk ${students.length} santri.` 
    }
  } catch (error: any) {
    console.error("Generate Bills Error:", error.message)
    return { success: false, error: error.message }
  }
}
