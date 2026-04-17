// Script untuk membuat akun Admin + data contoh santri secara otomatis
// Jalankan dengan: npx tsx scripts/seed.ts

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cixchxruswbqudcazmfd.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpeGNoeHJ1c3dicXVkY2F6bWZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU0ODYxOSwiZXhwIjoyMDkxMTI0NjE5fQ.lLRYgXRzNLWanjNsMomBdtchyYakzmhEYjFX-kPzNm0'

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function seed() {
  console.log('🚀 Memulai setup data awal...\n')

  // ============================================
  // 1. BUAT AKUN ADMIN
  // ============================================
  console.log('👤 Membuat akun Admin...')
  const { data: adminAuth, error: adminAuthError } = await supabase.auth.admin.createUser({
    email: 'admin@ppmh.id',
    password: 'admin123',
    email_confirm: true,
    user_metadata: {
      full_name: 'Administrator PPMH',
      role: 'admin'
    }
  })

  if (adminAuthError) {
    if (adminAuthError.message.includes('already been registered')) {
      console.log('   ℹ️  Akun admin sudah ada, lanjut...')
    } else {
      console.error('   ❌ Error membuat admin:', adminAuthError.message)
      return
    }
  } else {
    console.log('   ✅ Akun Admin berhasil dibuat!')
    // Update role to admin
    await supabase.from('profiles').update({ role: 'admin' }).eq('id', adminAuth.user.id)
    console.log('   ✅ Role Admin berhasil diset!')
  }

  // ============================================
  // 2. BUAT SANTRI CONTOH + AKUN ORANG TUA
  // ============================================
  const santriList = [
    { name: 'Ahmad Santriawan', nisn: '0012345', class_room: '7-A', address: 'Silir Sari, Banyuwangi' },
    { name: 'Fatimah Azzahra', nisn: '0012346', class_room: '7-B', address: 'Genteng, Banyuwangi' },
    { name: 'Muhammad Rizki', nisn: '0012347', class_room: '8-A', address: 'Rogojampi, Banyuwangi' },
  ]

  for (const santri of santriList) {
    console.log(`\n📚 Mendaftarkan santri: ${santri.name}...`)
    
    // Create parent auth account
    const loginEmail = `${santri.nisn}@spp-ppmh.id`
    const loginPassword = `santri${santri.nisn}`

    const { data: parentAuth, error: parentAuthError } = await supabase.auth.admin.createUser({
      email: loginEmail,
      password: loginPassword,
      email_confirm: true,
      user_metadata: {
        full_name: `Orang Tua ${santri.name}`,
        role: 'parent',
        nisn: santri.nisn
      }
    })

    if (parentAuthError) {
      if (parentAuthError.message.includes('already been registered')) {
        console.log(`   ℹ️  Akun ${santri.nisn} sudah ada, skip...`)
        continue
      }
      console.error(`   ❌ Error:`, parentAuthError.message)
      continue
    }

    console.log(`   ✅ Akun login berhasil (NISN: ${santri.nisn})`)

    // Create student record
    const { error: studentError } = await supabase.from('students').insert([{
      name: santri.name,
      nisn: santri.nisn,
      class_room: santri.class_room,
      address: santri.address,
      parent_id: parentAuth.user.id
    }])

    if (studentError) {
      console.error(`   ❌ Error data santri:`, studentError.message)
      continue
    }
    console.log(`   ✅ Data santri berhasil disimpan!`)

    // Get student ID for payments
    const { data: studentData } = await supabase
      .from('students')
      .select('id')
      .eq('nisn', santri.nisn)
      .single()

    if (studentData) {
      // Create sample payments
      await supabase.from('payments').insert([
        { student_id: studentData.id, month: 1, year: 2026, amount: 250000, status: 'paid', verified_at: new Date().toISOString() },
        { student_id: studentData.id, month: 2, year: 2026, amount: 250000, status: 'paid', verified_at: new Date().toISOString() },
        { student_id: studentData.id, month: 3, year: 2026, amount: 250000, status: 'pending', proof_url: 'https://placehold.co/300x400?text=Bukti+Transfer' },
        { student_id: studentData.id, month: 4, year: 2026, amount: 250000, status: 'unpaid' },
      ])
      console.log(`   ✅ Tagihan contoh berhasil dibuat!`)
    }
  }

  // ============================================
  // 3. RANGKUMAN
  // ============================================
  console.log('\n')
  console.log('═══════════════════════════════════════════')
  console.log('  ✅ SETUP SELESAI! SISTEM SIAP DIGUNAKAN')
  console.log('═══════════════════════════════════════════')
  console.log('')
  console.log('  📋 AKUN LOGIN:')
  console.log('  ─────────────────────────────────────────')
  console.log('  🔑 ADMIN:')
  console.log('     Email    : admin@ppmh.id')
  console.log('     Password : admin123')
  console.log('')
  console.log('  🔑 ORANG TUA (Contoh):')
  console.log('     NISN     : 0012345')
  console.log('     Password : santri0012345')
  console.log('')
  console.log('     NISN     : 0012346')
  console.log('     Password : santri0012346')
  console.log('')
  console.log('     NISN     : 0012347')
  console.log('     Password : santri0012347')
  console.log('═══════════════════════════════════════════')
  console.log('')
  console.log('  🌐 Buka: http://localhost:3000')
  console.log('')
}

seed().catch(console.error)
