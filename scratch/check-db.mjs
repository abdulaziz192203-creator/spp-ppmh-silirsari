import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkData() {
  const { data: methods, error: mError } = await supabase.from('payment_methods').select('*')
  console.log('Payment Methods:', methods)
  if (mError) console.error('Methods Error:', mError)

  const { data: payments, error: pError } = await supabase.from('payments').select('*').limit(5)
  console.log('Sample Payments:', payments)
  if (pError) console.error('Payments Error:', pError)
}

checkData()
