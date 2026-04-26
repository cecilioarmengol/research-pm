import { useState } from 'react'
import { Plus, Trash2, Edit2, Eye, EyeOff } from 'lucide-react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { supabase, DEMO_MODE } from '../lib/supabase'
import Layout from '../components/layout/Layout'
import Header from '../components/layout/Header'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { RoleBadge } from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'

// ── User form ─────────────────────────────────────────────────────────────────
function UserForm({ initial, onClose, onSave, saving, error: outerError }) {
  const isEdit = !!initial
  const [form, setForm]         = useState(initial || { name: '', email: '', role: 'student', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [localError, setLocalError] = useState('')

  const error = localError || outerError

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function submit(e) {
    e.preventDefault()
    setLocalError('')
    if (!form.name.trim() || !form.email.trim()) { setLocalError('Name and email are required.'); return }
    if (!isEdit && !DEMO_MODE && !form.password.trim()) { setLocalError('A temporary password is required.'); return }
    if (!isEdit && !DEMO_MODE && form.password.length < 6) { setLocalError('Password must be at least 6 characters.'); return }
    onSave({
      ...form,
      name: form.name.trim(),
      initials: form.name.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
    })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <div>
        <label className="label">Full Name *</label>
        <input
          className="input-base"
          value={form.name}
          onChange={e => set('name', e.target.value)}
          placeholder="Dr. Jane Smith"
          autoFocus
        />
      </div>

      <div>
        <label className="label">Email *</label>
        <input
          type="email"
          className={`input-base ${isEdit ? 'bg-slate-50 cursor-not-allowed' : ''}`}
          value={form.email}
          onChange={e => set('email', e.target.value)}
          placeholder="jane@research.edu"
          disabled={isEdit}
        />
        {isEdit && <p className="text-xs text-slate-400 mt-1">Email cannot be changed after account creation.</p>}
      </div>

      <div>
        <label className="label">Role</label>
        <select className="input-base" value={form.role} onChange={e => set('role', e.target.value)}>
          <option value="student">Student / Resident</option>
          <option value="pi">Principal Investigator</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Password — only when creating a new user in production */}
      {!isEdit && !DEMO_MODE && (
        <div>
          <label className="label">Temporary Password *</label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              className="input-base pr-10"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              placeholder="Min. 6 characters"
            />
            <button
              type="button"
              onClick={() => setShowPass(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Share this with the team member — they can change their name in Profile after logging in.
          </p>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
        <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Account'}
        </Button>
      </div>
    </form>
  )
}

// ── Admin page ────────────────────────────────────────────────────────────────
export default function Admin() {
  const { users, projects, dispatch, loadUsers } = useData()
  const { user: currentUser }    = useAuth()
  const [showForm, setShowForm]  = useState(false)
  const [editUser, setEditUser]  = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [saving, setSaving]      = useState(false)
  const [formError, setFormError] = useState('')
  const [deleteError, setDeleteError] = useState('')

  if (currentUser?.role !== 'admin') {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96 text-slate-400">
          <p>Access restricted to administrators.</p>
        </div>
      </Layout>
    )
  }

  // Call the Edge Function (production only)
  async function callAdminApi(action, data) {
    const { data: result, error } = await supabase.functions.invoke('admin-users', {
      body: { action, ...data },
    })
    if (error) throw new Error(error.message)
    if (result?.error) throw new Error(result.error)
    return result
  }

  async function handleSave(userData) {
    setFormError('')

    // ── Demo mode ──────────────────────────────────────────────────────────
    if (DEMO_MODE) {
      if (editUser) {
        dispatch({ type: 'UPDATE_USER', payload: { ...userData, id: editUser.id } })
      } else {
        dispatch({ type: 'ADD_USER', payload: userData })
      }
      closeForm()
      return
    }

    // ── Production mode ────────────────────────────────────────────────────
    setSaving(true)
    try {
      if (editUser) {
        await callAdminApi('update', {
          userId:    editUser.id,
          full_name: userData.name,
          role:      userData.role,
        })
      } else {
        await callAdminApi('create', {
          email:     userData.email,
          password:  userData.password,
          full_name: userData.name,
          role:      userData.role,
        })
      }
      closeForm()
      // Real-time subscription updates users list automatically
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(u) {
    setDeleteError('')

    if (DEMO_MODE) {
      dispatch({ type: 'DELETE_USER', payload: { id: u.id } })
      setDeleteConfirm(null)
      return
    }

    setSaving(true)
    try {
      await callAdminApi('delete', { userId: u.id })
      setDeleteConfirm(null)
    } catch (err) {
      setDeleteError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function closeForm() {
    setShowForm(false)
    setEditUser(null)
    setFormError('')
  }

  return (
    <Layout>
      <Header
        title="Team & Users"
        subtitle={`${users.length} team member${users.length !== 1 ? 's' : ''}`}
        actions={
          <Button icon={Plus} size="sm" onClick={() => { setEditUser(null); setFormError(''); setShowForm(true) }}>
            Add User
          </Button>
        }
      />

      <div className="p-4 md:p-6 max-w-4xl space-y-6">

        {/* User table */}
        <div className="card overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Member</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Projects</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => {
                const userProjects   = projects.filter(p => p.assignedTo === u.id)
                const activeProjects = userProjects.filter(p => p.status === 'in_progress').length

                return (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar user={u} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-slate-800">{u.name}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                        {u.id === currentUser.id && (
                          <span className="text-xs bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded-full font-medium">You</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><RoleBadge role={u.role} /></td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">
                      {userProjects.length} total · {activeProjects} active
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                        <Button
                          variant="ghost" size="xs" icon={Edit2}
                          onClick={() => { setEditUser(u); setFormError(''); setShowForm(true) }}
                          title="Edit user"
                        />
                        {u.id !== currentUser.id && (
                          <Button
                            variant="ghost" size="xs" icon={Trash2}
                            onClick={() => { setDeleteError(''); setDeleteConfirm(u) }}
                            title="Remove user"
                            className="hover:text-red-500"
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Admins',   value: users.filter(u => u.role === 'admin').length,   color: 'text-brand-600'  },
            { label: 'PIs',      value: users.filter(u => u.role === 'pi').length,      color: 'text-purple-600' },
            { label: 'Students', value: users.filter(u => u.role === 'student').length, color: 'text-teal-600'   },
          ].map(({ label, value, color }) => (
            <div key={label} className="card p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-sm text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Project assignments */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Project Assignments</h3>
          <div className="space-y-3">
            {users.filter(u => u.role === 'student').map(u => {
              const ups = projects.filter(p => p.assignedTo === u.id)
              if (!ups.length) return null
              return (
                <div key={u.id} className="flex items-start gap-4">
                  <div className="flex items-center gap-2 w-40 shrink-0">
                    <Avatar user={u} size="xs" />
                    <span className="text-xs text-slate-600 font-medium truncate">{u.name}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {ups.map(p => (
                      <span
                        key={p.id}
                        className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{
                          backgroundColor: p.status === 'delayed' ? '#fee2e2' : p.status === 'completed' ? '#d1fae5' : '#e0e7ff',
                          color: p.status === 'delayed' ? '#b91c1c' : p.status === 'completed' ? '#047857' : '#4338ca',
                        }}
                      >
                        {p.title.split(':')[0]}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Add / Edit modal */}
      <Modal
        isOpen={showForm}
        onClose={closeForm}
        title={editUser ? 'Edit Team Member' : 'Add Team Member'}
        size="sm"
      >
        <UserForm
          initial={editUser ? { name: editUser.name, email: editUser.email, role: editUser.role } : null}
          onClose={closeForm}
          onSave={handleSave}
          saving={saving}
          error={formError}
        />
      </Modal>

      {/* Delete confirmation modal */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Remove User" size="sm">
        {deleteError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">{deleteError}</p>}
        <p className="text-sm text-slate-600 mb-6">
          Remove <strong>{deleteConfirm?.name}</strong> from the team? This will delete their login account permanently.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)} disabled={saving}>Cancel</Button>
          <Button variant="danger" onClick={() => handleDelete(deleteConfirm)} disabled={saving}>
            {saving ? 'Removing…' : 'Remove User'}
          </Button>
        </div>
      </Modal>
    </Layout>
  )
}
