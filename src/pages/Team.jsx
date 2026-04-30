import { useState } from 'react'
import { Mail, BadgeCheck, Building2, Search, Edit2, Save, X, User } from 'lucide-react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { supabase, DEMO_MODE } from '../lib/supabase'
import Layout from '../components/layout/Layout'
import Header from '../components/layout/Header'
import Avatar from '../components/ui/Avatar'
import { RoleBadge } from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'

const ROLE_ORDER = { admin: 0, pi: 1, research_fellow: 2, student: 3 }

function EditMemberModal({ member, onClose, onSaved }) {
  const [form, setForm] = useState({
    name:        member.name        || '',
    affiliation: member.affiliation || '',
    orcid:       member.orcid       || '',
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Name cannot be empty.'); return }
    setSaving(true)
    setError('')
    try {
      if (!DEMO_MODE) {
        const { error: err } = await supabase.from('profiles').update({
          full_name:   form.name.trim(),
          affiliation: form.affiliation.trim() || null,
          orcid:       form.orcid.trim()       || null,
        }).eq('id', member.id)
        if (err) throw err
      }
      onSaved({ ...member, name: form.name.trim(), affiliation: form.affiliation.trim(), orcid: form.orcid.trim() })
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
        <Avatar user={member} size="lg" />
        <div>
          <p className="text-sm font-semibold text-slate-800">{member.name}</p>
          <p className="text-xs text-slate-400">{member.email}</p>
        </div>
      </div>

      <div>
        <label className="label">Full Name</label>
        <div className="relative">
          <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input-base pl-9" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Dr. Jane Smith" />
        </div>
      </div>

      <div>
        <label className="label">Affiliation</label>
        <div className="relative">
          <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input-base pl-9" value={form.affiliation} onChange={e => set('affiliation', e.target.value)} placeholder="e.g. Johns Hopkins, Dept. of Neurosurgery" />
        </div>
      </div>

      <div>
        <label className="label">ORCID iD</label>
        <div className="relative">
          <BadgeCheck size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input-base pl-9 font-mono" value={form.orcid} onChange={e => set('orcid', e.target.value)} placeholder="0000-0002-1825-0097" />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
        <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button type="submit" icon={Save} disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}

export default function Team() {
  const { users, reloadUsers } = useData()
  const { user: currentUser }  = useAuth()
  const [search, setSearch]       = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [editMember, setEditMember] = useState(null)

  const isAdmin = currentUser?.role === 'admin'

  const filtered = users
    .filter(u => roleFilter === 'all' || u.role === roleFilter)
    .filter(u => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.affiliation || '').toLowerCase().includes(q)
      )
    })
    .sort((a, b) => (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9) || a.name.localeCompare(b.name))

  const roles = [
    { value: 'all',             label: 'All'      },
    { value: 'admin',           label: 'Admin'    },
    { value: 'pi',              label: 'PI'       },
    { value: 'research_fellow', label: 'Fellows'  },
    { value: 'student',         label: 'Students' },
  ]

  async function handleSaved() {
    if (reloadUsers) await reloadUsers()
    setEditMember(null)
  }

  return (
    <Layout>
      <Header
        title="Team Directory"
        subtitle={`${users.length} team member${users.length !== 1 ? 's' : ''}`}
      />

      <div className="p-4 md:p-6 max-w-5xl">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 flex-1 min-w-48">
            <Search size={15} className="text-slate-400 shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email or affiliation…"
              className="bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none flex-1"
            />
          </div>
          <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-1">
            {roles.map(r => (
              <button
                key={r.value}
                onClick={() => setRoleFilter(r.value)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  roleFilter === r.value ? 'bg-brand-500 text-white' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cards */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-lg font-medium">No members found</p>
            <p className="text-sm mt-1">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(u => (
              <div key={u.id} className="card p-5 flex flex-col gap-4 group relative">

                {/* Admin edit button */}
                {isAdmin && (
                  <button
                    onClick={() => setEditMember(u)}
                    className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-300 hover:text-brand-500 hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100"
                    title="Edit member info"
                  >
                    <Edit2 size={13} />
                  </button>
                )}

                {/* Header */}
                <div className="flex items-start gap-3">
                  <Avatar user={u} size="lg" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 leading-tight">{u.name}</p>
                    <div className="mt-1"><RoleBadge role={u.role} /></div>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 text-xs text-slate-600">
                  <a href={`mailto:${u.email}`} className="flex items-center gap-2 hover:text-brand-600 transition-colors group/link">
                    <Mail size={13} className="text-slate-400 group-hover/link:text-brand-500 shrink-0" />
                    <span className="truncate">{u.email}</span>
                  </a>

                  {u.affiliation ? (
                    <div className="flex items-start gap-2">
                      <Building2 size={13} className="text-slate-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{u.affiliation}</span>
                    </div>
                  ) : isAdmin && (
                    <button onClick={() => setEditMember(u)} className="flex items-center gap-2 text-slate-300 hover:text-brand-500 transition-colors">
                      <Building2 size={13} className="shrink-0" />
                      <span className="italic">No affiliation — click to add</span>
                    </button>
                  )}

                  {u.orcid ? (
                    <a href={`https://orcid.org/${u.orcid}`} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 hover:text-brand-600 transition-colors group/link">
                      <BadgeCheck size={13} className="text-slate-400 group-hover/link:text-brand-500 shrink-0" />
                      <span className="font-mono">{u.orcid}</span>
                    </a>
                  ) : isAdmin && (
                    <button onClick={() => setEditMember(u)} className="flex items-center gap-2 text-slate-300 hover:text-brand-500 transition-colors">
                      <BadgeCheck size={13} className="shrink-0" />
                      <span className="italic">No ORCID — click to add</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit modal */}
      <Modal
        isOpen={!!editMember}
        onClose={() => setEditMember(null)}
        title="Edit Member Info"
        size="sm"
      >
        {editMember && (
          <EditMemberModal
            member={editMember}
            onClose={() => setEditMember(null)}
            onSaved={handleSaved}
          />
        )}
      </Modal>
    </Layout>
  )
}
