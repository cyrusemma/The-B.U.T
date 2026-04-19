'use client'

import { useState } from 'react'
import { formatRelative } from '@/lib/utils/format'
import type { AutopsyWithComments } from '@/lib/types/database'

interface AutopsySectionProps {
  autopsy: AutopsyWithComments
  projectId: string
  currentUserId: string | null
  projectTitle: string
  causesOfDeath: string[]
}

function ConfidenceMeter({ score }: { score: number }) {
  const label =
    score >= 80 ? 'High confidence'
    : score >= 50 ? 'Moderate confidence'
    : 'Speculative'
  const color =
    score >= 80 ? 'bg-green-600'
    : score >= 50 ? 'bg-amber-600'
    : 'bg-red-700'

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs text-slate-500 whitespace-nowrap">{label} ({score}%)</span>
    </div>
  )
}

export default function AutopsySection({
  autopsy,
  projectId,
  currentUserId,
  projectTitle,
  causesOfDeath,
}: AutopsySectionProps) {
  const [diagnosing, setDiagnosing] = useState(false)
  const [localAutopsy, setLocalAutopsy] = useState(autopsy)
  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasDiagnosis = !!localAutopsy.pathologist_diagnosis

  async function requestDiagnosis() {
    setDiagnosing(true)
    setError(null)
    try {
      const res = await fetch(`/api/autopsies/${projectId}/diagnose`, {
        method: 'POST',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Diagnosis failed')
      }
      const data = await res.json()
      setLocalAutopsy((prev) => ({
        ...prev,
        pathologist_diagnosis: data.diagnosis,
        pathologist_recommendation: data.recommendation,
        confidence_score: data.confidence,
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run diagnosis')
    } finally {
      setDiagnosing(false)
    }
  }

  async function submitComment() {
    if (!commentText.trim() || !currentUserId) return
    setSubmittingComment(true)
    try {
      const res = await fetch(`/api/autopsies/${projectId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentText }),
      })
      if (!res.ok) throw new Error('Failed to submit comment')
      const comment = await res.json()
      setLocalAutopsy((prev) => ({
        ...prev,
        autopsy_comments: [...prev.autopsy_comments, comment],
        community_diagnosis_count: prev.community_diagnosis_count + 1,
      }))
      setCommentText('')
    } catch {
      setError('Failed to submit comment')
    } finally {
      setSubmittingComment(false)
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="border-b border-slate-700/50 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl text-slate-200">Autopsy Report</h2>
          <p className="text-slate-500 text-xs mt-0.5">
            AI Pathologist · {localAutopsy.community_diagnosis_count} community diagnos
            {localAutopsy.community_diagnosis_count !== 1 ? 'es' : 'is'}
          </p>
        </div>
        <div className="text-slate-600 text-xs border border-slate-700 rounded px-2 py-1">
          Ref: {localAutopsy.id.slice(0, 8).toUpperCase()}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* AI Diagnosis */}
        {!hasDiagnosis ? (
          <div className="text-center py-8 border border-dashed border-slate-700 rounded-lg">
            <div className="text-4xl mb-3">🔬</div>
            <h3 className="font-serif text-lg text-slate-300 mb-2">Pathologist not yet engaged</h3>
            <p className="text-slate-500 text-sm mb-5 max-w-xs mx-auto">
              The AI Pathologist will review the evidence and deliver a formal diagnosis.
            </p>
            <button
              onClick={requestDiagnosis}
              disabled={diagnosing}
              className="btn-bureau disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {diagnosing ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 border-2 border-amber-600/30 border-t-amber-600 rounded-full animate-spin" />
                  Examining evidence…
                </span>
              ) : (
                'Request Diagnosis'
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs text-slate-500 uppercase tracking-widest">
                  Pathologist&apos;s Diagnosis
                </h3>
                {localAutopsy.confidence_score !== null && (
                  <div className="w-48">
                    <ConfidenceMeter score={localAutopsy.confidence_score} />
                  </div>
                )}
              </div>
              <div className="bg-slate-800/60 rounded-lg p-5 border border-slate-700/40">
                <p className="text-slate-200 leading-relaxed font-serif text-base">
                  {localAutopsy.pathologist_diagnosis}
                </p>
              </div>
            </div>

            {localAutopsy.pathologist_recommendation && (
              <div>
                <h3 className="text-xs text-slate-500 uppercase tracking-widest mb-2">
                  Recommendation
                </h3>
                <div className="bg-amber-950/20 rounded-lg p-5 border border-amber-800/20">
                  <p className="text-amber-200/80 leading-relaxed text-sm">
                    {localAutopsy.pathologist_recommendation}
                  </p>
                </div>
              </div>
            )}

            {/* Re-diagnose */}
            <button
              onClick={requestDiagnosis}
              disabled={diagnosing}
              className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
            >
              {diagnosing ? 'Re-examining…' : 'Request new diagnosis'}
            </button>
          </div>
        )}

        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        {/* Community Comments */}
        <div className="border-t border-slate-700/50 pt-5">
          <h3 className="font-serif text-base text-slate-300 mb-4">
            Community Diagnoses ({localAutopsy.community_diagnosis_count})
          </h3>

          {localAutopsy.autopsy_comments.length > 0 && (
            <div className="space-y-3 mb-5">
              {localAutopsy.autopsy_comments.map((comment) => (
                <div key={comment.id} className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400 text-xs font-medium">
                      {comment.profiles?.display_name ?? comment.profiles?.username ?? 'Anonymous'}
                    </span>
                    <span className="text-slate-600 text-xs">
                      {formatRelative(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">{comment.comment_text}</p>
                  {comment.alternative_causes && comment.alternative_causes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {comment.alternative_causes.map((cause) => (
                        <span key={cause} className="cause-tag">{cause}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {currentUserId ? (
            <div className="space-y-2">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Share your diagnosis or perspective…"
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 rounded-md px-4 py-3
                           text-slate-100 placeholder-slate-600 text-sm focus:outline-none
                           focus:border-amber-600/60 resize-none"
              />
              <div className="flex justify-end">
                <button
                  onClick={submitComment}
                  disabled={!commentText.trim() || submittingComment}
                  className="btn-bureau text-sm py-2 px-4 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submittingComment ? 'Submitting…' : 'Add diagnosis'}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-slate-600 text-sm text-center">
              Sign in to add your diagnosis.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
