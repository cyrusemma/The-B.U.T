'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/lib/supabase/client'
import {
  CAUSES_OF_DEATH,
  PROJECT_TYPES,
  ADOPTION_TYPES,
  type CauseOfDeath,
  type ProjectType,
  type AdoptionType,
} from '@/lib/types/database'
import { formatFileSize } from '@/lib/utils/format'

const STEPS = [
  { id: 1, label: 'The Departed', description: 'Name and describe what was lost' },
  { id: 2, label: 'Time of Death', description: 'When did it live and die?' },
  { id: 3, label: 'Cause of Death', description: 'What killed it?' },
  { id: 4, label: 'The Remains', description: 'Upload whatever files exist' },
  { id: 5, label: 'Ghost Letter', description: 'Optional words from its creator' },
  { id: 6, label: 'Adoption Terms', description: 'How can others take it?' },
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

export default function SubmitPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<FormData>({
    title: '',
    description: '',
    projectType: '',
    startedAt: '',
    diedAt: new Date().toISOString().split('T')[0],
    causesOfDeath: [],
    files: [],
    ghostLetter: '',
    adoptionType: '',
    adoptionPrice: '',
    isPublic: true,
    agreeToTerms: false,
  })

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setForm((prev) => ({
      ...prev,
      files: [...prev.files, ...acceptedFiles].slice(0, 10),
    }))
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true,
  })

  function toggleCause(cause: CauseOfDeath) {
    setForm((prev) => {
      const exists = prev.causesOfDeath.includes(cause)
      if (exists) {
        return { ...prev, causesOfDeath: prev.causesOfDeath.filter((c) => c !== cause) }
      }
      if (prev.causesOfDeath.length >= 3) return prev
      return { ...prev, causesOfDeath: [...prev.causesOfDeath, cause] }
    })
  }

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

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Please sign in first')

      // Upload files to storage
      const uploadedFiles: { name: string; type: string; size: number; path: string }[] = []
      for (const file of form.files) {
        const path = `${user.id}/${Date.now()}-${file.name}`
        const { error: uploadError } = await supabase.storage
          .from('project-files')
          .upload(path, file)
        if (uploadError) throw uploadError
        uploadedFiles.push({
          name: file.name,
          type: file.type,
          size: file.size,
          path,
        })
      }

      // Create project via API
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          projectType: form.projectType,
          startedAt: form.startedAt || null,
          diedAt: form.diedAt,
          causesOfDeath: form.causesOfDeath,
          ghostLetter: form.ghostLetter || null,
          adoptionType: form.adoptionType,
          adoptionPrice: form.adoptionPrice ? parseFloat(form.adoptionPrice) : null,
          isPublic: form.isPublic,
          files: uploadedFiles,
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

  return (
    <div className="min-h-screen px-4 py-12" style={{ background: '#0f172a' }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="font-serif text-4xl text-slate-100 mb-2">File a Corpse</h1>
          <p className="text-slate-500 font-sans text-sm">
            Give your abandoned project the dignity it deserves.
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between mb-8 px-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <button
                onClick={() => s.id < step && setStep(s.id)}
                className={`w-8 h-8 rounded-full border text-xs font-semibold flex items-center justify-center transition-all ${
                  s.id < step
                    ? 'border-amber-600 bg-amber-600 text-slate-950 cursor-pointer'
                    : s.id === step
                    ? 'border-amber-600 text-amber-500 bg-transparent'
                    : 'border-slate-700 text-slate-600 bg-transparent cursor-default'
                }`}
              >
                {s.id < step ? '✓' : s.id}
              </button>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-px w-full min-w-[20px] mx-1 transition-colors ${
                    s.id < step ? 'bg-amber-600/60' : 'bg-slate-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step info */}
        <div className="mb-6">
          <h2 className="font-serif text-xl text-slate-200">{STEPS[step - 1].label}</h2>
          <p className="text-slate-500 text-sm">{STEPS[step - 1].description}</p>
        </div>

        {/* Step content */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 mb-6">
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">
                  Project Name *
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="What was it called?"
                  className="w-full bg-slate-800 border border-slate-700 rounded-md px-4 py-3
                             text-slate-100 placeholder-slate-600 text-sm focus:outline-none
                             focus:border-amber-600/60 focus:ring-1 focus:ring-amber-600/30"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="What was it supposed to be? What problem did it try to solve?"
                  rows={4}
                  className="w-full bg-slate-800 border border-slate-700 rounded-md px-4 py-3
                             text-slate-100 placeholder-slate-600 text-sm focus:outline-none
                             focus:border-amber-600/60 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">
                  Project Type *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PROJECT_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => setForm((p) => ({ ...p, projectType: type }))}
                      className={`px-3 py-2 rounded border text-sm transition-all ${
                        form.projectType === type
                          ? 'border-amber-600 bg-amber-600/10 text-amber-400'
                          : 'border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">
                  Started (approximate)
                </label>
                <input
                  type="date"
                  value={form.startedAt}
                  onChange={(e) => setForm((p) => ({ ...p, startedAt: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-md px-4 py-3
                             text-slate-100 text-sm focus:outline-none focus:border-amber-600/60"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">
                  Date of Death *
                </label>
                <input
                  type="date"
                  value={form.diedAt}
                  onChange={(e) => setForm((p) => ({ ...p, diedAt: e.target.value }))}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full bg-slate-800 border border-slate-700 rounded-md px-4 py-3
                             text-slate-100 text-sm focus:outline-none focus:border-amber-600/60"
                />
              </div>
              {form.startedAt && form.diedAt && (
                <p className="text-slate-500 text-sm text-center">
                  It lived for approximately{' '}
                  <span className="text-amber-500">
                    {Math.max(0, Math.round(
                      (new Date(form.diedAt).getTime() - new Date(form.startedAt).getTime()) /
                      (1000 * 60 * 60 * 24 * 30)
                    ))} months
                  </span>
                </p>
              )}
            </div>
          )}

          {step === 3 && (
            <div>
              <p className="text-slate-500 text-sm mb-4">
                Select up to 3 causes. Be honest.
              </p>
              <div className="grid grid-cols-1 gap-2">
                {CAUSES_OF_DEATH.map((cause) => {
                  const selected = form.causesOfDeath.includes(cause)
                  const disabled = !selected && form.causesOfDeath.length >= 3
                  return (
                    <button
                      key={cause}
                      onClick={() => toggleCause(cause)}
                      disabled={disabled}
                      className={`px-4 py-3 rounded border text-left text-sm transition-all
                                  disabled:opacity-40 disabled:cursor-not-allowed ${
                        selected
                          ? 'border-amber-600 bg-amber-600/10 text-amber-400'
                          : 'border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      {selected && <span className="mr-2">✓</span>}
                      {cause}
                    </button>
                  )
                })}
              </div>
              {form.causesOfDeath.length > 0 && (
                <p className="mt-3 text-slate-600 text-xs">
                  Selected: {form.causesOfDeath.join(', ')}
                </p>
              )}
            </div>
          )}

          {step === 4 && (
            <div>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-all ${
                  isDragActive
                    ? 'border-amber-600 bg-amber-600/5'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <input {...getInputProps()} />
                <div className="text-4xl mb-3 text-slate-600">📁</div>
                <p className="text-slate-400 font-sans text-sm mb-1">
                  {isDragActive ? 'Drop the remains here…' : 'Drag files, or click to browse'}
                </p>
                <p className="text-slate-600 text-xs">
                  Any file type • Max 50MB each • Up to 10 files
                </p>
              </div>

              {form.files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {form.files.map((file, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-slate-800 rounded px-3 py-2"
                    >
                      <div>
                        <p className="text-slate-300 text-sm">{file.name}</p>
                        <p className="text-slate-600 text-xs">{formatFileSize(file.size)}</p>
                      </div>
                      <button
                        onClick={() =>
                          setForm((p) => ({ ...p, files: p.files.filter((_, idx) => idx !== i) }))
                        }
                        className="text-slate-600 hover:text-red-400 transition-colors text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p className="mt-3 text-slate-600 text-xs text-center">
                No files? That&apos;s okay. Even a description is worth preserving.
              </p>
            </div>
          )}

          {step === 5 && (
            <div>
              <p className="text-slate-500 text-sm mb-4">
                A ghost letter is your last words about this project. What did you hope it would
                become? What do you want its next owner to know? This is optional and purely human.
              </p>
              <textarea
                value={form.ghostLetter}
                onChange={(e) => setForm((p) => ({ ...p, ghostLetter: e.target.value }))}
                placeholder="Dear whoever finds this…"
                rows={8}
                className="w-full bg-slate-800 border border-slate-700 rounded-md px-4 py-3
                           text-slate-100 placeholder-slate-600 text-sm font-serif italic
                           focus:outline-none focus:border-amber-600/60 resize-none leading-relaxed"
              />
              <p className="mt-2 text-slate-600 text-xs">
                {form.ghostLetter.length}/1000 characters
              </p>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-5">
              <div>
                <p className="text-slate-400 text-sm mb-3">
                  How should others be allowed to use this project?
                </p>
                <div className="space-y-2">
                  {ADOPTION_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setForm((p) => ({ ...p, adoptionType: type.value }))}
                      className={`w-full px-4 py-3 rounded border text-left transition-all ${
                        form.adoptionType === type.value
                          ? 'border-amber-600 bg-amber-600/10'
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-medium text-sm ${
                            form.adoptionType === type.value ? 'text-amber-400' : 'text-slate-300'
                          }`}
                        >
                          {type.label}
                        </span>
                        {type.price === 'custom' && (
                          <span className="text-xs text-amber-600 border border-amber-600/40 rounded px-2 py-0.5">
                            Paid
                          </span>
                        )}
                        {type.price === null && (
                          <span className="text-xs text-green-600 border border-green-600/40 rounded px-2 py-0.5">
                            Free
                          </span>
                        )}
                      </div>
                      <p className="text-slate-500 text-xs mt-0.5">{type.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {form.adoptionType === 'resurrection_rights' && (
                <div>
                  <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">
                    Price (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-500 text-sm">$</span>
                    <input
                      type="number"
                      value={form.adoptionPrice}
                      onChange={(e) => setForm((p) => ({ ...p, adoptionPrice: e.target.value }))}
                      placeholder="0.00"
                      min="1"
                      step="1"
                      className="w-full bg-slate-800 border border-slate-700 rounded-md pl-8 pr-4 py-3
                                 text-slate-100 text-sm focus:outline-none focus:border-amber-600/60"
                    />
                  </div>
                  <p className="text-slate-600 text-xs mt-1">
                    Bureau takes 10%. You receive 90%.
                  </p>
                </div>
              )}

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isPublic}
                    onChange={(e) => setForm((p) => ({ ...p, isPublic: e.target.checked }))}
                    className="w-4 h-4 accent-amber-600"
                  />
                  <span className="text-slate-400 text-sm">List publicly in the morgue</span>
                </label>
              </div>

              <div className="border-t border-slate-700 pt-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.agreeToTerms}
                    onChange={(e) => setForm((p) => ({ ...p, agreeToTerms: e.target.checked }))}
                    className="w-4 h-4 mt-0.5 accent-amber-600"
                  />
                  <span className="text-slate-400 text-sm leading-relaxed">
                    I confirm this project is mine to submit and I agree to the Bureau&apos;s
                    terms of service. I acknowledge that filing a corpse does not transfer copyright
                    unless an explicit adoption agreement is signed.
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-3 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="text-slate-500 hover:text-slate-300 text-sm transition-colors
                       disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Back
          </button>

          {step < STEPS.length ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canAdvance()}
              className="btn-bureau disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canAdvance() || submitting}
              className="btn-bureau disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? 'Filing corpse…' : 'File the Corpse'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
