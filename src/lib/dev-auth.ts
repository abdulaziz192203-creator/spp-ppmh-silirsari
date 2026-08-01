// Simple dev-only auth helper. ONLY used when Supabase env is not configured.
// Stores a small session in localStorage under `DEV_SESSION`.

type DevSession = {
  id: string
  role: 'parent' | 'admin' | 'pimpinan'
  full_name?: string
  nisn?: string
}

const DEV_KEY = 'DEV_SESSION'

export const devAuth = {
  signIn: async (role: string, identifier: string, password: string) => {
    // Accept a few developer-friendly credentials. Customize as needed.
    const r = role as 'parent' | 'admin' | 'pimpinan'
    if (r === 'admin' && identifier === 'admin@ppmh.id' && password === 'admin') {
      const s: DevSession = { id: 'dev-admin-1', role: 'admin', full_name: 'Admin Dev' }
      localStorage.setItem(DEV_KEY, JSON.stringify(s))
      return { user: { id: s.id } }
    }
    if (r === 'pimpinan' && identifier === 'pimpinan@ppmh.id' && password === 'pimpinan') {
      const s: DevSession = { id: 'dev-pimpinan-1', role: 'pimpinan', full_name: 'Pimpinan Dev' }
      localStorage.setItem(DEV_KEY, JSON.stringify(s))
      return { user: { id: s.id } }
    }
    if (r === 'parent' && /^[0-9]+$/.test(identifier) && password === 'santri') {
      const s: DevSession = { id: `dev-parent-${identifier}`, role: 'parent', full_name: 'Wali Dev', nisn: identifier }
      localStorage.setItem(DEV_KEY, JSON.stringify(s))
      return { user: { id: s.id } }
    }
    throw new Error('Credensial dev tidak cocok. Gunakan kredensial dev (lihat README).')
  },
  getSession: async () => {
    const raw = localStorage.getItem(DEV_KEY)
    if (!raw) return { session: null }
    try {
      const s: DevSession = JSON.parse(raw)
      return { session: { user: { id: s.id }, user_metadata: { role: s.role, full_name: s.full_name, nisn: s.nisn } } }
    } catch (e) {
      return { session: null }
    }
  },
  getUser: async () => {
    const raw = localStorage.getItem(DEV_KEY)
    if (!raw) return { data: { user: null } }
    try {
      const s: DevSession = JSON.parse(raw)
      return { data: { user: { id: s.id } } }
    } catch (e) {
      return { data: { user: null } }
    }
  },
  signOut: async () => {
    localStorage.removeItem(DEV_KEY)
    return
  },
  getProfile: () => {
    const raw = localStorage.getItem(DEV_KEY)
    if (!raw) return null
    try { return JSON.parse(raw) } catch (e) { return null }
  }
}
