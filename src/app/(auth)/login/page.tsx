'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]     = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) { setError(error.message) } else { setSent(true) }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-bureau-void flex items-center justify-center px-6 relative overflow-hidden">

      {/* Grain overlay */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[1] opacity-[0.04] page-grain" />

      {/* Resurrection beam */}
      <div aria-hidden="true" className="resurrection-beam opacity-60" />

      {/* Particle dots */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
        {['top-[12%] left-[10%]', 'top-[70%] left-[85%]', 'top-[45%] left-[92%]',
          'top-[80%] left-[20%]', 'top-[20%] left-[78%]', 'top-[55%] left-[5%]'].map((pos, i) => (
          <div key={i} className={`absolute w-1 h-1 rounded-full bg-white/10 ${pos}`} />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="tombstone w-14 h-16 border border-bureau-gold/40 flex items-end justify-center pb-3">
              <div className="w-0.5 h-5 bg-bureau-gold/60 rounded-full" />
            </div>
          </div>
          <h1 className="font-serif text-3xl text-bureau-text mb-1">The Bureau</h1>
          <p className="font-sans text-sm text-bureau-dim">of Unfinished Things</p>
        </div>

        {/* Card */}
        <div className="glass grain rounded-lg p-8">
          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div
                key="sent"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                {/* Animated envelope */}
                <motion.div
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="w-16 h-16 mx-auto mb-5 rounded-full bg-bureau-gold/10 border border-bureau-gold/30
                             flex items-center justify-center"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                       className="w-7 h-7 text-bureau-gold">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </motion.div>

                <h2 className="font-serif text-xl text-bureau-text mb-2">Check your inbox</h2>
                <p className="font-sans text-sm text-bureau-muted leading-relaxed mb-6">
                  We sent a magic link to{' '}
                  <span className="text-bureau-text">{email}</span>.
                  <br />
                  Click it to enter the Bureau.
                </p>
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="font-sans text-xs text-bureau-gold hover:text-amber-400 transition-colors
                             uppercase tracking-widest"
                >
                  Use a different email
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="font-serif text-xl text-bureau-text mb-1">Enter the Bureau</h2>
                <p className="font-sans text-sm text-bureau-muted mb-6">
                  Sign in with your email — no password needed.
                </p>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label
                      htmlFor="email"
                      className="block font-sans text-[10px] uppercase tracking-widest text-bureau-dim mb-2"
                    >
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="input-bureau"
                    />
                  </div>

                  {error && (
                    <p className="font-sans text-xs text-red-400">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !email}
                    className="btn-bureau w-full"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2 justify-center">
                        <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        Sending link…
                      </span>
                    ) : 'Send magic link'}
                  </button>
                </form>

                <p className="font-sans text-center text-xs text-bureau-dim mt-6">
                  By continuing, you agree to treat every failed project with dignity.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Back to morgue */}
        <p className="text-center mt-6">
          <Link
            href="/morgue"
            className="font-sans text-xs text-bureau-dim hover:text-bureau-muted transition-colors
                       uppercase tracking-widest"
          >
            Browse without signing in →
          </Link>
        </p>
      </div>
    </div>
  )
}
