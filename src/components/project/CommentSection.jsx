import { useState } from 'react'
import { Send, Trash2 } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { useAuth } from '../../context/AuthContext'
import Avatar from '../ui/Avatar'
import { formatRelative } from '../../lib/utils'

export default function CommentSection({ projectId }) {
  const { getCommentsForProject, getUserById, dispatch } = useData()
  const { user } = useAuth()
  const [text, setText]               = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  const comments = getCommentsForProject(projectId)

  function submit(e) {
    e.preventDefault()
    if (!text.trim()) return
    dispatch({
      type: 'ADD_COMMENT',
      payload: { projectId, userId: user.id, content: text.trim() },
    })
    setText('')
  }

  function handleDelete(comment) {
    dispatch({ type: 'DELETE_COMMENT', payload: { id: comment.id } })
    setConfirmDelete(null)
  }

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Discussion</h3>

      <div className="space-y-4 mb-5 max-h-80 overflow-y-auto pr-1">
        {comments.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-6">No comments yet. Start the discussion.</p>
        )}

        {comments.map(c => {
          const author   = getUserById(c.userId)
          const canDelete = user?.role === 'admin' || c.userId === user?.id

          return (
            <div key={c.id} className="flex gap-3 group">
              <Avatar user={author} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-slate-800">{author?.name ?? 'Unknown'}</span>
                    <span className="text-xs text-slate-400">{formatRelative(c.createdAt)}</span>
                  </div>

                  {/* Delete button — always visible if allowed */}
                  {canDelete && confirmDelete !== c.id && (
                    <button
                      onClick={() => setConfirmDelete(c.id)}
                      className="p-1 text-red-400 hover:text-red-600 transition-colors shrink-0"
                      title="Delete message"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                {/* Confirm delete inline */}
                {confirmDelete === c.id ? (
                  <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3">
                    <p className="text-xs text-red-600">Delete this message?</p>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="text-xs text-slate-500 hover:text-slate-700 font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDelete(c)}
                        className="text-xs text-red-600 hover:text-red-700 font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-xl rounded-tl-sm px-4 py-2.5">
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{c.content}</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <form onSubmit={submit} className="flex gap-2">
        <Avatar user={user} size="sm" />
        <div className="flex-1 flex gap-2">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(e) } }}
            placeholder="Write a comment… (Enter to send)"
            rows={1}
            className="flex-1 input-base text-sm resize-none"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="p-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={15} />
          </button>
        </div>
      </form>
    </div>
  )
}
