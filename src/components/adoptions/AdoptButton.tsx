'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Loader2 } from 'lucide-react'
import { formatGHc } from '@/lib/paystack'
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
    : `Adopt — Resurrection Rights (${formatGHc(project.adoption_price || 0)})`

  const creatorShare = project.adoption_price ? project.adoption_price * 0.9 : 0

  const description =
    project.adoption_type === 'open_casket'
      ? 'This project is freely available. Use, modify, and build upon it however you like.'
      : project.adoption_type === 'organ_donor'
      ? 'Take parts of this project for your own work. Please credit the original creator.'
      : `You will receive exclusive rights to revive this project. The creator receives 90% (${formatGHc(creatorShare)}).`

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
          className="glass-morphism rounded-lg p-6 border border-white/10"
        >
          <h3 className="font-serif text-xl text-amber-500 mb-2">
            Adopt this Project
          </h3>
          <p className="font-sans text-sm text-slate-300 mb-5 leading-relaxed">
            {description}
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-sans text-sm font-bold uppercase tracking-wide transition-all"
          >
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
          className="glass-morphism rounded-lg p-6 border border-amber-500/30 bg-amber-500/5"
        >
          <h3 className="font-serif text-xl text-amber-500 mb-4">
            Confirm Adoption
          </h3>

          <div className="glass-morphism rounded-lg p-4 mb-5 font-sans text-sm leading-relaxed text-slate-300 border border-white/10">
            {description}
          </div>

          {isPaid && (
            <div className="rounded-lg p-4 mb-5 bg-amber-600/10 border border-amber-600/30">
              <p className="font-sans text-sm font-semibold text-amber-400 mb-1">
                Payment Required
              </p>
              <p className="font-sans text-xs text-amber-400/80">
                {formatGHc(project.adoption_price || 0)} GHc · Processed securely via Paystack
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
              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all
                ${agreed
                  ? 'border-amber-500 bg-amber-500/20'
                  : 'border-white/20 bg-transparent'}`}
              >
                {agreed && <span className="text-amber-400 text-[10px] leading-none">✓</span>}
              </div>
            </div>
            <span className="font-sans text-xs leading-relaxed text-slate-300">
              I agree to the Bureau&apos;s adoption terms. By adopting this project I take
              responsibility for its revival and will respect the original creator&apos;s intent.
            </span>
          </label>

          {error && (
            <div className="flex items-start gap-3 mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="font-sans text-xs text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-slate-300 font-sans text-sm font-semibold hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdopt}
              disabled={!agreed || loading}
              className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-sans text-sm font-bold uppercase tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing…
                </>
              ) : (
                'Confirm Adoption'
              )}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
