'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
    project.adoption_type === 'open_casket' ? 'Adopt — Open Casket (Free)'
    : project.adoption_type === 'organ_donor' ? 'Adopt — Organ Donor (Free)'
    : `Adopt — Resurrection Rights ($${project.adoption_price})`

  const description =
    project.adoption_type === 'open_casket'
      ? 'This project is freely available. You can use, modify, and build upon it however you like.'
      : project.adoption_type === 'organ_donor'
      ? 'You can take parts of this project to use in your own work. Please credit the original creator.'
      : `You will receive exclusive rights to revive this project. The creator will receive 90% of the payment ($${((project.adoption_price ?? 0) * 0.9).toFixed(2)}).`

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
          creatorId: project.creator_id,
          adoptionType: project.adoption_type,
          pricePaid: project.adoption_price,
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
    <>
      {!open ? (
        <div className="bg-slate-900 border border-amber-700/30 rounded-xl p-6">
          <h3 className="font-serif text-xl text-amber-300 mb-2">Adopt this Project</h3>
          <p className="text-slate-400 text-sm mb-5">{description}</p>
          <button onClick={() => setOpen(true)} className="btn-bureau w-full">
            {label}
          </button>
        </div>
      ) : (
        <div className="bg-slate-900 border border-amber-700/40 rounded-xl p-6">
          <h3 className="font-serif text-xl text-amber-300 mb-4">Confirm Adoption</h3>

          <div className="bg-slate-800/60 rounded-lg p-4 mb-5 text-sm text-slate-400 leading-relaxed">
            {description}
          </div>

          {isPaid && (
            <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-4 mb-5">
              <p className="text-amber-300 text-sm font-medium mb-1">Payment Required</p>
              <p className="text-amber-500/70 text-sm">
                ${project.adoption_price} USD · Processed securely via Stripe
              </p>
            </div>
          )}

          <label className="flex items-start gap-3 mb-5 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-amber-600"
            />
            <span className="text-slate-400 text-sm leading-relaxed">
              I agree to the Bureau&apos;s adoption terms. I understand that by adopting this
              project, I am taking responsibility for its revival and will respect the original
              creator&apos;s intent where specified.
            </span>
          </label>

          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

          <div className="flex gap-3">
            <button
              onClick={() => setOpen(false)}
              className="flex-1 py-2.5 rounded border border-slate-700 text-slate-400 text-sm
                         hover:border-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAdopt}
              disabled={!agreed || loading}
              className="flex-1 btn-bureau disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing…' : isPaid ? 'Pay & Adopt' : 'Confirm Adoption'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
