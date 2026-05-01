'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import { Moon, Sun, Menu, X, User, LayoutDashboard, LogOut } from 'lucide-react'

interface NavUser {
  username?: string | null
  display_name?: string | null
}

interface BureauNavbarProps {
  user?: NavUser | null
}

const NAV_LINKS = [
  { href: '/morgue',  label: 'The Morgue' },
  { href: '/submit',  label: 'Submit' },
  { href: '/about',   label: 'About' },
]

export default function BureauNavbar({ user }: BureauNavbarProps) {
  const pathname = usePathname()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false) }, [pathname])

  const isDark = resolvedTheme === 'dark'
  const initials = user
    ? (user.display_name ?? user.username ?? '?').slice(0, 2).toUpperCase()
    : null

  return (
    <>
      <header
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#080C14]/92 backdrop-blur-xl border-b border-amber-900/20 shadow-[0_4px_30px_rgba(0,0,0,0.5)]'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="flex items-center justify-between w-full max-w-[1280px] mx-auto px-6 md:px-12 py-4">

          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2 shrink-0">
            <div className="arch-sm w-5 h-6 border border-amber-600/50 group-hover:border-amber-500 transition-colors" />
            <span className="font-serif text-xl italic text-amber-600 group-hover:text-amber-500 transition-colors
                             drop-shadow-[0_0_8px_rgba(217,119,6,0.25)]">
              The Bureau
            </span>
            <span className="hidden sm:block text-bureau-dim text-xs font-sans tracking-widest mt-0.5">†</span>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label }) => {
              const active = pathname === href || pathname.startsWith(href + '/')
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-3 py-1.5 rounded text-sm font-sans tracking-wide transition-all duration-200 ${
                    active
                      ? 'text-amber-500 border-b border-amber-600'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                  }`}
                >
                  {label}
                </Link>
              )
            })}
          </nav>

          {/* Desktop right actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Theme toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                aria-label="Toggle theme"
                className="p-2 rounded text-bureau-muted hover:text-bureau-text hover:bg-white/5 transition-all"
              >
                <motion.div
                  key={isDark ? 'moon' : 'sun'}
                  initial={{ rotate: -30, opacity: 0 }}
                  animate={{ rotate: 0,   opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {isDark ? <Moon size={16} /> : <Sun size={16} />}
                </motion.div>
              </button>
            )}

            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="p-2 rounded text-bureau-muted hover:text-bureau-text hover:bg-white/5 transition-all"
                  aria-label="Dashboard"
                >
                  <LayoutDashboard size={16} />
                </Link>
                <Link
                  href={`/profile/${user.username}`}
                  className="w-8 h-8 rounded-full bg-amber-600/20 border border-amber-600/40
                             flex items-center justify-center hover:border-amber-500 transition-colors"
                >
                  <span className="font-serif text-xs text-amber-500">{initials}</span>
                </Link>
              </>
            ) : (
              <Link href="/login" className="btn-bureau text-xs py-2 px-4">
                Enter the Bureau
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden p-2 rounded text-bureau-muted hover:text-bureau-text transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
              onClick={() => setMobileOpen(false)}
            />

            {/* Drawer panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 h-full w-72 bg-[#0F1623] border-l border-white/10 z-50 md:hidden
                         flex flex-col"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
                <span className="font-serif italic text-amber-600 text-lg">The Bureau</span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1 text-bureau-muted hover:text-bureau-text transition-colors"
                  aria-label="Close menu"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Nav links */}
              <nav className="flex-1 px-4 py-6 space-y-1">
                {NAV_LINKS.map(({ href, label }) => {
                  const active = pathname === href || pathname.startsWith(href + '/')
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`block px-4 py-3 rounded text-sm font-sans tracking-wide transition-all ${
                        active
                          ? 'bg-amber-600/10 text-amber-400 border border-amber-600/20'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                      }`}
                    >
                      {label}
                    </Link>
                  )
                })}
              </nav>

              {/* Drawer footer */}
              <div className="px-4 py-6 border-t border-white/10 space-y-3">
                {/* Theme toggle */}
                {mounted && (
                  <button
                    onClick={() => setTheme(isDark ? 'light' : 'dark')}
                    className="flex items-center gap-3 w-full px-4 py-2.5 rounded text-sm text-bureau-muted
                               hover:text-bureau-text hover:bg-white/5 transition-all"
                  >
                    {isDark ? <Moon size={16} /> : <Sun size={16} />}
                    <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                  </button>
                )}

                {user ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-3 px-4 py-2.5 rounded text-sm text-bureau-muted
                                 hover:text-bureau-text hover:bg-white/5 transition-all"
                    >
                      <LayoutDashboard size={16} />
                      <span>Dashboard</span>
                    </Link>
                    <Link
                      href={`/profile/${user.username}`}
                      className="flex items-center gap-3 px-4 py-2.5 rounded text-sm text-bureau-muted
                                 hover:text-bureau-text hover:bg-white/5 transition-all"
                    >
                      <User size={16} />
                      <span>{user.display_name ?? user.username}</span>
                    </Link>
                    <form action="/api/auth/signout" method="POST">
                      <button
                        type="submit"
                        className="flex items-center gap-3 w-full px-4 py-2.5 rounded text-sm text-bureau-muted
                                   hover:text-slate-300 hover:bg-white/5 transition-all text-left"
                      >
                        <LogOut size={16} />
                        <span>Sign out</span>
                      </button>
                    </form>
                  </>
                ) : (
                  <Link href="/login" className="btn-bureau w-full text-center">
                    Enter the Bureau
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
