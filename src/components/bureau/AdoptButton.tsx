'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { HeartHandshake } from 'lucide-react'

interface AdoptButtonProps {
  projectId: string
  adoptionType: string
  price: number | null
}

export default function AdoptButton({ projectId, adoptionType, price }: AdoptButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isPaid = adoptionType === 'resurrection_rights' && typeof price === 'number' && price > 0
  const label = isPaid ? `Adopt for $${price}` : 'Adopt This Project'

  async function handleAdopt() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/adoptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Could not start adoption')
        return
      }

      // Paid: redirect to Stripe checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
        return
      }

      // Free: go straight to the adoption chat
      router.push(`/adoption/${data.id}`)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full space-y-1.5">
      <button
        type="button"
        onClick={handleAdopt}
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 bg-bureau-gold hover:bg-amber-400
                   text-black font-semibold text-xs px-4 py-2.5 rounded-lg transition-all duration-200
                   hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(217,119,6,0.40)]
                   disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
      >
        {loading ? (
          <>
            <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            Processing…
          </>
        ) : (
          <>
            <HeartHandshake size={14} />
            {label}
          </>
        )}
      </button>

      {error && (
        <p className="font-sans text-[0.65rem] text-red-400 text-center">{error}</p>
      )}
    </div>
  )
}
