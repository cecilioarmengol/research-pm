import { useState } from 'react'
import { Plus, Trash2, Edit2, UserCheck } from 'lucide-react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/layout/Layout'
import Header from '../components/layout/Header'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { RoleBadge } from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import { DEMO_USERS } from '../lib/mockData'

const EMPTY_USER = { name: '', email: '', role: 'student', initials: '' }

function UserForm({ initial, onClose, onSave }) {
  const [form, setForm] = useState(initial || EMPTY_USER)
  const [error, setError] = useState('')

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function submit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) { setError('Name and email are required.'); return }
    onSave({ ...form, initials: form.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) })
    onClose()
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      <div>
        <label className="label">Full Name *</label>
        <input className="input-base" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Dr. Jane Smith" />
      </div>
      <div>
        <label className="label">Email *</label>
        <input type="email" className="input-base" value={form.email} onChange={e => set('email', e.target.value)} placeholder="jane@research.edu" />
      </div>
      <div>
        <label className="label">Role</label>
        <select className="input-base" value={form.role} onChange={e => set('role', e.target.value)}>
          <option value="student">Student / Resident</option>
          <option value="pi">Principal Investigator</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="primary">{initial ? 'Save Changes' : 'Add User'}</Button>
      </div>
    </form>
  )
}

export default function Admin() {
  const { users, projects, dispatch } = useData()
  const { user: currentUser }         = useAuth()
  const [showForm, setShowForm]       = useState(false)
  const [editUser, setEditUser]       = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  if (currentUser?.role !== 'admin') {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96 text-slate-400">
          <p>Access restricted to administrators.</p>
        </div>
      </Layout>
    )
  }

  function handleSave(userData) {
    if (editUser) {
      dispatch({ type: 'UPDATE_USER', payload: { ...userData, id: editUser.id } })
    } else {
      dispatch({ type: 'ADD_USER', payload: userData })
    }
  }

  function handleDelete(u) {
    dispatch({ type: 'DELETE_USER', payload: { id: u.id } })
    setDeleteConfirm(null)
  }

  const isDemoUser = (u) => DEMO_USERS.some(d => d.id === u.id)

  return (
    <Layout>
      <Header
        title="Team & Users"
        subtitle={`${users.length} team member${users.length !== 1 ? 's' : ''}`}
        actions={
          <Button icon={Plus} size="sm" onClick={() => { setEditUser(null); setShowForm(true) }}>
            Add User
          </Button>
        }
      />

      <div className="p-6 max-w-4xl space-y-6">
        {/* User table */}
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Member</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Projects</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Active</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => {
                const userProjects = projects.filter(p => p.assignedTo === u.id)
                const activeProjects = userProjects.filter(p => p.status === 'in_progress').length
                const isDemo = isDemoUser(u)

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
                    <td className="px-5 py-3.5 text-sm text-slate-600">{userProjects.length}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">{activeProjects}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                        <Button
                          variant="ghost" size="xs" icon={Edit2}
                          onClick={() => { setEditUser(u); setShowForm(true) }}
                          title="Edit user"
                        />
                        {!isDemo && u.id !== currentUser.id && (
                          <Button
                            variant="ghost" size="xs" icon={Trash2}
                            onClick={() => setDeleteConfirm(u)}
                            title="Remove user"
                            className="hover:text-red-500"
                          />
                        )}
                        {isDemo && (
                          <span className="text-xs text-slate-300 px-2">demo</span>
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Admins',    value: users.filter(u => u.role === 'admin').length,   color: 'text-brand-600'  },
            { label: 'PIs',       value: users.filter(u => u.role === 'pi').length,      color: 'text-purple-600' },
            { label: 'Students',  value: users.filter(u => u.role === 'student').length, color: 'text-teal-600'   },
          ].map(({ label, value, color }) => (
            <div key={label} className="card p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-sm text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Project–user matrix */}
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
                    <span className="text-xs text-slate-600 font-medium">{u.name.split(' ').slice(-1)[0]}</span>
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

      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditUser(null) }}
        title={editUser ? 'Edit User' : 'Add Team Member'}
        size="sm"
      >
        <UserForm
          initial={editUser}
          onClose={() => { setShowForm(false); setEditUser(null) }}
          onSave={handleSave}
        />
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Remove User" size="sm">
        <p className="text-sm text-slate-600 mb-6">
          Remove <strong>{deleteConfirm?.name}</strong> from the team?
          Their projects will remain but will become unassigned.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => handleDelete(deleteConfirm)}>Remove User</Button>
        </div>
      </Modal>
    </Layout>
  )
}
