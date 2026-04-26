import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FlaskConical, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'

const DEMO_ACCOUNTS = [
  { email: 'admin@research.edu',  role: 'Admin (Dr. Sarah Chen)',          password: 'demo123' },
  { email: 'pi@research.edu',     role: 'PI (Dr. Michael Roberts)',        password: 'demo123' },
  { email: 'john@research.edu',   role: 'Student (John Smith)',            password: 'demo123' },
  { email: 'emma@research.edu',   role: 'Resident (Emma Johnson)',         password: 'demo123' },
  { email: 'carlos@research.edu', role: 'Student (Carlos Rivera)',         password: 'demo123' },
]

export default function Login() {
  const { login }      = useAuth()
  const navigate       = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 300))
    const result = login(email, password)
    setLoading(false)
    if (result.error) { setError(result.error); return }
    navigate('/')
  }

  function quickLogin(acc) {
    setEmail(acc.email)
    setPassword(acc.password)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-brand-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-500 rounded-2xl mb-4 shadow-xl">
            <FlaskConical size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">ResearchFlow</h1>
          <p className="text-slate-400 mt-1">Clinical Research Project Management</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Sign in to your account</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email" required
                className="input-base"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@research.edu"
                autoFocus
              />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} required
                  className="input-base pr-10"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full justify-center" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-500 font-medium mb-3 text-center uppercase tracking-wide">
              Demo Accounts — click to auto-fill
            </p>
            <div className="space-y-1.5">
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.email}
                  onClick={() => quickLogin(acc)}
                  className="w-full text-left px-3 py-2.5 rounded-lg border border-slate-100 hover:border-brand-200 hover:bg-brand-50 transition-colors group"
                >
                  <span className="text-sm font-medium text-slate-700 group-hover:text-brand-700">{acc.role}</span>
                  <span className="text-xs text-slate-400 ml-2">{acc.email}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-center text-slate-400 mt-3">All demo accounts use password: <code className="bg-slate-100 px-1 rounded">demo123</code></p>
          </div>
        </div>
      </div>
    </div>
  )
}
