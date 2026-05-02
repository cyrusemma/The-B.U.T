'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

export interface HeroCase {
  id: string
  title: string
  causes_of_death: string[]
  project_type: string
  is_adopted: boolean
  profiles?: { username?: string | null; display_name?: string | null } | null
}

interface HeroSectionProps {
  totalProjects: number
  totalAdoptions: number
  cases?: HeroCase[]
}

const SLIDE = {
  enter: (dir: number) => ({ x: dir > 0 ? 48 : -48, opacity: 0, filter: 'blur(8px)' }),
  center:                  { x: 0,             opacity: 1, filter: 'blur(0px)' },
  exit:  (dir: number) => ({ x: dir > 0 ? -48 : 48, opacity: 0, filter: 'blur(8px)' }),
}

export default function HeroSection({ totalProjects, totalAdoptions, cases = [] }: HeroSectionProps) {
  const [open,  setOpen]  = useState(false)
  const [ready, setReady] = useState(false)
  const [index, setIndex] = useState(0)
  const [dir,   setDir]   = useState(1)

  useEffect(() => {
    const t1 = setTimeout(() => setOpen(true),  400)
    const t2 = setTimeout(() => setReady(true), 1900)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const hasCases = cases.length > 0

  const next = useCallback(() => {
    if (!hasCases) return
    setDir(1)
    setIndex(i => (i + 1) % cases.length)
  }, [cases.length, hasCases])

  const prev = useCallback(() => {
    if (!hasCases) return
    setDir(-1)
    setIndex(i => (i - 1 + cases.length) % cases.length)
  }, [cases.length, hasCases])

  // Keyboard arrow navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft')  prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev])

  function fadeUp(delay: number) {
    return {
      initial: { opacity: 0, y: 28, filter: 'blur(14px)' },
      animate: ready ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {},
      transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1], delay },
    }
  }

  const current = hasCases ? cases[index] : null
  const cause   = current?.causes_of_death?.[0] ?? 'Unknown'
  const creator = current?.profiles?.display_name ?? current?.profiles?.username ?? null
  const fileNum = current ? `#${current.id.slice(0, 4).toUpperCase()}` : ''

  return (
    <section className="relative -mt-[72px] min-h-screen flex flex-col overflow-hidden bg-[#04060A]">

      {/* Video background */}
      <video
        autoPlay loop muted playsInline
        className="absolute inset-0 h-full w-full object-cover brightness-[0.65] contrast-[1.1]"
      >
        <source
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260406_094145_4a271a6c-3869-4f1c-8aa7-aeb0cb227994.mp4"
          type="video/mp4"
        />
      </video>

      {/* Drifting cloud / fog layers */}
      <div aria-hidden="true" className="absolute inset-0 z-[2] pointer-events-none">
        <div className="hero-cloud hero-cloud-a" />
        <div className="hero-cloud hero-cloud-b" />
        <div className="hero-cloud hero-cloud-c" />
      </div>

      {/* Bottom atmospheric blur */}
      <div aria-hidden="true" className="hero-bottom-blur absolute inset-0 z-[3] pointer-events-none" />

      {/* ── Top cloud curtain — drifts UP ─────────────────────────────────────── */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 z-[18] pointer-events-none"
        style={{ height: '72%' }}
        initial={{ y: 0 }}
        animate={{ y: open ? '-112%' : 0 }}
        transition={{ duration: 2.2, ease: [0.76, 0, 0.24, 1] }}
      >
        <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id="topCG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#1e2d48" />
              <stop offset="55%"  stopColor="#131e32" />
              <stop offset="100%" stopColor="#0d1624" stopOpacity="0.97" />
            </linearGradient>
            <radialGradient id="topHL" cx="50%" cy="25%" r="55%">
              <stop offset="0%"   stopColor="#2e4268" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#0d1624" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Main body */}
          <path
            d="M0,0 L1000,0 L1000,720
               Q 980,738 960,720 Q 940,702 920,718 Q 900,734 875,718
               Q 855,703 835,717 Q 810,732 790,716 Q 765,700 745,715
               Q 720,730 695,714 Q 670,699 645,715 Q 618,732 590,714
               Q 562,697 535,714 Q 510,730 482,714 Q 454,698 425,714
               Q 396,730 368,714 Q 340,698 312,715 Q 285,732 255,714
               Q 228,697 200,715 Q 172,732 145,714 Q 120,698 95,715
               Q 70,730 45,714 Q 22,700 0,712 Z"
            fill="url(#topCG)"
          />

          {/* Highlight layer */}
          <path
            d="M0,0 L1000,0 L1000,720
               Q 980,738 960,720 Q 940,702 920,718 Q 900,734 875,718
               Q 855,703 835,717 Q 810,732 790,716 Q 765,700 745,715
               Q 720,730 695,714 Q 670,699 645,715 Q 618,732 590,714
               Q 562,697 535,714 Q 510,730 482,714 Q 454,698 425,714
               Q 396,730 368,714 Q 340,698 312,715 Q 285,732 255,714
               Q 228,697 200,715 Q 172,732 145,714 Q 120,698 95,715
               Q 70,730 45,714 Q 22,700 0,712 Z"
            fill="url(#topHL)"
          />

          {/* Wispy underbelly bulges */}
          <ellipse cx="150" cy="718" rx="105" ry="28" fill="#0a1320" opacity="0.55" />
          <ellipse cx="380" cy="710" rx="130" ry="32" fill="#0a1320" opacity="0.45" />
          <ellipse cx="620" cy="718" rx="118" ry="30" fill="#0a1320" opacity="0.50" />
          <ellipse cx="860" cy="712" rx="100" ry="26" fill="#0a1320" opacity="0.50" />
        </svg>
      </motion.div>

      {/* ── Bottom cloud curtain — drifts DOWN ────────────────────────────────── */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 z-[18] pointer-events-none"
        style={{ height: '72%' }}
        initial={{ y: 0 }}
        animate={{ y: open ? '112%' : 0 }}
        transition={{ duration: 2.2, ease: [0.76, 0, 0.24, 1] }}
      >
        <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id="botCG" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%"   stopColor="#1e2d48" />
              <stop offset="55%"  stopColor="#131e32" />
              <stop offset="100%" stopColor="#0d1624" stopOpacity="0.97" />
            </linearGradient>
            <radialGradient id="botHL" cx="50%" cy="75%" r="55%">
              <stop offset="0%"   stopColor="#2e4268" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#0d1624" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Main body */}
          <path
            d="M0,1000 L1000,1000 L1000,280
               Q 978,262 956,280 Q 934,298 910,280 Q 888,263 862,280
               Q 838,296 812,280 Q 788,264 762,280 Q 736,296 708,280
               Q 682,264 655,280 Q 626,296 597,280 Q 568,264 539,281
               Q 510,298 482,281 Q 453,264 424,280 Q 395,296 366,280
               Q 337,264 308,280 Q 280,296 252,280 Q 225,264 198,280
               Q 170,296 143,280 Q 116,264 90,280 Q 64,296 38,280
               Q 18,268 0,275 Z"
            fill="url(#botCG)"
          />

          {/* Highlight layer */}
          <path
            d="M0,1000 L1000,1000 L1000,280
               Q 978,262 956,280 Q 934,298 910,280 Q 888,263 862,280
               Q 838,296 812,280 Q 788,264 762,280 Q 736,296 708,280
               Q 682,264 655,280 Q 626,296 597,280 Q 568,264 539,281
               Q 510,298 482,281 Q 453,264 424,280 Q 395,296 366,280
               Q 337,264 308,280 Q 280,296 252,280 Q 225,264 198,280
               Q 170,296 143,280 Q 116,264 90,280 Q 64,296 38,280
               Q 18,268 0,275 Z"
            fill="url(#botHL)"
          />

          {/* Wispy top-edge bulges */}
          <ellipse cx="130" cy="282" rx="95"  ry="26" fill="#0a1320" opacity="0.55" />
          <ellipse cx="370" cy="275" rx="125" ry="30" fill="#0a1320" opacity="0.45" />
          <ellipse cx="610" cy="280" rx="112" ry="28" fill="#0a1320" opacity="0.50" />
          <ellipse cx="855" cy="276" rx="98"  ry="25" fill="#0a1320" opacity="0.50" />
        </svg>
      </motion.div>

      {/* ── Side wisps — add layered depth ────────────────────────────────────── */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 z-[17] pointer-events-none"
        style={{ width: '28%' }}
        initial={{ x: 0, opacity: 1 }}
        animate={{ x: open ? '-100%' : 0, opacity: open ? 0 : 1 }}
        transition={{ duration: 1.8, ease: [0.76, 0, 0.24, 1], delay: 0.1 }}
      >
        <svg viewBox="0 0 300 1000" preserveAspectRatio="none" className="h-full w-full">
          <defs>
            <linearGradient id="leftWispG" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"  stopColor="#1a2840" />
              <stop offset="100%" stopColor="#1a2840" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect width="300" height="1000" fill="url(#leftWispG)" />
        </svg>
      </motion.div>

      <motion.div
        aria-hidden="true"
        className="absolute inset-y-0 right-0 z-[17] pointer-events-none"
        style={{ width: '28%' }}
        initial={{ x: 0, opacity: 1 }}
        animate={{ x: open ? '100%' : 0, opacity: open ? 0 : 1 }}
        transition={{ duration: 1.8, ease: [0.76, 0, 0.24, 1], delay: 0.1 }}
      >
        <svg viewBox="0 0 300 1000" preserveAspectRatio="none" className="h-full w-full">
          <defs>
            <linearGradient id="rightWispG" x1="1" y1="0" x2="0" y2="0">
              <stop offset="0%"  stopColor="#1a2840" />
              <stop offset="100%" stopColor="#1a2840" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect width="300" height="1000" fill="url(#rightWispG)" />
        </svg>
      </motion.div>

      {/* ── Hero content — bottom-left ─────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 flex flex-col justify-end pb-28 md:pb-32 px-6 md:px-14">
        <div className="max-w-5xl">

          <motion.h1
            {...fadeUp(0.12)}
            className="font-serif text-6xl md:text-7xl lg:text-[5.5rem] leading-none tracking-tighter max-w-4xl text-bureau-text hero-headline-pulse mt-1"
          >
            Every abandoned idea<br />
            deserves a second chance.
          </motion.h1>

          <motion.p
            {...fadeUp(0.28)}
            className="mt-6 text-lg md:text-xl text-bureau-muted max-w-lg leading-relaxed"
          >
            Submit your dead projects. Receive an AI autopsy.
            <br className="hidden sm:block" />
            Let someone resurrect them.
          </motion.p>

          <motion.div
            {...fadeUp(0.44)}
            className="flex flex-wrap items-center gap-3 sm:gap-8 mt-10"
          >
            <div className="text-sm">
              <span className="text-bureau-gold font-semibold tabular-nums">{totalProjects.toLocaleString()}</span>
              <span className="text-bureau-dim ml-2">Projects in the Morgue</span>
            </div>
            <div className="hidden sm:block h-3 w-px bg-white/10" />
            <div className="text-sm">
              <span className="text-bureau-gold font-semibold tabular-nums">{totalAdoptions.toLocaleString()}</span>
              <span className="text-bureau-dim ml-2">Ideas adopted</span>
            </div>
          </motion.div>

          <motion.div
            {...fadeUp(0.60)}
            className="flex flex-wrap gap-4 mt-10"
          >
            <Link
              href="/submit"
              className="inline-flex items-center gap-3 bg-bureau-gold hover:bg-amber-400 text-black font-semibold text-base px-9 py-4 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_32px_rgba(217,119,6,0.50)]"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              Submit a Dead Project
            </Link>
            <Link
              href="/morgue"
              className="inline-flex items-center gap-3 glass border border-bureau-gold/25 text-bureau-text font-semibold text-base px-9 py-4 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-bureau-gold/50"
            >
              Browse the Morgue
            </Link>
          </motion.div>

          <motion.p {...fadeUp(0.76)} className="text-xs text-bureau-dim mt-7 font-serif italic">
            "Death is merely the beginning of a new chapter."
          </motion.p>
        </div>
      </div>

      {/* ── Featured case panel — bottom-right ────────────────────────────────── */}
      {hasCases && ready && (
        <motion.div
          className="absolute bottom-20 right-6 md:right-14 z-50 w-72"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        >
          <div className="glass border border-bureau-gold/20 rounded-xl overflow-hidden">

            {/* Card header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
              <span className="text-[0.6rem] font-bold uppercase tracking-widest text-bureau-dim">
                Featured Case
              </span>
              <span className="text-[0.6rem] font-bold tracking-widest text-bureau-gold">
                {fileNum}
              </span>
            </div>

            {/* Card body — animated on case change */}
            <div className="relative px-4 py-4 min-h-[80px] overflow-hidden">
              <AnimatePresence mode="wait" custom={dir}>
                <motion.div
                  key={index}
                  custom={dir}
                  variants={SLIDE}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p className="font-serif text-base leading-snug text-bureau-text mb-2 line-clamp-2">
                    {current?.title}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="cause-tag">{cause}</span>
                    {current?.is_adopted && (
                      <span className="cause-tag text-bureau-gold border-bureau-gold/30 bg-bureau-gold/8">
                        Adopted
                      </span>
                    )}
                  </div>
                  {creator && (
                    <p className="mt-2 text-[0.65rem] text-bureau-dim">
                      by {creator}
                    </p>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Card footer */}
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/5">
              {/* Dot indicators */}
              <div className="flex items-center gap-1.5" role="tablist" aria-label="Case indicators">
                {cases.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    role="tab"
                    aria-selected={i === index ? 'true' : 'false'}
                    aria-label={`Case ${i + 1}`}
                    onClick={() => { setDir(i > index ? 1 : -1); setIndex(i) }}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === index
                        ? 'w-4 bg-bureau-gold'
                        : 'w-1.5 bg-white/20 hover:bg-white/40'
                    }`}
                  />
                ))}
              </div>

              <Link
                href={`/morgue/${current?.id}`}
                className="text-[0.65rem] font-bold uppercase tracking-widest text-bureau-gold hover:text-amber-400 transition-colors flex items-center gap-1"
              >
                Open Case
                <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2 8L8 2M4 2h4v4" />
                </svg>
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Case navigation buttons ────────────────────────────────────────────── */}
      <div className="absolute bottom-8 right-6 md:right-14 z-50 flex items-center gap-5 text-[0.62rem] uppercase tracking-widest select-none">
        <button
          type="button"
          onClick={prev}
          disabled={!hasCases}
          className="hover:text-bureau-gold transition-colors flex items-center gap-1.5 text-bureau-dim disabled:opacity-30 disabled:cursor-default"
          aria-label="Previous case"
        >
          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 2L4 6l4 4" />
          </svg>
          Prev
        </button>

        {hasCases && (
          <span className="text-bureau-dim tabular-nums">
            {index + 1} / {cases.length}
          </span>
        )}

        <button
          type="button"
          onClick={next}
          disabled={!hasCases}
          className="hover:text-bureau-gold transition-colors flex items-center gap-1.5 text-bureau-dim disabled:opacity-30 disabled:cursor-default"
          aria-label="Next case"
        >
          Next
          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 2l4 4-4 4" />
          </svg>
        </button>
      </div>

    </section>
  )
}
