import { useState } from 'react'
import { ChevronRight, ChevronLeft, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { useAuth } from '../../context/AuthContext'
import { PROJECT_TYPES, STAGE_TEMPLATES } from '../../lib/constants'
import { RoleBadge } from '../ui/Badge'
import Avatar from '../ui/Avatar'
import Button from '../ui/Button'

const EMPTY = {
  title: '', projectType: '', description: '', assignedTo: '',
  status: 'not_started', startDate: '', deadline: '', tags: '', teamMembers: [],
}

// ── Stage editor ──────────────────────────────────────────────────────────────
function StageEditor({ stages, onChange }) {
  function updateName(i, name) {
    const next = stages.map((s, idx) => idx === i ? { ...s, name } : s)
    onChange(next)
  }
  function remove(i) { onChange(stages.filter((_, idx) => idx !== i)) }
  function moveUp(i) {
    if (i === 0) return
    const next = [...stages]
    ;[next[i - 1], next[i]] = [next[i], next[i - 1]]
    onChange(next)
  }
  function moveDown(i) {
    if (i === stages.length - 1) return
    const next = [...stages]
    ;[next[i], next[i + 1]] = [next[i + 1], next[i]]
    onChange(next)
  }
  function addStage() {
    onChange([...stages, { key: `custom_${Date.now()}`, name: '' }])
  }

  return (
    <div className="space-y-2">
      {stages.map((s, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-6 text-center text-xs text-slate-400 font-medium shrink-0">{i + 1}</span>
          <input
            className="input-base flex-1 py-2"
            value={s.name}
            onChange={e => updateName(i, e.target.value)}
            placeholder="Stage name…"
          />
          <div className="flex items-center gap-0.5 shrink-0">
            <button type="button" onClick={() => moveUp(i)} disabled={i === 0}
              className="p-1.5 text-slate-300 hover:text-slate-600 disabled:opacity-20 transition-colors">
              <ArrowUp size={13} />
            </button>
            <button type="button" onClick={() => moveDown(i)} disabled={i === stages.length - 1}
              className="p-1.5 text-slate-300 hover:text-slate-600 disabled:opacity-20 transition-colors">
              <ArrowDown size={13} />
            </button>
            <button type="button" onClick={() => remove(i)}
              className="p-1.5 text-slate-300 hover:text-red-500 transition-colors">
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      ))}
      <button type="button" onClick={addStage}
        className="flex items-center gap-2 text-sm text-brand-500 hover:text-brand-600 font-medium mt-2 transition-colors">
        <Plus size={15} /> Add stage
      </button>
    </div>
  )
}

// ── Main form ─────────────────────────────────────────────────────────────────
export default function ProjectForm({ initial, onClose }) {
  const { dispatch, users } = useData()
  const { user }            = useAuth()

  const [step,   setStep]   = useState(1)
  const [form,   setForm]   = useState(initial ? {
    ...initial,
    tags:        (initial.tags || []).join(', '),
    teamMembers: initial.teamMembers || [],
    projectType: initial.projectType || '',
  } : EMPTY)
  const [stages, setStages] = useState(
    initial
      ? []  // editing: stages managed in project detail
      : (STAGE_TEMPLATES[form.projectType] || [])
  )
  const [error,  setError]  = useState('')

  const isEdit = !!initial

  function set(field, value) { setForm(f => ({ ...f, [field]: value })) }

  function handleTypeChange(type) {
    set('projectType', type)
    setStages(STAGE_TEMPLATES[type] || [])
  }

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

  function goToStep2(e) {
    e.preventDefault()
    if (!form.title.trim())       { setError('Title is required.');        return }
    if (!form.projectType)        { setError('Project type is required.'); return }
    setError('')
    setStep(2)
  }

  function submit(e) {
    e.preventDefault()
    const emptyStage = stages.find(s => !s.name.trim())
    if (emptyStage) { setError('All stages must have a name.'); return }
    if (stages.length === 0) { setError('Add at least one stage.'); return }

    const payload = {
      ...form,
      tags:         form.tags.split(',').map(t => t.trim()).filter(Boolean),
      teamMembers:  form.teamMembers || [],
      createdBy:    user.id,
      customStages: stages,
    }
    if (isEdit) {
      dispatch({ type: 'UPDATE_PROJECT', payload: { ...payload, id: initial.id } })
    } else {
      dispatch({ type: 'ADD_PROJECT', payload })
    }
    onClose()
  }

  function submitEdit(e) {
    e.preventDefault()
    if (!form.title.trim()) { setError('Title is required.'); return }
    const payload = {
      ...form,
      tags:        form.tags.split(',').map(t => t.trim()).filter(Boolean),
      teamMembers: form.teamMembers || [],
      createdBy:   user.id,
    }
    dispatch({ type: 'UPDATE_PROJECT', payload: { ...payload, id: initial.id } })
    onClose()
  }

  const teamCandidates = users.filter(u => u.id !== form.assignedTo)

  // ── Edit mode: single-step ────────────────────────────────────────────────
  if (isEdit) {
    return (
      <form onSubmit={submitEdit} className="space-y-4">
        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <div>
          <label className="label">Project Title *</label>
          <input className="input-base" value={form.title} onChange={e => set('title', e.target.value)} autoFocus />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Project Type</label>
            <select className="input-base" value={form.projectType} onChange={e => set('projectType', e.target.value)}>
              <option value="">— Select type —</option>
              {PROJECT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input-base" value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="delayed">Delayed</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Description</label>
          <textarea className="input-base resize-none" rows={3} value={form.description}
            onChange={e => set('description', e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Project Lead</label>
            <select className="input-base" value={form.assignedTo} onChange={e => setLead(e.target.value)}>
              <option value="">— Unassigned —</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Deadline</label>
            <input type="date" className="input-base" value={form.deadline || ''}
              onChange={e => set('deadline', e.target.value)} />
          </div>
        </div>

        <div>
          <label className="label">Tags <span className="text-slate-400 font-normal">(comma-separated)</span></label>
          <input className="input-base" value={form.tags} onChange={e => set('tags', e.target.value)}
            placeholder="e.g. stroke, endovascular, meta-analysis" />
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">Save Changes</Button>
        </div>
      </form>
    )
  }

  // ── Create mode: 2-step ───────────────────────────────────────────────────
  return (
    <form onSubmit={step === 1 ? goToStep2 : submit} className="space-y-4">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-2">
        {[1, 2].map(n => (
          <div key={n} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors
              ${step === n ? 'bg-brand-500 text-white' : step > n ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
              {n}
            </div>
            <span className={`text-xs font-medium ${step === n ? 'text-slate-700' : 'text-slate-400'}`}>
              {n === 1 ? 'Project Details' : 'Stages'}
            </span>
            {n < 2 && <ChevronRight size={14} className="text-slate-300" />}
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      {/* ── Step 1 ── */}
      {step === 1 && (
        <>
          <div>
            <label className="label">Project Title *</label>
            <input className="input-base" value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="e.g. Venous Stenting vs Shunting: A Meta-Analysis" autoFocus />
          </div>

          <div>
            <label className="label">Project Type *</label>
            <select className="input-base" value={form.projectType} onChange={e => handleTypeChange(e.target.value)}>
              <option value="">— Select type —</option>
              {PROJECT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Description</label>
            <textarea className="input-base resize-none" rows={3} value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Brief overview of the research question and methodology…" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Project Lead</label>
              <select className="input-base" value={form.assignedTo} onChange={e => setLead(e.target.value)}>
                <option value="">— Unassigned —</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Deadline</label>
              <input type="date" className="input-base" value={form.deadline}
                onChange={e => set('deadline', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="label">Team Members</label>
            {teamCandidates.length === 0 ? (
              <p className="text-xs text-slate-400 border border-slate-200 rounded-lg px-3 py-3 text-center">No other team members to add</p>
            ) : (
              <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-36 overflow-y-auto">
                {teamCandidates.map(u => {
                  const checked = (form.teamMembers || []).includes(u.id)
                  return (
                    <label key={u.id} className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${checked ? 'bg-brand-50' : 'hover:bg-slate-50'}`}>
                      <input type="checkbox" className="rounded border-slate-300 text-brand-500 shrink-0"
                        checked={checked} onChange={() => toggleMember(u.id)} />
                      <Avatar user={u} size="xs" />
                      <span className="text-sm text-slate-700 flex-1">{u.name}</span>
                      <RoleBadge role={u.role} />
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          <div>
            <label className="label">Tags <span className="text-slate-400 font-normal">(comma-separated)</span></label>
            <input className="input-base" value={form.tags} onChange={e => set('tags', e.target.value)}
              placeholder="e.g. stroke, endovascular, meta-analysis" />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" icon={ChevronRight}>Next: Stages</Button>
          </div>
        </>
      )}

      {/* ── Step 2 ── */}
      {step === 2 && (
        <>
          <div>
            <p className="text-sm text-slate-600 mb-1">
              {form.projectType
                ? <>Template loaded for <span className="font-semibold">{PROJECT_TYPES.find(t => t.value === form.projectType)?.label}</span>.</>
                : 'Add your stages below.'
              } Edit, reorder, delete, or add stages as needed.
            </p>
          </div>

          <StageEditor stages={stages} onChange={setStages} />

          <div className="flex justify-between gap-3 pt-2 border-t border-slate-100">
            <Button variant="secondary" icon={ChevronLeft} onClick={() => { setStep(1); setError('') }}>Back</Button>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={onClose}>Cancel</Button>
              <Button type="submit">Create Project</Button>
            </div>
          </div>
        </>
      )}
    </form>
  )
}
