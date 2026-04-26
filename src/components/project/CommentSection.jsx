import { useState } from 'react'
import { Send } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { useAuth } from '../../context/AuthContext'
import Avatar from '../ui/Avatar'
import { formatRelative } from '../../lib/utils'

export default function CommentSection({ projectId }) {
  const { getCommentsForProject, getUserById, dispatch } = useData()
  const { user } = useAuth()
  const [text, setText] = useState('')

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

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Discussion</h3>

      <div className="space-y-4 mb-5 max-h-80 overflow-y-auto pr-1">
        {comments.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-6">No comments yet. Start the discussion.</p>
        )}
        {comments.map(c => {
          const author = getUserById(c.userId)
          return (
            <div key={c.id} className="flex gap-3">
              <Avatar user={author} size="sm" />
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-sm font-medium text-slate-800">{author?.name ?? 'Unknown'}</span>
                  <span className="text-xs text-slate-400">{formatRelative(c.createdAt)}</span>
                </div>
                <div className="bg-slate-50 rounded-xl rounded-tl-sm px-4 py-2.5">
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{c.content}</p>
                </div>
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
