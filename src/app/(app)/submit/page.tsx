'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import {
  CAUSES_OF_DEATH, PROJECT_TYPES, ADOPTION_TYPES,
  type CauseOfDeath, type ProjectType, type AdoptionType,
} from '@/lib/types/database'
import PageWrapper from '@/components/bureau/PageWrapper'
import CorpseUploadZone from '@/components/bureau/CorpseUploadZone'
import CauseOfDeathSelector from '@/components/bureau/CauseOfDeathSelector'
import AdoptionTermsPicker from '@/components/bureau/AdoptionTermsPicker'
import { formatFileSize } from '@/lib/utils/format'

const STEPS = [
  { id: 1, label: 'The Departed',    description: 'Name and describe what was lost' },
  { id: 2, label: 'Time of Death',   description: 'When did it live and die?' },
  { id: 3, label: 'Cause of Death',  description: 'What killed it?' },
  { id: 4, label: 'The Remains',     description: 'Upload whatever files exist' },
  { id: 5, label: 'Ghost Letter',    description: 'Optional words from its creator' },
  { id: 6, label: 'Adoption Terms',  description: 'How can others take it?' },
]

interface FormData {
  title: string
  description: string
  projectType: ProjectType | ''
  startedAt: string
  diedAt: string
  causesOfDeath: CauseOfDeath[]
  files: File[]
  ghostLetter: string
  adoptionType: AdoptionType | ''
  adoptionPrice: string
  isPublic: boolean
  agreeToTerms: boolean
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
}

export default function SubmitPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep]         = useState(1)
  const [direction, setDir]     = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const [form, setForm] = useState<FormData>({
    title: '', description: '', projectType: '',
    startedAt: '', diedAt: new Date().toISOString().split('T')[0],
    causesOfDeath: [], files: [], ghostLetter: '',
    adoptionType: '', adoptionPrice: '', isPublic: true, agreeToTerms: false,
  })

  const onAdd = useCallback((newFiles: File[]) => {
    setForm((p) => ({ ...p, files: [...p.files, ...newFiles].slice(0, 10) }))
  }, [])

  const onRemove = useCallback((i: number) => {
    setForm((p) => ({ ...p, files: p.files.filter((_, idx) => idx !== i) }))
  }, [])

  function canAdvance(): boolean {
    switch (step) {
      case 1: return !!form.title.trim() && !!form.projectType
      case 2: return !!form.diedAt
      case 3: return form.causesOfDeath.length > 0
      case 4: return true
      case 5: return true
      case 6: return !!form.adoptionType && form.agreeToTerms
      default: return false
    }
  }

  function goTo(next: number) {
    setDir(next > step ? 1 : -1)
    setStep(next)
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Please sign in first')

      const uploadedFiles: { name: string; type: string; size: number; path: string }[] = []
      for (const file of form.files) {
        const path = `${user.id}/${Date.now()}-${file.name}`
        const { error: uploadError } = await supabase.storage.from('project-files').upload(path, file)
        if (uploadError) throw uploadError
        uploadedFiles.push({ name: file.name, type: file.type, size: file.size, path })
      }

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title, description: form.description, projectType: form.projectType,
          startedAt: form.startedAt || null, diedAt: form.diedAt,
          causesOfDeath: form.causesOfDeath, ghostLetter: form.ghostLetter || null,
          adoptionType: form.adoptionType,
          adoptionPrice: form.adoptionPrice ? parseFloat(form.adoptionPrice) : null,
          isPublic: form.isPublic, files: uploadedFiles,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to submit project')
      }
      const { id } = await res.json()
      router.push(`/morgue/${id}?submitted=true`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSubmitting(false)
    }
  }

  const progress = ((step - 1) / (STEPS.length - 1)) * 100

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto px-6 md:px-12 py-16">

        {/* Header */}
        <div className="text-center mb-12">
          <p className="font-sans text-[11px] uppercase tracking-widest text-bureau-gold mb-3">
            The Bureau
          </p>
          <h1 className="font-serif text-4xl text-bureau-text mb-2">File a Corpse</h1>
          <p className="font-sans text-sm text-bureau-muted">
            Give your abandoned project the dignity it deserves.
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-10">
          {/* Step dots */}
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center flex-1">
                <button
                  type="button"
                  onClick={() => s.id < step && goTo(s.id)}
                  className={`relative w-8 h-8 rounded-full border flex-shrink-0
                             flex items-center justify-center font-sans text-xs font-bold
                             transition-all duration-300 cursor-default
                             ${s.id < step
                               ? 'border-bureau-gold bg-bureau-gold text-black cursor-pointer'
                               : s.id === step
                               ? 'border-bureau-gold text-bureau-gold bg-transparent'
                               : 'border-white/15 text-bureau-dim bg-transparent'}`}
                >
                  {s.id < step ? '✓' : s.id}
                  {s.id === step && (
                    <span className="absolute inset-0 rounded-full border border-bureau-gold/40 animate-ping" />
                  )}
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`h-px flex-1 mx-1 transition-colors duration-500
                    ${s.id < step ? 'bg-bureau-gold' : 'bg-white/10'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Label */}
          <div className="text-center">
            <p className="font-serif text-lg text-bureau-text">{STEPS[step - 1].label}</p>
            <p className="font-sans text-xs text-bureau-dim">{STEPS[step - 1].description}</p>
          </div>

          {/* Progress line */}
          <div className="mt-4 h-0.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-bureau-gold rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="card-void rounded-lg p-6 md:p-8 mb-6 overflow-hidden min-h-[280px]">
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Step 1: Project info */}
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <label htmlFor="project-title" className="block font-sans text-[10px] uppercase tracking-widest text-bureau-dim mb-2">
                      Project Name *
                    </label>
                    <input
                      id="project-title"
                      value={form.title}
                      onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                      placeholder="What was it called?"
                      className="input-bureau"
                    />
                  </div>
                  <div>
                    <label htmlFor="project-description" className="block font-sans text-[10px] uppercase tracking-widest text-bureau-dim mb-2">
                      Description
                    </label>
                    <textarea
                      id="project-description"
                      value={form.description}
                      onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                      placeholder="What was it supposed to be? What problem did it try to solve?"
                      rows={4}
                      className="input-bureau resize-none"
                    />
                  </div>
                  <div>
                    <label className="block font-sans text-[10px] uppercase tracking-widest text-bureau-dim mb-2">
                      Project Type *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {PROJECT_TYPES.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setForm((p) => ({ ...p, projectType: type }))}
                          className={`px-3 py-2 rounded border font-sans text-xs transition-all
                            ${form.projectType === type
                              ? 'border-bureau-gold/50 bg-bureau-gold/8 text-bureau-gold'
                              : 'border-white/10 text-bureau-muted hover:border-white/20'}`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Dates */}
              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <label htmlFor="started-at" className="block font-sans text-[10px] uppercase tracking-widest text-bureau-dim mb-2">
                      Started (approximate)
                    </label>
                    <input
                      id="started-at"
                      type="date"
                      value={form.startedAt}
                      onChange={(e) => setForm((p) => ({ ...p, startedAt: e.target.value }))}
                      className="input-bureau"
                    />
                  </div>
                  <div>
                    <label htmlFor="died-at" className="block font-sans text-[10px] uppercase tracking-widest text-bureau-dim mb-2">
                      Date of Death *
                    </label>
                    <input
                      id="died-at"
                      type="date"
                      value={form.diedAt}
                      onChange={(e) => setForm((p) => ({ ...p, diedAt: e.target.value }))}
                      max={new Date().toISOString().split('T')[0]}
                      className="input-bureau"
                    />
                  </div>
                  {form.startedAt && form.diedAt && (
                    <p className="font-sans text-sm text-center text-bureau-muted">
                      It lived for approximately{' '}
                      <span className="text-bureau-gold">
                        {Math.max(0, Math.round(
                          (new Date(form.diedAt).getTime() - new Date(form.startedAt).getTime())
                          / (1000 * 60 * 60 * 24 * 30)
                        ))} months
                      </span>
                    </p>
                  )}
                </div>
              )}

              {/* Step 3: Cause of death */}
              {step === 3 && (
                <CauseOfDeathSelector
                  causes={CAUSES_OF_DEATH}
                  selected={form.causesOfDeath}
                  onChange={(c) => setForm((p) => ({ ...p, causesOfDeath: c }))}
                />
              )}

              {/* Step 4: Files */}
              {step === 4 && (
                <CorpseUploadZone
                  files={form.files}
                  onAdd={onAdd}
                  onRemove={onRemove}
                />
              )}

              {/* Step 5: Ghost letter */}
              {step === 5 && (
                <div>
                  <p className="font-sans text-sm text-bureau-muted mb-4 leading-relaxed">
                    A ghost letter is your last words about this project. What did you hope it would
                    become? What do you want its next owner to know? This is optional and purely human.
                  </p>
                  <label htmlFor="ghost-letter" className="sr-only">Ghost letter</label>
                  <textarea
                    id="ghost-letter"
                    value={form.ghostLetter}
                    onChange={(e) => setForm((p) => ({ ...p, ghostLetter: e.target.value }))}
                    placeholder="Dear whoever finds this…"
                    rows={8}
                    className="input-bureau ghost-text resize-none leading-[1.85]"
                  />
                  <p className="font-sans text-xs text-bureau-dim mt-2">
                    {form.ghostLetter.length}/1000 characters
                  </p>
                </div>
              )}

              {/* Step 6: Adoption terms */}
              {step === 6 && (
                <div className="space-y-5">
                  <AdoptionTermsPicker
                    value={form.adoptionType}
                    price={form.adoptionPrice}
                    onChange={(t) => setForm((p) => ({ ...p, adoptionType: t }))}
                    onPriceChange={(v) => setForm((p) => ({ ...p, adoptionPrice: v }))}
                  />

                  <div className="section-divider" />

                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={form.isPublic}
                        onChange={(e) => setForm((p) => ({ ...p, isPublic: e.target.checked }))}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-all
                        ${form.isPublic ? 'border-bureau-gold bg-bureau-gold/15' : 'border-white/10'}`}>
                        {form.isPublic && <span className="text-bureau-gold text-[10px]">✓</span>}
                      </div>
                    </div>
                    <span className="font-sans text-sm text-bureau-muted">
                      List publicly in the morgue
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <div className="relative mt-0.5 flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={form.agreeToTerms}
                        onChange={(e) => setForm((p) => ({ ...p, agreeToTerms: e.target.checked }))}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-all
                        ${form.agreeToTerms ? 'border-bureau-gold bg-bureau-gold/15' : 'border-white/10'}`}>
                        {form.agreeToTerms && <span className="text-bureau-gold text-[10px]">✓</span>}
                      </div>
                    </div>
                    <span className="font-sans text-xs text-bureau-muted leading-relaxed">
                      I confirm this project is mine to submit and I agree to the Bureau&apos;s
                      terms of service. Filing a corpse does not transfer copyright unless an
                      explicit adoption agreement is signed.
                    </span>
                  </label>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Error */}
        {error && (
          <div className="card-red rounded p-3 mb-4">
            <p className="font-sans text-xs text-red-400">{error}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => goTo(step - 1)}
            disabled={step === 1}
            className="font-sans text-xs text-bureau-muted hover:text-bureau-text
                       transition-colors disabled:opacity-30 disabled:cursor-not-allowed
                       uppercase tracking-wide"
          >
            ← Back
          </button>

          {step < STEPS.length ? (
            <button
              type="button"
              onClick={() => goTo(step + 1)}
              disabled={!canAdvance()}
              className="btn-bureau disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canAdvance() || submitting}
              className="btn-bureau disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Filing corpse…
                </span>
              ) : 'File the Corpse'}
            </button>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
