// Script Debug & Fix: Identifikasi masalah lalu buat akun
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cixchxruswbqudcazmfd.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpeGNoeHJ1c3dicXVkY2F6bWZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU0ODYxOSwiZXhwIjoyMDkxMTI0NjE5fQ.lLRYgXRzNLWanjNsMomBdtchyYakzmhEYjFX-kPzNm0'

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function debug() {
  console.log('=== DIAGNOSA SISTEM ===\n')

  // 1. Cek tabel profiles
  console.log('[1] Cek tabel profiles...')
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('*')
  if (pErr) {
    console.log('   MASALAH: ' + pErr.message)
    console.log('   KODE: ' + pErr.code)
    console.log('   DETAIL: ' + pErr.details)
  } else {
    console.log('   OK: ' + (profiles?.length || 0) + ' profil ditemukan')
    if (profiles?.length) console.log('   Data:', JSON.stringify(profiles, null, 2))
  }

  // 2. Cek tabel students
  console.log('\n[2] Cek tabel students...')
  const { data: students, error: sErr } = await supabase.from('students').select('*')
  if (sErr) {
    console.log('   MASALAH: ' + sErr.message)
    console.log('   KODE: ' + sErr.code)
  } else {
    console.log('   OK: ' + (students?.length || 0) + ' santri ditemukan')
  }

  // 3. Cek tabel payments
  console.log('\n[3] Cek tabel payments...')
  const { data: payments, error: pmErr } = await supabase.from('payments').select('*')
  if (pmErr) {
    console.log('   MASALAH: ' + pmErr.message)
    console.log('   KODE: ' + pmErr.code)
  } else {
    console.log('   OK: ' + (payments?.length || 0) + ' pembayaran ditemukan')
  }

  // 4. Cek users yang sudah ada
  console.log('\n[4] Cek auth users...')
  const { data: usersData, error: uErr } = await supabase.auth.admin.listUsers()
  if (uErr) {
    console.log('   MASALAH: ' + uErr.message)
  } else {
    const users = usersData?.users || []
    console.log('   OK: ' + users.length + ' user ditemukan')
    for (const u of users) {
      console.log('   - ' + u.email + ' (ID: ' + u.id + ')')
    }
  }

  // 5. Coba buat test user untuk identifikasi error detail
  console.log('\n[5] Test membuat user baru...')
  const testEmail = 'test_' + Date.now() + '@test.com'
  const { data: testUser, error: testErr } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: 'test123456',
    email_confirm: true
  })
  
  if (testErr) {
    console.log('   GAGAL: ' + testErr.message)
    console.log('   STATUS: ' + testErr.status)
    console.log('   FULL ERROR: ' + JSON.stringify(testErr, null, 2))
  } else {
    console.log('   BERHASIL membuat test user: ' + testEmail)
    // Hapus test user
    await supabase.auth.admin.deleteUser(testUser.user.id)
    console.log('   Test user dihapus.')
  }

  console.log('\n=== DIAGNOSA SELESAI ===\n')
}

debug().catch(e => console.error('Fatal:', e))
