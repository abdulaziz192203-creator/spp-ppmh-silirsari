"use server"

import { supabaseAdmin } from "@/lib/supabase-admin"
import { revalidatePath } from "next/cache"
import { JENJANG_OPTIONS, BILLING_COMPONENTS, type BillingComponent } from "@/lib/utils"

type BillingRatesMap = Record<string, Record<string, number>>

export async function saveBillingRates(rates: BillingRatesMap) {
  try {
    for (const jenjang of JENJANG_OPTIONS) {
      // Reguler
      const rateData = rates[jenjang.value] || {}
      const { error: err1 } = await supabaseAdmin
        .from("system_settings")
        .upsert({
          key: `billing_rates_${jenjang.value}`,
          value: JSON.stringify(rateData),
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' })
      if (err1) throw err1

      // Keringanan
      const rateDataKeringanan = rates[`keringanan_${jenjang.value}`] || {}
      const { error: err2 } = await supabaseAdmin
        .from("system_settings")
        .upsert({
          key: `billing_rates_keringanan_${jenjang.value}`,
          value: JSON.stringify(rateDataKeringanan),
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' })
      if (err2) throw err2
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getBillingComponents(): Promise<BillingComponent[]> {
  const { data } = await supabaseAdmin
    .from("system_settings")
    .select("value")
    .eq("key", "billing_components")
    .single()

  if (data) {
    try {
      return JSON.parse(data.value)
    } catch {
      return [...BILLING_COMPONENTS]
    }
  }
  return [...BILLING_COMPONENTS]
}

export async function saveBillingComponents(components: BillingComponent[]) {
  try {
    const { error } = await supabaseAdmin
      .from("system_settings")
      .upsert({
        key: "billing_components",
        value: JSON.stringify(components),
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' })

    if (error) throw error
    revalidatePath("/admin/bills")
    revalidatePath("/dashboard/bills")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getBillingRates(): Promise<BillingRatesMap> {
  const rates: BillingRatesMap = {}
  const components = await getBillingComponents()

  for (const jenjang of JENJANG_OPTIONS) {
    // Reguler
    const { data: dataReguler } = await supabaseAdmin
      .from("system_settings")
      .select("value")
      .eq("key", `billing_rates_${jenjang.value}`)
      .single()

    if (dataReguler) {
      try {
        rates[jenjang.value] = JSON.parse(dataReguler.value)
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

    // Keringanan
    const { data: dataKeringanan } = await supabaseAdmin
      .from("system_settings")
      .select("value")
      .eq("key", `billing_rates_keringanan_${jenjang.value}`)
      .single()

    if (dataKeringanan) {
      try {
        rates[`keringanan_${jenjang.value}`] = JSON.parse(dataKeringanan.value)
      } catch {
        rates[`keringanan_${jenjang.value}`] = {}
      }
    } else {
      rates[`keringanan_${jenjang.value}`] = {}
    }

    // Ensure all current components exist in the rates (default to 0 if missing)
    components.forEach(comp => {
      if (rates[jenjang.value][comp.key] === undefined) {
        rates[jenjang.value][comp.key] = 0
      }
      if (rates[`keringanan_${jenjang.value}`][comp.key] === undefined) {
        rates[`keringanan_${jenjang.value}`][comp.key] = 0
      }
    })
  }

  return rates
}

export async function generateBulkBills(month: number, year: number) {
  try {
    // 1. Ambil semua santri beserta jenjang dan status biaya
    const { data: students, error: studentError } = await supabaseAdmin
      .from("students")
      .select("id, jenjang, status_biaya, nominal_khusus")
    
    if (studentError) throw studentError
    if (!students || students.length === 0) {
      return { success: false, error: "Tidak ada data santri ditemukan." }
    }

    // 2. Ambil billing rates dari database
    const rates = await getBillingRates()

    // 3. Siapkan data tagihan per santri sesuai jenjang
    const billingData = students.map(s => {
      const jenjang = s.jenjang || 'smp_mts'
      const status_biaya = s.status_biaya || 'reguler'
      
      const targetRateKey = status_biaya === 'keringanan' ? `keringanan_${jenjang}` : jenjang
      const jenjangRates = rates[targetRateKey] || {}
      
      let totalAmount = Object.values(jenjangRates).reduce((sum: number, val) => sum + (Number(val) || 0), 0)
      let status = 'unpaid'

      if (status_biaya === 'gratis') {
        totalAmount = 0
        status = 'paid' // Otomatis lunas/beasiswa jika yatim
      }

      return {
        student_id: s.id,
        month,
        year,
        amount: totalAmount,
        status: status
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
