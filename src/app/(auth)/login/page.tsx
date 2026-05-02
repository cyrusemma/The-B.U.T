'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [emailOrUsername, setEmailOrUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  const supabase = createClient()

  // Check if we're on client side
  React.useEffect(() => {
    setIsClient(true)
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: emailOrUsername,
        password,
      })
      if (error) throw error

      // If successful, redirect
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  async function handleOAuth(provider: 'github' | 'google') {
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to sign in with ${provider}`)
      setLoading(false)
    }
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
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="font-serif text-xl text-bureau-text mb-1">Enter the Bureau</h2>
              <p className="font-sans text-sm text-bureau-muted mb-6">
                Sign in with your email and password.
              </p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label
                    htmlFor="emailOrUsername"
                    className="block font-sans text-[10px] uppercase tracking-widest text-bureau-dim mb-2"
                  >
                    Email Address
                  </label>
                  <input
                    id="emailOrUsername"
                    type="email"
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    placeholder="you@example.com"
                    required
                    disabled={loading}
                    className="input-bureau disabled:opacity-50"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block font-sans text-[10px] uppercase tracking-widest text-bureau-dim mb-2"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                    className="input-bureau disabled:opacity-50"
                  />
                </div>

                {error && (
                  <p className="font-sans text-xs text-red-400">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || !emailOrUsername || !password}
                  className="btn-bureau w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2 justify-center">
                      <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Signing in…
                    </span>
                  ) : 'Sign In'}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-slate-900 text-bureau-dim">or</span>
                </div>
              </div>

              {/* OAuth Buttons */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => handleOAuth('github')}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
                             border border-white/10 bg-white/5 hover:bg-white/10 text-bureau-text text-sm
                             font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.868-.013-1.703-2.782.603-3.369-1.343-3.369-1.343-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.547 2.914 1.186.092-.923.35-1.547.636-1.903-2.22-.253-4.555-1.113-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0110 4.836c.85.004 1.705.114 2.504.336 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C17.138 18.192 20 14.438 20 10.017 20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                  </svg>
                  <span>GitHub</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOAuth('google')}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
                             border border-white/10 bg-white/5 hover:bg-white/10 text-bureau-text text-sm
                             font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>Google</span>
                </button>
              </div>

              <p className="font-sans text-center text-xs text-bureau-dim mt-6">
                Don't have an account?{' '}
                <Link href="/signup" className="text-bureau-gold hover:text-amber-400 transition-colors">
                  Create one
                </Link>
              </p>
            </motion.div>
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
