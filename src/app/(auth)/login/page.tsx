'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0f172a' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-block mb-4">
            <div className="w-12 h-14 mx-auto border-2 border-amber-600/60 rounded-t-full flex items-end justify-center pb-2"
                 style={{ borderTopLeftRadius: '50% 60%', borderTopRightRadius: '50% 60%' }}>
              <div className="w-1 h-4 bg-amber-600/80 rounded-full" />
            </div>
          </div>
          <h1 className="text-3xl font-serif text-slate-100">The Bureau</h1>
          <p className="text-slate-500 text-sm mt-1 font-sans">of Unfinished Things</p>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-xl p-8">
          {sent ? (
            <div className="text-center">
              <div className="text-amber-500 text-4xl mb-4">✉</div>
              <h2 className="text-xl font-serif text-slate-100 mb-2">Check your inbox</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                We sent a magic link to{' '}
                <span className="text-slate-200">{email}</span>.
                <br />
                Click it to enter the Bureau.
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-6 text-amber-600 hover:text-amber-500 text-sm transition-colors"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-serif text-slate-100 mb-1">Enter the Bureau</h2>
              <p className="text-slate-500 text-sm mb-6">
                Sign in with your email — no password needed.
              </p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5"
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
                    className="w-full bg-slate-800 border border-slate-700 rounded-md px-4 py-3
                               text-slate-100 placeholder-slate-600 text-sm
                               focus:outline-none focus:border-amber-600/60 focus:ring-1 focus:ring-amber-600/30
                               transition-colors"
                  />
                </div>

                {error && (
                  <p className="text-red-400 text-sm">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full btn-bureau disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending link…' : 'Send magic link'}
                </button>
              </form>

              <p className="mt-6 text-center text-xs text-slate-600">
                By continuing, you agree to treat every failed project with dignity.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
