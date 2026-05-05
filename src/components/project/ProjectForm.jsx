import { useState } from 'react'
import { useData } from '../../context/DataContext'
import { useAuth } from '../../context/AuthContext'
import { RoleBadge } from '../ui/Badge'
import Avatar from '../ui/Avatar'
import Button from '../ui/Button'

const EMPTY = {
  title: '', description: '', assignedTo: '',
  status: 'not_started', startDate: '', deadline: '',
  tags: '', teamMembers: [],
}

export default function ProjectForm({ initial, onClose }) {
  const { dispatch, users } = useData()
  const { user }            = useAuth()
  const [form, setForm]     = useState(initial ? {
    ...initial,
    tags:        (initial.tags || []).join(', '),
    teamMembers: initial.teamMembers || [],
  } : EMPTY)
  const [error, setError] = useState('')

  function set(field, value) { setForm(f => ({ ...f, [field]: value })) }

  function setLead(newLeadId) {
    setForm(f => ({
      ...f,
      assignedTo:  newLeadId,
      teamMembers: (f.teamMembers || []).filter(id => id !== newLeadId),
    }))
  }

  function toggleMember(userId) {
    setForm(f => {
      const members = f.teamMembers || []
      return {
        ...f,
        teamMembers: members.includes(userId)
          ? members.filter(id => id !== userId)
          : [...members, userId],
      }
    })
  }

  function submit(e) {
    e.preventDefault()
    if (!form.title.trim()) { setError('Title is required.'); return }
    const payload = {
      ...form,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      teamMembers: form.teamMembers || [],
      createdBy: user.id,
    }
    if (initial) {
      dispatch({ type: 'UPDATE_PROJECT', payload: { ...payload, id: initial.id } })
    } else {
      dispatch({ type: 'ADD_PROJECT', payload })
    }
    onClose()
  }

  const field = (label, children) => (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  )

  // All users except the currently selected lead
  const teamCandidates = users.filter(u => u.id !== form.assignedTo)

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      {field('Project Title *',
        <input
          className="input-base"
          value={form.title}
          onChange={e => set('title', e.target.value)}
          placeholder="e.g. SR: Laparoscopic vs Open Cholecystectomy"
          autoFocus
        />
      )}

      {field('Description',
        <textarea
          className="input-base"
          rows={3}
          value={form.description}
          onChange={e => set('description', e.target.value)}
          placeholder="Brief overview of the research question and methodology…"
        />
      )}

      <div className="grid grid-cols-2 gap-4">
        {field('Project Lead',
          <select className="input-base" value={form.assignedTo} onChange={e => setLead(e.target.value)}>
            <option value="">— Unassigned —</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        )}
        {field('Status',
          <select className="input-base" value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="delayed">Delayed</option>
          </select>
        )}
      </div>

      {/* Team members picker */}
      <div>
        <label className="label">Team Members</label>
        <p className="text-xs text-slate-400 mb-2">
          Select additional contributors — they can view and work on this project
        </p>
        {teamCandidates.length === 0 ? (
          <p className="text-xs text-slate-400 border border-slate-200 rounded-lg px-3 py-3 text-center">
            No other team members to add
          </p>
        ) : (
          <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-44 overflow-y-auto">
            {teamCandidates.map(u => {
              const checked = (form.teamMembers || []).includes(u.id)
              return (
                <label
                  key={u.id}
                  className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors
                    ${checked ? 'bg-brand-50' : 'hover:bg-slate-50'}`}
                >
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-brand-500 focus:ring-brand-500 shrink-0"
                    checked={checked}
                    onChange={() => toggleMember(u.id)}
                  />
                  <Avatar user={u} size="xs" />
                  <span className="text-sm text-slate-700 flex-1">{u.name}</span>
                  <RoleBadge role={u.role} />
                </label>
              )
            })}
          </div>
        )}
        {(form.teamMembers || []).length > 0 && (
          <p className="text-xs text-brand-600 mt-1.5 font-medium">
            {form.teamMembers.length} member{form.teamMembers.length !== 1 ? 's' : ''} selected
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {field('Start Date',
          <input type="date" className="input-base" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
        )}
        {field('Deadline',
          <input type="date" className="input-base" value={form.deadline} onChange={e => set('deadline', e.target.value)} />
        )}
      </div>

      {field('Tags (comma separated)',
        <input
          className="input-base"
          value={form.tags}
          onChange={e => set('tags', e.target.value)}
          placeholder="e.g. oncology, meta-analysis, surgery"
        />
      )}

      <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="primary">
          {initial ? 'Save Changes' : 'Create Project'}
        </Button>
      </div>
    </form>
  )
}
