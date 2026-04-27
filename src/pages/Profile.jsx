import { useState } from 'react'
import { User, Mail, Shield, Save, CheckCircle, Lock, Eye, EyeOff, Building2, BadgeCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase, DEMO_MODE } from '../lib/supabase'
import Layout from '../components/layout/Layout'
import Header from '../components/layout/Header'
import Button from '../components/ui/Button'
import { RoleBadge } from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'

export default function Profile() {
  const { user, setUser } = useAuth()

  // ── Profile form ───────────────────────────────────────────────────────────
  const [fullName,    setFullName]    = useState(user?.name        || '')
  const [orcid,       setOrcid]       = useState(user?.orcid       || '')
  const [affiliation, setAffiliation] = useState(user?.affiliation || '')
  const [saving, setSaving]           = useState(false)
  const [saved, setSaved]             = useState(false)
  const [error, setError]             = useState('')

  async function handleSave(e) {
    e.preventDefault()
    if (!fullName.trim()) { setError('Name cannot be empty.'); return }
    setSaving(true)
    setError('')
    try {
      if (!DEMO_MODE) {
        const { error: err } = await supabase
          .from('profiles')
          .update({
            full_name:   fullName.trim(),
            orcid:       orcid.trim()       || null,
            affiliation: affiliation.trim() || null,
          })
          .eq('id', user.id)
        if (err) throw err
      }
      setUser(prev => ({ ...prev, name: fullName.trim(), orcid: orcid.trim(), affiliation: affiliation.trim() }))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // ── Password form ──────────────────────────────────────────────────────────
  const [newPassword, setNewPassword]     = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew]             = useState(false)
  const [showConfirm, setShowConfirm]     = useState(false)
  const [pwSaving, setPwSaving]           = useState(false)
  const [pwSaved, setPwSaved]             = useState(false)
  const [pwError, setPwError]             = useState('')

  async function handlePasswordChange(e) {
    e.preventDefault()
    setPwError('')
    if (newPassword.length < 6)              { setPwError('Password must be at least 6 characters.'); return }
    if (newPassword !== confirmPassword)     { setPwError('Passwords do not match.'); return }

    if (DEMO_MODE) {
      setPwSaved(true)
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPwSaved(false), 3000)
      return
    }

    setPwSaving(true)
    try {
      const { error: err } = await supabase.auth.updateUser({ password: newPassword })
      if (err) throw err
      setPwSaved(true)
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPwSaved(false), 3000)
    } catch (err) {
      setPwError(err.message || 'Failed to update password.')
    } finally {
      setPwSaving(false)
    }
  }

  return (
    <Layout>
      <Header title="My Profile" subtitle="Manage your personal information" />

      <div className="p-4 md:p-6 max-w-xl space-y-6">

        {/* ── Profile card ── */}
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

          {/* Name + info form */}
          <form onSubmit={handleSave} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
            )}
            {saved && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-4 py-3 flex items-center gap-2">
                <CheckCircle size={16} /> Profile updated!
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
                <input className="input-base pl-9 bg-slate-50 cursor-not-allowed" value={user?.email || ''} disabled />
              </div>
              <p className="text-xs text-slate-400 mt-1">Email cannot be changed here.</p>
            </div>

            <div>
              <label className="label">Role</label>
              <div className="relative">
                <Shield size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="input-base pl-9 bg-slate-50 cursor-not-allowed capitalize"
                  value={
                    user?.role === 'pi'              ? 'Principal Investigator' :
                    user?.role === 'admin'           ? 'Admin' :
                    user?.role === 'research_fellow' ? 'Research Fellow' :
                                                       'Student / Resident'
                  }
                  disabled
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">Role is assigned by the admin.</p>
            </div>

            <div>
              <label className="label">Affiliation</label>
              <div className="relative">
                <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="input-base pl-9"
                  value={affiliation}
                  onChange={e => setAffiliation(e.target.value)}
                  placeholder="e.g. Johns Hopkins Hospital, Dept. of Neurosurgery"
                />
              </div>
            </div>

            <div>
              <label className="label">ORCID iD</label>
              <div className="relative">
                <BadgeCheck size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="input-base pl-9"
                  value={orcid}
                  onChange={e => setOrcid(e.target.value)}
                  placeholder="e.g. 0000-0002-1825-0097"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Your 16-digit ORCID identifier. Find it at{' '}
                <a href="https://orcid.org" target="_blank" rel="noreferrer" className="text-brand-500 hover:underline">orcid.org</a>
              </p>
            </div>

            <div className="pt-2">
              <Button type="submit" icon={Save} disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>

        {/* ── Change password card ── */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Lock size={15} className="text-slate-400" /> Change Password
          </h2>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            {pwError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{pwError}</div>
            )}
            {pwSaved && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-4 py-3 flex items-center gap-2">
                <CheckCircle size={16} /> Password updated successfully!
              </div>
            )}

            <div>
              <label className="label">New Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showNew ? 'text' : 'password'}
                  className="input-base pl-9 pr-10"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                />
                <button type="button" onClick={() => setShowNew(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label className="label">Confirm New Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  className="input-base pl-9 pr-10"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" icon={Lock} disabled={pwSaving}>
                {pwSaving ? 'Updating…' : 'Update Password'}
              </Button>
            </div>
          </form>
        </div>

      </div>
    </Layout>
  )
}
