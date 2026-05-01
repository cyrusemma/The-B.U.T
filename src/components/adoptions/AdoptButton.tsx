'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import type { Project } from '@/lib/types/database'

interface AdoptButtonProps {
  project: Project
  currentUserId: string
}

export default function AdoptButton({ project, currentUserId }: AdoptButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isPaid = project.adoption_type === 'resurrection_rights' && project.adoption_price

  const label =
    project.adoption_type === 'open_casket'   ? 'Adopt — Open Casket (Free)'
    : project.adoption_type === 'organ_donor' ? 'Adopt — Organ Donor (Free)'
    : `Adopt — Resurrection Rights ($${project.adoption_price})`

  const description =
    project.adoption_type === 'open_casket'
      ? 'This project is freely available. Use, modify, and build upon it however you like.'
      : project.adoption_type === 'organ_donor'
      ? 'Take parts of this project for your own work. Please credit the original creator.'
      : `You will receive exclusive rights to revive this project. The creator receives 90% ($${((project.adoption_price ?? 0) * 0.9).toFixed(2)}).`

  async function handleAdopt() {
    if (!agreed) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/adoptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Adoption failed')
      }
      const { id: adoptionId, checkoutUrl } = await res.json()
      if (checkoutUrl) {
        window.location.href = checkoutUrl
      } else {
        router.push(`/adoption/${adoptionId}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <AnimatePresence mode="wait">
      {!open ? (
        <motion.div
          key="prompt"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.25 }}
          className="card-void rounded-lg p-6"
        >
          <h3 className="font-serif text-xl text-bureau-gold mb-1">
            Adopt this Project
          </h3>
          <p className="font-sans text-sm text-bureau-muted mb-5 leading-relaxed">
            {description}
          </p>
          <button type="button" onClick={() => setOpen(true)} className="btn-bureau w-full">
            {label}
          </button>
        </motion.div>
      ) : (
        <motion.div
          key="confirm"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.25 }}
          className="card-gold rounded-lg p-6"
        >
          <h3 className="font-serif text-xl text-bureau-gold mb-4">
            Confirm Adoption
          </h3>

          <div className="glass rounded p-4 mb-5 font-sans text-sm leading-relaxed text-bureau-muted">
            {description}
          </div>

          {isPaid && (
            <div className="rounded p-4 mb-5 bg-bureau-gold/[0.06] border border-bureau-gold/25">
              <p className="font-sans text-sm font-semibold text-bureau-gold mb-0.5">
                Payment Required
              </p>
              <p className="font-sans text-xs text-bureau-gold/60">
                ${project.adoption_price} USD · Processed securely via Stripe
              </p>
            </div>
          )}

          <label className="flex items-start gap-3 mb-5 cursor-pointer">
            <div className="relative mt-0.5 flex-shrink-0">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-all
                ${agreed
                  ? 'border-bureau-gold bg-bureau-gold/15'
                  : 'border-white/10 bg-transparent'}`}
              >
                {agreed && <span className="text-bureau-gold text-[10px] leading-none">✓</span>}
              </div>
            </div>
            <span className="font-sans text-xs leading-relaxed text-bureau-muted">
              I agree to the Bureau&apos;s adoption terms. By adopting this project I take
              responsibility for its revival and will respect the original creator&apos;s intent.
            </span>
          </label>

          {error && (
            <p className="font-sans text-xs mb-4 text-red-400">{error}</p>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={() => setOpen(false)} className="btn-bureau-outline flex-1">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdopt}
              disabled={!agreed || loading}
              className="btn-bureau flex-1"
            >
              {loading ? (
                <span className="flex items-center gap-2 justify-center">
                  <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Processing…
                </span>
              ) : isPaid ? 'Pay & Adopt' : 'Confirm Adoption'}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
