import { useState } from 'react'
import { User, Mail, Shield, Save, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase, DEMO_MODE } from '../lib/supabase'
import Layout from '../components/layout/Layout'
import Header from '../components/layout/Header'
import Button from '../components/ui/Button'
import { RoleBadge } from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'

export default function Profile() {
  const { user, setUser } = useAuth()
  const [fullName, setFullName] = useState(user?.name || '')
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [error, setError]       = useState('')

  async function handleSave(e) {
    e.preventDefault()
    if (!fullName.trim()) { setError('Name cannot be empty.'); return }
    setSaving(true)
    setError('')

    try {
      if (!DEMO_MODE) {
        const { error: err } = await supabase
          .from('profiles')
          .update({ full_name: fullName.trim() })
          .eq('id', user.id)
        if (err) throw err
      }
      // Update local user state
      setUser(prev => ({ ...prev, name: fullName.trim() }))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout>
      <Header title="My Profile" subtitle="Manage your personal information" />

      <div className="p-6 max-w-xl">
        <div className="card p-6 space-y-6">

          {/* Avatar + current info */}
          <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
            <Avatar user={user} size="lg" />
            <div>
              <p className="text-lg font-semibold text-slate-900">{user?.name}</p>
              <p className="text-sm text-slate-500">{user?.email}</p>
              <div className="mt-1"><RoleBadge role={user?.role} /></div>
            </div>
          </div>

          {/* Edit form */}
          <form onSubmit={handleSave} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}
            {saved && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-4 py-3 flex items-center gap-2">
                <CheckCircle size={16} /> Profile updated successfully!
              </div>
            )}

            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="input-base pl-9"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Dr. John Smith"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">This is the name your team sees in the app.</p>
            </div>

            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="input-base pl-9 bg-slate-50 cursor-not-allowed"
                  value={user?.email || ''}
                  disabled
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">Email cannot be changed here.</p>
            </div>

            <div>
              <label className="label">Role</label>
              <div className="relative">
                <Shield size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="input-base pl-9 bg-slate-50 cursor-not-allowed capitalize"
                  value={user?.role === 'pi' ? 'Principal Investigator' : user?.role === 'admin' ? 'Admin' : 'Student / Resident'}
                  disabled
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">Role is assigned by the admin.</p>
            </div>

            <div className="pt-2">
              <Button type="submit" icon={Save} disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}
