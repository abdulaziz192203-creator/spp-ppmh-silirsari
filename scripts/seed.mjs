// Script seed yang lebih robust
// Membuat user DAN profil secara manual (tanpa bergantung pada trigger)
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cixchxruswbqudcazmfd.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpeGNoeHJ1c3dicXVkY2F6bWZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU0ODYxOSwiZXhwIjoyMDkxMTI0NjE5fQ.lLRYgXRzNLWanjNsMomBdtchyYakzmhEYjFX-kPzNm0'

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function createUserWithProfile(email, password, role, fullName, nisn) {
  // Step 1: Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true
  })

  if (authError) {
    if (authError.message.includes('already been registered')) {
      console.log('   INFO: Akun ' + email + ' sudah ada, skip...')
      // Get existing user
      const { data: users } = await supabase.auth.admin.listUsers()
      const existing = users?.users?.find(u => u.email === email)
      return existing || null
    }
    console.error('   ERROR auth:', authError.message)
    return null
  }

  console.log('   OK: Auth user berhasil dibuat (' + email + ')')

  // Step 2: MANUALLY create profile (bypass trigger)
  const profileData = { id: authData.user.id, role: role, full_name: fullName }
  if (nisn) profileData.nisn = nisn

  const { error: profileError } = await supabase.from('profiles').upsert([profileData])
  
  if (profileError) {
    console.error('   ERROR profil:', profileError.message)
  } else {
    console.log('   OK: Profil berhasil dibuat (role: ' + role + ')')
  }

  return authData.user
}

async function seed() {
  console.log('=== MEMULAI SETUP DATA AWAL ===\n')

  // ============================================
  // 1. BUAT AKUN ADMIN
  // ============================================
  console.log('[1/4] Membuat akun Admin...')
  const admin = await createUserWithProfile('admin@ppmh.id', 'admin123', 'admin', 'Administrator PPMH', null)

  // ============================================
  // 2. BUAT SANTRI + AKUN ORANG TUA
  // ============================================
  const santriList = [
    { name: 'Ahmad Santriawan', nisn: '0012345', class_room: '7-A', address: 'Silir Sari, Banyuwangi' },
    { name: 'Fatimah Azzahra', nisn: '0012346', class_room: '7-B', address: 'Genteng, Banyuwangi' },
    { name: 'Muhammad Rizki', nisn: '0012347', class_room: '8-A', address: 'Rogojampi, Banyuwangi' },
  ]

  for (let i = 0; i < santriList.length; i++) {
    const santri = santriList[i]
    console.log('\n[' + (i + 2) + '/4] Mendaftarkan: ' + santri.name + '...')
    
    const loginEmail = santri.nisn + '@spp-ppmh.id'
    const loginPassword = 'santri' + santri.nisn

    const parent = await createUserWithProfile(loginEmail, loginPassword, 'parent', 'Orang Tua ' + santri.name, santri.nisn)
    if (!parent) continue

    // Create student record
    const { error: studentError } = await supabase.from('students').upsert([{
      name: santri.name,
      nisn: santri.nisn,
      class_room: santri.class_room,
      address: santri.address,
      parent_id: parent.id
    }], { onConflict: 'nisn' })

    if (studentError) {
      console.error('   ERROR data santri:', studentError.message)
      continue
    }
    console.log('   OK: Data santri disimpan!')

    // Get student ID
    const { data: studentData } = await supabase
      .from('students').select('id').eq('nisn', santri.nisn).single()

    if (studentData) {
      // Check if payments already exist
      const { count } = await supabase.from('payments')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', studentData.id)

      if (count === 0) {
        await supabase.from('payments').insert([
          { student_id: studentData.id, month: 1, year: 2026, amount: 250000, status: 'paid', verified_at: new Date().toISOString() },
          { student_id: studentData.id, month: 2, year: 2026, amount: 250000, status: 'paid', verified_at: new Date().toISOString() },
          { student_id: studentData.id, month: 3, year: 2026, amount: 250000, status: 'pending', proof_url: 'https://placehold.co/300x400?text=Bukti+Transfer' },
          { student_id: studentData.id, month: 4, year: 2026, amount: 250000, status: 'unpaid' },
        ])
        console.log('   OK: Tagihan contoh dibuat!')
      } else {
        console.log('   INFO: Tagihan sudah ada, skip...')
      }
    }
  }

  // ============================================
  // RANGKUMAN
  // ============================================
  console.log('\n')
  console.log('===================================================')
  console.log('      SETUP SELESAI! SISTEM SIAP DIGUNAKAN')
  console.log('===================================================')
  console.log('')
  console.log('  AKUN LOGIN ADMIN:')
  console.log('  - Pilih tab "Admin" di halaman login')
  console.log('  - Email    : admin@ppmh.id')
  console.log('  - Password : admin123')
  console.log('')
  console.log('  AKUN LOGIN ORANG TUA:')
  console.log('  - Pilih tab "Orang Tua" di halaman login')
  console.log('  - NISN: 0012345  |  Password: santri0012345')
  console.log('  - NISN: 0012346  |  Password: santri0012346')
  console.log('  - NISN: 0012347  |  Password: santri0012347')
  console.log('===================================================')
  console.log('')
  console.log('  Buka: http://localhost:3000')
  console.log('')
}

seed().catch(console.error)
