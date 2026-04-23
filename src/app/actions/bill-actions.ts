"use server"

import { supabaseAdmin } from "@/lib/supabase-admin"
import { revalidatePath } from "next/cache"
import { JENJANG_OPTIONS, BILLING_COMPONENTS } from "@/lib/utils"

type BillingRatesMap = Record<string, Record<string, number>>

export async function saveBillingRates(rates: BillingRatesMap) {
  try {
    // Save each jenjang's rates as a separate system_settings entry
    for (const jenjang of JENJANG_OPTIONS) {
      const rateData = rates[jenjang.value] || {}
      const { error } = await supabaseAdmin
        .from("system_settings")
        .upsert({
          key: `billing_rates_${jenjang.value}`,
          value: JSON.stringify(rateData),
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' })

      if (error) throw error
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getBillingRates(): Promise<BillingRatesMap> {
  const rates: BillingRatesMap = {}

  for (const jenjang of JENJANG_OPTIONS) {
    const { data } = await supabaseAdmin
      .from("system_settings")
      .select("value")
      .eq("key", `billing_rates_${jenjang.value}`)
      .single()

    if (data) {
      try {
        rates[jenjang.value] = JSON.parse(data.value)
      } catch {
        rates[jenjang.value] = {}
      }
    } else {
      // Default rates
      const defaults: Record<string, Record<string, number>> = {
        tidak_sekolah: { kos_makan: 100000, sekolah_diniah: 50000, sekolah_formal: 0, listrik_kesehatan: 25000, uang_gedung: 25000 },
        sd_mi: { kos_makan: 100000, sekolah_diniah: 50000, sekolah_formal: 30000, listrik_kesehatan: 25000, uang_gedung: 25000 },
        smp_mts: { kos_makan: 100000, sekolah_diniah: 50000, sekolah_formal: 50000, listrik_kesehatan: 25000, uang_gedung: 25000 },
        sma_ma: { kos_makan: 100000, sekolah_diniah: 50000, sekolah_formal: 75000, listrik_kesehatan: 25000, uang_gedung: 25000 },
        kuliah: { kos_makan: 100000, sekolah_diniah: 50000, sekolah_formal: 100000, listrik_kesehatan: 25000, uang_gedung: 25000 },
      }
      rates[jenjang.value] = defaults[jenjang.value] || {}
    }
  }

  return rates
}

export async function generateBulkBills(month: number, year: number) {
  try {
    // 1. Ambil semua santri beserta jenjangnya
    const { data: students, error: studentError } = await supabaseAdmin
      .from("students")
      .select("id, jenjang")
    
    if (studentError) throw studentError
    if (!students || students.length === 0) {
      return { success: false, error: "Tidak ada data santri ditemukan." }
    }

    // 2. Ambil billing rates dari database
    const rates = await getBillingRates()

    // 3. Siapkan data tagihan per santri sesuai jenjang
    const billingData = students.map(s => {
      const jenjang = s.jenjang || 'smp_mts'
      const jenjangRates = rates[jenjang] || {}
      const totalAmount = Object.values(jenjangRates).reduce((sum: number, val) => sum + (Number(val) || 0), 0)

      return {
        student_id: s.id,
        month,
        year,
        amount: totalAmount,
        status: 'unpaid'
      }
    })

    // 4. Insert menggunakan admin client (Bypass RLS)
    const { error: insertError } = await supabaseAdmin
      .from("payments")
      .insert(billingData)
    
    if (insertError) {
      if (insertError.code === '23505') {
        throw new Error("Tagihan untuk periode ini sudah pernah dibuat sebelumnya.")
      }
      throw insertError
    }

    // Hitung summary per jenjang
    const summary: Record<string, number> = {}
    students.forEach(s => {
      const j = s.jenjang || 'smp_mts'
      summary[j] = (summary[j] || 0) + 1
    })
    const summaryText = Object.entries(summary)
      .map(([j, count]) => `${count} santri (${j.replace(/_/g, '/').toUpperCase()})`)
      .join(', ')

    revalidatePath("/admin/bills")
    revalidatePath("/admin")
    
    return { 
      success: true, 
      message: `Berhasil membuat tagihan untuk ${students.length} santri: ${summaryText}` 
    }
  } catch (error: any) {
    console.error("Generate Bills Error:", error.message)
    return { success: false, error: error.message }
  }
}
