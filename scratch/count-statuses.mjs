import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkStatusCounts() {
  const { data, error } = await supabase
    .from('payments')
    .select('status')
  
  if (error) {
    console.error('Error fetching payments:', error)
    return
  }

  const counts = data.reduce((acc, curr) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1
    return acc
  }, {})

  console.log('Payment Status Counts:', counts)
}

checkStatusCounts()
