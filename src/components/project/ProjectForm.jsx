import { useState } from 'react'
import { useData } from '../../context/DataContext'
import { useAuth } from '../../context/AuthContext'
import Button from '../ui/Button'

const EMPTY = {
  title: '', description: '', assignedTo: '',
  status: 'not_started', startDate: '', deadline: '', tags: '',
}

export default function ProjectForm({ initial, onClose }) {
  const { dispatch, users } = useData()
  const { user }            = useAuth()
  const [form, setForm]     = useState(initial ? {
    ...initial,
    tags: (initial.tags || []).join(', '),
  } : EMPTY)
  const [error, setError]   = useState('')

  const students = users.filter(u => u.role === 'student' || u.role === 'admin')

  function set(field, value) { setForm(f => ({ ...f, [field]: value })) }

  function submit(e) {
    e.preventDefault()
    if (!form.title.trim()) { setError('Title is required.'); return }
    const payload = {
      ...form,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
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

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      {field('Project Title *',
        <input
          className="input-base"
          value={form.title}
          onChange={e => set('title', e.target.value)}
          placeholder="e.g. SR: Laparoscopic vs Open Cholecystectomy"
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
        {field('Assigned To',
          <select className="input-base" value={form.assignedTo} onChange={e => set('assignedTo', e.target.value)}>
            <option value="">— Unassigned —</option>
            {students.map(u => (
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

      <div className="grid grid-cols-2 gap-4">
        {field('Start Date',
          <input
            type="date" className="input-base"
            value={form.startDate}
            onChange={e => set('startDate', e.target.value)}
          />
        )}
        {field('Deadline',
          <input
            type="date" className="input-base"
            value={form.deadline}
            onChange={e => set('deadline', e.target.value)}
          />
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
