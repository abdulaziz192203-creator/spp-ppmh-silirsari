import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

if (supabaseUrl.includes('placeholder') || supabaseAnonKey === 'placeholder') {
	// Provide a clear console message for developers when env vars are missing
	// This avoids silent network failures like "Failed to fetch" in the UI.
	// Do NOT include real keys here. Users must set `.env.local` or hosting env vars.
	// eslint-disable-next-line no-console
	console.warn(
		'[supabase] Environment not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local or on your hosting platform.'
	)
}

export const isSupabaseConfigured = Boolean(
	supabaseUrl && !supabaseUrl.includes('placeholder') && supabaseAnonKey && supabaseAnonKey !== 'placeholder'
)

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
