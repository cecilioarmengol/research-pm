import { createContext, useContext, useState, useEffect } from 'react'
import { supabase, DEMO_MODE, mapUser } from '../lib/supabase'
import { DEMO_USERS } from '../lib/mockData'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // ── Demo mode ─────────────────────────────────────────────────────────────
    if (DEMO_MODE) {
      try {
        const stored = localStorage.getItem('rpm_session')
        if (stored) setUser(JSON.parse(stored))
      } catch { /* ignore */ }
      setLoading(false)
      return
    }

    let settled = false
    function done() {
      if (!settled) { settled = true; setLoading(false) }
    }

    // Hard timeout — if Supabase doesn't respond in 6s, show login page
    const timeout = setTimeout(done, 6000)

    // ── Check session once on mount ───────────────────────────────────────────
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (session?.user) return fetchAndSetUser(session.user)
        done()
      })
      .catch(done)   // ← this was missing before; network error → done()
      .finally(() => clearTimeout(timeout))

    // ── Listen for login / logout AFTER initial load ──────────────────────────
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'INITIAL_SESSION') return  // handled by getSession() above
        if (session?.user) {
          fetchAndSetUser(session.user)
        } else {
          setUser(null)
          done()
        }
      }
    )

    return () => {
      settled = true
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  // Fetch profile row; fall back to session user data if the table is unreachable
  async function fetchAndSetUser(sessionUser) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionUser.id)
        .single()

      if (data) {
        setUser(mapUser(data))
        setLoading(false)
        return
      }

      // No profile row yet — try to create one
      const profile = {
        id:        sessionUser.id,
        email:     sessionUser.email,
        full_name: sessionUser.user_metadata?.full_name || sessionUser.email.split('@')[0],
        role:      sessionUser.user_metadata?.role || 'student',
      }
      const { data: created } = await supabase
        .from('profiles').upsert(profile).select().single()

      setUser(created ? mapUser(created) : sessionFallback(sessionUser))
    } catch {
      // Profile table unreachable — still log the user in using session data
      setUser(sessionFallback(sessionUser))
    } finally {
      setLoading(false)
    }
  }

  function sessionFallback(sessionUser) {
    const name = sessionUser.user_metadata?.full_name
      || sessionUser.email.split('@')[0]
    return {
      id:       sessionUser.id,
      email:    sessionUser.email,
      name,
      role:     sessionUser.user_metadata?.role || 'student',
      initials: name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
    }
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
    // onAuthStateChange SIGNED_IN will call fetchAndSetUser automatically
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
    <AuthContext.Provider value={{ user, loading, login, logout, setUser, isDemo: DEMO_MODE }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
