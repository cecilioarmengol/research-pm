import { createContext, useContext, useState, useEffect } from 'react'
import { DEMO_USERS } from '../lib/mockData'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('rpm_session')
      if (stored) setUser(JSON.parse(stored))
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  function login(email, password) {
    const found = DEMO_USERS.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    )
    if (!found) return { error: 'Invalid email or password.' }
    const { password: _pw, ...safeUser } = found
    setUser(safeUser)
    localStorage.setItem('rpm_session', JSON.stringify(safeUser))
    return { user: safeUser }
  }

  function logout() {
    setUser(null)
    localStorage.removeItem('rpm_session')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
