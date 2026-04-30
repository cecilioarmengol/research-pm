import { useState } from 'react'
import { Mail, BadgeCheck, Building2, Search } from 'lucide-react'
import { useData } from '../context/DataContext'
import Layout from '../components/layout/Layout'
import Header from '../components/layout/Header'
import Avatar from '../components/ui/Avatar'
import { RoleBadge } from '../components/ui/Badge'

const ROLE_ORDER = { admin: 0, pi: 1, research_fellow: 2, student: 3 }

export default function Team() {
  const { users } = useData()
  const [search, setSearch]     = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

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
    { value: 'all',            label: 'All' },
    { value: 'admin',          label: 'Admin' },
    { value: 'pi',             label: 'PI' },
    { value: 'research_fellow',label: 'Fellows' },
    { value: 'student',        label: 'Students' },
  ]

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
                  roleFilter === r.value
                    ? 'bg-brand-500 text-white'
                    : 'text-slate-500 hover:bg-slate-100'
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
              <div key={u.id} className="card p-5 flex flex-col gap-4">
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
                  {/* Email */}
                  <a
                    href={`mailto:${u.email}`}
                    className="flex items-center gap-2 hover:text-brand-600 transition-colors group"
                  >
                    <Mail size={13} className="text-slate-400 group-hover:text-brand-500 shrink-0" />
                    <span className="truncate">{u.email}</span>
                  </a>

                  {/* Affiliation */}
                  {u.affiliation && (
                    <div className="flex items-start gap-2">
                      <Building2 size={13} className="text-slate-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{u.affiliation}</span>
                    </div>
                  )}

                  {/* ORCID */}
                  {u.orcid && (
                    <a
                      href={`https://orcid.org/${u.orcid}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 hover:text-brand-600 transition-colors group"
                    >
                      <BadgeCheck size={13} className="text-slate-400 group-hover:text-brand-500 shrink-0" />
                      <span className="font-mono">{u.orcid}</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
