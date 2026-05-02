'use client'

import { useState } from 'react'
import { formatRelative } from '@/lib/utils/format'
import type { AutopsyWithComments } from '@/lib/types/database'

interface ProjectEchoesProps {
  autopsy: AutopsyWithComments
  projectId: string
  currentUserId: string | null
}

export default function ProjectEchoes({
  autopsy,
  projectId,
  currentUserId,
}: ProjectEchoesProps) {
  const [comments, setComments] = useState(autopsy.autopsy_comments)
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submitEcho() {
    if (!commentText.trim() || !currentUserId) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/autopsies/${projectId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentText }),
      })
      if (!res.ok) throw new Error('Failed to submit')
      const comment = await res.json()
      setComments((prev) => [...prev, comment])
      setCommentText('')
    } catch {
      setError('Failed to submit echo. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section>
      <h2 className="font-serif text-2xl text-bureau-text mb-6">
        Echoes
        <span className="font-sans text-sm text-bureau-dim ml-3 font-normal">
          {comments.length} voice{comments.length !== 1 ? 's' : ''}
        </span>
      </h2>

      <div className="space-y-5">
        {comments.map((comment, i) => (
          <div
            key={comment.id}
            className={`glass rounded-xl p-6 ${i % 3 === 1 ? 'ml-8' : ''} ${i % 3 === 2 ? 'ml-4' : ''}`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-bureau-elevated border border-white/10
                              flex items-center justify-center flex-shrink-0">
                <span className="font-sans text-xs text-bureau-dim font-semibold">
                  {(comment.profiles?.display_name ?? comment.profiles?.username ?? '?')
                    .slice(0, 1).toUpperCase()}
                </span>
              </div>
              <span className="font-sans text-xs uppercase tracking-widest text-amber-500">
                {(comment.profiles?.display_name ?? comment.profiles?.username ?? 'Anonymous').toUpperCase()}
              </span>
              <span className="font-sans text-[10px] text-bureau-dim ml-auto">
                {formatRelative(comment.created_at)}
              </span>
            </div>
            <p className="font-sans text-sm text-bureau-muted leading-relaxed">
              {comment.comment_text}
            </p>
            {comment.alternative_causes && comment.alternative_causes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {comment.alternative_causes.map((cause) => (
                  <span
                    key={cause}
                    className="px-2 py-0.5 rounded border border-amber-600/30 bg-amber-500/5
                               font-sans text-[10px] text-amber-400/80"
                  >
                    {cause}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}

        {comments.length === 0 && (
          <div className="glass rounded-xl p-8 text-center border border-dashed border-white/10">
            <p className="font-serif italic text-bureau-dim">
              No echoes yet. Be the first to leave a voice.
            </p>
          </div>
        )}
      </div>

      {/* Submit echo */}
      {currentUserId ? (
        <div className="mt-6 space-y-3">
          {error && (
            <p className="font-sans text-xs text-red-400">{error}</p>
          )}
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Leave your echo — a thought, a diagnosis, a memory…"
            rows={3}
            className="input-bureau w-full resize-none leading-relaxed"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={submitEcho}
              disabled={!commentText.trim() || submitting}
              className="btn-bureau text-xs py-2 px-5"
            >
              {submitting ? 'Echoing…' : 'Leave an Echo'}
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-6 font-sans text-xs text-center text-bureau-dim">
          Sign in to leave your echo.
        </p>
      )}
    </section>
  )
}
