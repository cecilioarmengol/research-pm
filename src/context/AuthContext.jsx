import { createContext, useContext, useState, useEffect } from 'react'
import { supabase, DEMO_MODE, mapUser } from '../lib/supabase'
import { DEMO_USERS } from '../lib/mockData'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (DEMO_MODE) {
      try {
        const stored = localStorage.getItem('rpm_session')
        if (stored) setUser(JSON.parse(stored))
      } catch { /* ignore */ }
      setLoading(false)
      return
    }

    // Supabase: check existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) await fetchProfile(session.user.id)
      else setLoading(false)
    })

    // Listen for login / logout events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) await fetchProfile(session.user.id)
      else { setUser(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (data) {
      setUser(mapUser(data))
    } else {
      // Profile doesn't exist yet — create it automatically
      const { data: auth } = await supabase.auth.getUser()
      if (auth?.user) {
        const profile = {
          id:        auth.user.id,
          email:     auth.user.email,
          full_name: auth.user.user_metadata?.full_name || auth.user.email.split('@')[0],
          role:      auth.user.user_metadata?.role || 'student',
        }
        const { data: created } = await supabase.from('profiles').upsert(profile).select().single()
        if (created) setUser(mapUser(created))
      }
    }
    setLoading(false)
  }

  async function login(email, password) {
    if (DEMO_MODE) {
      const found = DEMO_USERS.find(
        u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      )
      if (!found) return { error: 'Invalid email or password.' }
      const { password: _pw, ...safeUser } = found
      setUser(safeUser)
      localStorage.setItem('rpm_session', JSON.stringify(safeUser))
      return { user: safeUser }
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return { user: data.user }
  }

  async function logout() {
    if (DEMO_MODE) {
      setUser(null)
      localStorage.removeItem('rpm_session')
      return
    }
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isDemo: DEMO_MODE }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
