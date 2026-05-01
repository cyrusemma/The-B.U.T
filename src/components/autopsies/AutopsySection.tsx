'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
    : score >= 50 ? 'Moderate'
    : 'Speculative'
  const barClass =
    score >= 80 ? 'confidence-high'
    : score >= 50 ? 'confidence-medium'
    : 'confidence-low'

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${barClass}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
        />
      </div>
      <span className="font-sans text-[10px] uppercase tracking-widest text-bureau-muted whitespace-nowrap">
        {label} ({score}%)
      </span>
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
      const res = await fetch(`/api/autopsies/${projectId}/diagnose`, { method: 'POST' })
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
    <div className="card-void rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl text-bureau-text">Autopsy Report</h2>
          <p className="font-sans text-xs text-bureau-dim mt-0.5 uppercase tracking-wide">
            AI Pathologist &middot; {localAutopsy.community_diagnosis_count} community diagnos
            {localAutopsy.community_diagnosis_count !== 1 ? 'es' : 'is'}
          </p>
        </div>
        <span className="font-sans text-[10px] uppercase tracking-widest text-bureau-dim border border-white/10 rounded px-2 py-1">
          Ref: {localAutopsy.id.slice(0, 8).toUpperCase()}
        </span>
      </div>

      <div className="p-6 space-y-6">
        {/* AI Diagnosis area */}
        <AnimatePresence mode="wait">
          {!hasDiagnosis ? (
            <motion.div
              key="no-diagnosis"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-10 border border-dashed border-white/10 rounded-lg"
            >
              {/* Microscope icon */}
              <div className="w-12 h-12 mx-auto mb-4 rounded-full glass flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                     className="w-6 h-6 text-bureau-muted">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                </svg>
              </div>
              <h3 className="font-serif text-lg text-bureau-text mb-2">Pathologist not yet engaged</h3>
              <p className="font-sans text-sm text-bureau-muted mb-6 max-w-xs mx-auto leading-relaxed">
                The AI Pathologist will review the evidence and deliver a formal diagnosis.
              </p>
              <button
                type="button"
                onClick={requestDiagnosis}
                disabled={diagnosing}
                className="btn-bureau"
              >
                {diagnosing ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Examining evidence…
                  </span>
                ) : 'Request Diagnosis'}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="has-diagnosis"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Diagnosis text */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-sans text-[10px] uppercase tracking-widest text-bureau-dim">
                    Pathologist&apos;s Diagnosis
                  </p>
                  {localAutopsy.confidence_score !== null && (
                    <div className="w-48">
                      <ConfidenceMeter score={localAutopsy.confidence_score} />
                    </div>
                  )}
                </div>
                <div className="glass rounded-lg p-5">
                  <p className="font-serif text-base text-bureau-text leading-relaxed">
                    {localAutopsy.pathologist_diagnosis}
                  </p>
                </div>
              </div>

              {/* Recommendation */}
              {localAutopsy.pathologist_recommendation && (
                <div>
                  <p className="font-sans text-[10px] uppercase tracking-widest text-bureau-dim mb-2">
                    Recommendation
                  </p>
                  <div className="rounded-lg p-5 bg-bureau-gold/[0.04] border border-bureau-gold/15">
                    <p className="font-sans text-sm text-bureau-gold/75 leading-relaxed">
                      {localAutopsy.pathologist_recommendation}
                    </p>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={requestDiagnosis}
                disabled={diagnosing}
                className="font-sans text-xs text-bureau-dim hover:text-bureau-muted transition-colors"
              >
                {diagnosing ? 'Re-examining…' : 'Request new diagnosis'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {error && <p className="font-sans text-xs text-red-400">{error}</p>}

        {/* Community diagnoses */}
        <div className="border-t border-white/10 pt-5">
          <h3 className="font-serif text-base text-bureau-text mb-4">
            Community Diagnoses ({localAutopsy.community_diagnosis_count})
          </h3>

          {localAutopsy.autopsy_comments.length > 0 && (
            <div className="space-y-3 mb-5">
              {localAutopsy.autopsy_comments.map((comment) => (
                <div key={comment.id} className="glass rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-sans text-xs font-semibold text-bureau-muted">
                      {comment.profiles?.display_name ?? comment.profiles?.username ?? 'Anonymous'}
                    </span>
                    <span className="font-sans text-[10px] text-bureau-dim">
                      {formatRelative(comment.created_at)}
                    </span>
                  </div>
                  <p className="font-sans text-sm text-bureau-text leading-relaxed">
                    {comment.comment_text}
                  </p>
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
              <label htmlFor="autopsy-comment" className="sr-only">Your diagnosis</label>
              <textarea
                id="autopsy-comment"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Share your diagnosis or perspective…"
                rows={3}
                className="input-bureau resize-none leading-relaxed"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={submitComment}
                  disabled={!commentText.trim() || submittingComment}
                  className="btn-bureau text-xs py-2 px-4"
                >
                  {submittingComment ? 'Submitting…' : 'Add diagnosis'}
                </button>
              </div>
            </div>
          ) : (
            <p className="font-sans text-xs text-center text-bureau-dim">
              Sign in to add your diagnosis.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
