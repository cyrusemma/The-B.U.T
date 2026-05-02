'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatRelative } from '@/lib/utils/format'
import type { AutopsyWithComments, CauseOfDeath } from '@/lib/types/database'

const ALL_CAUSES: CauseOfDeath[] = [
  'Perfectionism',
  'Ran out of money',
  'Scope creep',
  'Lost interest',
  'Life got in the way',
  'Team breakup',
  'Technology became obsolete',
  'Market vanished',
  'Other',
]

const DIFFICULTY_META = {
  easy:     { label: 'Easy Revival',     color: 'text-emerald-400', bar: 'bg-emerald-500', pct: 30 },
  moderate: { label: 'Moderate Effort',  color: 'text-amber-400',   bar: 'bg-amber-500',   pct: 60 },
  hard:     { label: 'Hard to Revive',   color: 'text-red-400',     bar: 'bg-red-500',     pct: 90 },
}

interface AutopsySectionProps {
  autopsy: AutopsyWithComments
  projectId: string
  currentUserId: string | null
  projectTitle: string
  causesOfDeath: string[]
}

// ── Compact cause chips for comment form ─────────────────────────────────────
function CausesChips({
  selected,
  onChange,
}: {
  selected: CauseOfDeath[]
  onChange: (c: CauseOfDeath[]) => void
}) {
  function toggle(cause: CauseOfDeath) {
    if (selected.includes(cause)) onChange(selected.filter(c => c !== cause))
    else if (selected.length < 3) onChange([...selected, cause])
  }
  return (
    <div>
      <p className="font-sans text-[10px] uppercase tracking-widest text-bureau-dim mb-2">
        Alternative causes you suspect (up to 3)
      </p>
      <div className="flex flex-wrap gap-1.5">
        {ALL_CAUSES.map(cause => {
          const active = selected.includes(cause)
          const maxed = !active && selected.length >= 3
          return (
            <button
              key={cause}
              type="button"
              disabled={maxed}
              onClick={() => toggle(cause)}
              className={`font-sans text-xs px-2.5 py-1 rounded border transition-all
                ${active
                  ? 'border-amber-600/50 bg-amber-600/10 text-amber-500'
                  : 'border-white/10 bg-bureau-glass text-bureau-dim hover:text-bureau-muted hover:border-white/20'}
                disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              {cause}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Confidence meter ──────────────────────────────────────────────────────────
function ConfidenceMeter({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-400'
  const label = score >= 80 ? 'High' : score >= 50 ? 'Moderate' : 'Speculative'
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
        />
      </div>
      <span className="font-sans text-[10px] uppercase tracking-widest text-bureau-muted whitespace-nowrap">
        {label} · {score}%
      </span>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AutopsySection({
  autopsy,
  projectId,
  currentUserId,
}: AutopsySectionProps) {
  const [diagnosing, setDiagnosing]       = useState(false)
  const [localAutopsy, setLocalAutopsy]   = useState(autopsy)
  const [streamingText, setStreamingText] = useState<string | null>(null)
  const [commentText, setCommentText]     = useState('')
  const [altCauses, setAltCauses]         = useState<CauseOfDeath[]>([])
  const [submittingComment, setSubmittingComment] = useState(false)
  const [error, setError]                 = useState<string | null>(null)
  const [showRerun, setShowRerun]         = useState(false)

  const hasDiagnosis = !!localAutopsy.pathologist_diagnosis
  const isStreaming  = streamingText !== null

  const alreadyEchoed = useMemo(
    () => !!currentUserId && localAutopsy.autopsy_comments.some(c => c.author_id === currentUserId),
    [currentUserId, localAutopsy.autopsy_comments],
  )

  // ── Extract the [DIAGNOSIS] section from the accumulating raw stream ────────
  function extractSection(raw: string, key: string, nextKey?: string) {
    const esc = (s: string) => s.replace(/[[\]]/g, '\\$&')
    const pattern = nextKey
      ? new RegExp(`\\[${esc(key)}\\]:\\s*([\\s\\S]*?)(?:\\[${esc(nextKey)}\\]:|$)`)
      : new RegExp(`\\[${esc(key)}\\]:\\s*([\\s\\S]*)$`)
    return raw.match(pattern)?.[1]?.trim() ?? null
  }

  async function requestDiagnosis() {
    setDiagnosing(true)
    setStreamingText('')
    setError(null)
    setShowRerun(false)

    try {
      const res = await fetch(`/api/autopsies/${projectId}/diagnose`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to start diagnosis')
      if (!res.body) throw new Error('No response body')

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let sseBuffer = ''
      let rawAccum  = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        sseBuffer += decoder.decode(value, { stream: true })
        const lines = sseBuffer.split('\n')
        sseBuffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          let event: { type: string; [key: string]: unknown }
          try { event = JSON.parse(line.slice(6)) } catch { continue }

          if (event.type === 'chunk') {
            rawAccum += event.text as string
            // Live-display the diagnosis section as it streams in
            const live = extractSection(rawAccum, 'DIAGNOSIS', 'RECOMMENDATION')
            setStreamingText(live ?? rawAccum) // fall back to raw until marker appears
          }

          if (event.type === 'done') {
            setLocalAutopsy(prev => ({
              ...prev,
              official_cause:            event.official_cause as string | null,
              pathologist_diagnosis:     event.diagnosis as string,
              pathologist_recommendation: event.recommendation as string,
              resurrection_difficulty:   event.difficulty as 'easy' | 'moderate' | 'hard',
              difficulty_reason:         event.difficulty_reason as string | null,
              confidence_score:          event.confidence as number,
            }))
            setStreamingText(null)
          }

          if (event.type === 'error') {
            throw new Error(event.message as string)
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Diagnosis failed')
      setStreamingText(null)
    } finally {
      setDiagnosing(false)
    }
  }

  async function submitComment() {
    if (!commentText.trim() || !currentUserId) return
    setSubmittingComment(true)
    setError(null)
    try {
      const res = await fetch(`/api/autopsies/${projectId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentText,
          alternativeCauses: altCauses.length > 0 ? altCauses : null,
        }),
      })
      if (!res.ok) throw new Error('Failed to submit')
      const comment = await res.json()
      setLocalAutopsy(prev => ({
        ...prev,
        autopsy_comments: [...prev.autopsy_comments, comment],
        community_diagnosis_count: prev.community_diagnosis_count + 1,
      }))
      setCommentText('')
      setAltCauses([])
    } catch {
      setError('Failed to submit comment.')
    } finally {
      setSubmittingComment(false)
    }
  }

  const difficulty = localAutopsy.resurrection_difficulty
  const diffMeta   = difficulty ? DIFFICULTY_META[difficulty] : null

  return (
    <div className="card-void rounded-lg overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl text-bureau-text">Autopsy Report</h2>
          <p className="font-sans text-xs text-bureau-dim mt-0.5 uppercase tracking-wide">
            Claude AI Pathologist · {localAutopsy.community_diagnosis_count}{' '}
            community {localAutopsy.community_diagnosis_count !== 1 ? 'diagnoses' : 'diagnosis'}
          </p>
        </div>
        <span className="font-sans text-[10px] uppercase tracking-widest text-bureau-dim
                         border border-white/10 rounded px-2 py-1 flex-shrink-0">
          Ref: {localAutopsy.id.slice(0, 8).toUpperCase()}
        </span>
      </div>

      <div className="p-6 space-y-6">

        {/* ── AI Pathologist area ─────────────────────────────────────────── */}
        <AnimatePresence mode="wait">

          {/* No diagnosis yet */}
          {!hasDiagnosis && !isStreaming && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-10 border border-dashed border-white/10 rounded-lg"
            >
              <div className="w-12 h-12 mx-auto mb-4 rounded-full glass flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                     className="w-6 h-6 text-bureau-muted">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                </svg>
              </div>
              <h3 className="font-serif text-lg text-bureau-text mb-2">
                Pathologist not yet engaged
              </h3>
              <p className="font-sans text-sm text-bureau-muted mb-6 max-w-xs mx-auto leading-relaxed">
                The AI Pathologist will review the evidence and file a formal cause-of-death report.
              </p>
              {currentUserId ? (
                <button type="button" onClick={requestDiagnosis} className="btn-bureau">
                  Request Diagnosis
                </button>
              ) : (
                <p className="font-sans text-xs text-bureau-dim">Sign in to request a diagnosis.</p>
              )}
            </motion.div>
          )}

          {/* Streaming — pathologist is writing */}
          {isStreaming && (
            <motion.div
              key="streaming"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <p className="font-sans text-xs uppercase tracking-widest text-amber-500/80">
                  Pathologist examining evidence…
                </p>
              </div>
              <div className="glass rounded-lg p-5 min-h-[80px]">
                <p className="font-serif text-base text-bureau-text leading-relaxed whitespace-pre-wrap">
                  {streamingText}
                  <span className="ghost-letter-cursor" />
                </p>
              </div>
            </motion.div>
          )}

          {/* Diagnosis complete */}
          {hasDiagnosis && !isStreaming && (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              {/* Official cause banner */}
              {localAutopsy.official_cause && (
                <div className="rounded-lg px-5 py-3 bg-bureau-gold/[0.06] border border-bureau-gold/20
                                flex items-start gap-3">
                  <span className="font-sans text-[10px] uppercase tracking-widest text-bureau-gold/70
                                   mt-0.5 flex-shrink-0">Cause</span>
                  <p className="font-serif text-sm italic text-bureau-gold leading-relaxed">
                    {localAutopsy.official_cause}
                  </p>
                </div>
              )}

              {/* Diagnosis */}
              <div>
                <div className="flex items-center justify-between mb-2 gap-4">
                  <p className="font-sans text-[10px] uppercase tracking-widest text-bureau-dim">
                    Pathologist&apos;s Diagnosis
                  </p>
                  {localAutopsy.confidence_score !== null && (
                    <div className="w-52 flex-shrink-0">
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
                    Recommendation for Adopter
                  </p>
                  <div className="rounded-lg p-5 bg-bureau-gold/[0.04] border border-bureau-gold/15">
                    <p className="font-sans text-sm text-bureau-gold/75 leading-relaxed">
                      {localAutopsy.pathologist_recommendation}
                    </p>
                  </div>
                </div>
              )}

              {/* Resurrection difficulty */}
              {diffMeta && (
                <div>
                  <p className="font-sans text-[10px] uppercase tracking-widest text-bureau-dim mb-2">
                    Resurrection Difficulty
                  </p>
                  <div className="glass rounded-lg p-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className={`font-sans text-sm font-semibold ${diffMeta.color}`}>
                        {diffMeta.label}
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${diffMeta.bar}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${diffMeta.pct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                      />
                    </div>
                    {localAutopsy.difficulty_reason && (
                      <p className="font-sans text-xs text-bureau-dim leading-relaxed">
                        {localAutopsy.difficulty_reason}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Re-run */}
              {currentUserId && (
                <div>
                  {showRerun ? (
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/5">
                      <p className="font-sans text-xs text-bureau-muted flex-1">
                        This will overwrite the current report.
                      </p>
                      <button
                        type="button"
                        onClick={requestDiagnosis}
                        disabled={diagnosing}
                        className="font-sans text-xs text-amber-500 hover:text-amber-400 transition-colors shrink-0"
                      >
                        {diagnosing ? 'Examining…' : 'Confirm re-run'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowRerun(false)}
                        className="font-sans text-xs text-bureau-dim hover:text-bureau-muted transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowRerun(true)}
                      className="font-sans text-xs text-bureau-dim hover:text-bureau-muted transition-colors"
                    >
                      Request new diagnosis →
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>

        {error && <p className="font-sans text-xs text-red-400">{error}</p>}

        {/* ── Community Diagnoses ─────────────────────────────────────────── */}
        <div className="border-t border-white/10 pt-5 space-y-4">
          <h3 className="font-serif text-base text-bureau-text">
            Community Diagnoses
            <span className="font-sans text-xs text-bureau-dim ml-2 font-normal">
              ({localAutopsy.community_diagnosis_count})
            </span>
          </h3>

          {localAutopsy.autopsy_comments.length > 0 && (
            <div className="space-y-3">
              {localAutopsy.autopsy_comments.map(comment => (
                <div key={comment.id} className="glass rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-sans text-xs font-semibold text-bureau-muted">
                      {comment.profiles?.display_name ?? comment.profiles?.username ?? 'Anonymous'}
                      {comment.author_id === currentUserId && (
                        <span className="ml-2 text-bureau-dim font-normal">(you)</span>
                      )}
                    </span>
                    <span className="font-sans text-[10px] text-bureau-dim">
                      {formatRelative(comment.created_at)}
                    </span>
                  </div>
                  <p className="font-sans text-sm text-bureau-text leading-relaxed">
                    {comment.comment_text}
                  </p>
                  {comment.alternative_causes && comment.alternative_causes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3 items-center">
                      <span className="font-sans text-[10px] uppercase tracking-widest text-bureau-dim mr-1">
                        Suspects:
                      </span>
                      {comment.alternative_causes.map(cause => (
                        <span key={cause} className="cause-tag">{cause}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Comment form */}
          {currentUserId ? (
            alreadyEchoed ? (
              <p className="font-sans text-xs text-center text-bureau-dim py-4
                             border border-dashed border-white/10 rounded-lg">
                You&apos;ve already left your diagnosis. Thank you for contributing.
              </p>
            ) : (
              <div className="space-y-3 pt-1">
                <label htmlFor="autopsy-comment" className="sr-only">Your diagnosis</label>
                <textarea
                  id="autopsy-comment"
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Share your diagnosis or perspective on why this project was abandoned…"
                  rows={3}
                  className="input-bureau resize-none leading-relaxed"
                />
                <CausesChips selected={altCauses} onChange={setAltCauses} />
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
            )
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
