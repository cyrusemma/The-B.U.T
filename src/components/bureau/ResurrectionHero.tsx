'use client'

import { useEffect } from 'react'
import { useAnimate, useReducedMotion } from 'framer-motion'
import Link from 'next/link'

interface ResurrectionHeroProps {
  projectTitle?: string
  projectCause?: string
  projectType?: string
}

// The tombstone inner content — same JSX shared by both halves
function TombstoneContent({
  title,
  cause,
  type,
}: {
  title: string
  cause: string
  type: string
}) {
  return (
    <div className="tombstone w-full h-full bg-bureau-card border border-white/15 flex flex-col items-center justify-start pt-10 px-5 pb-5">
      {/* Arch decorative element */}
      <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center mb-4">
        <span className="font-serif italic text-[10px] text-bureau-dim">RIP</span>
      </div>

      <p className="font-sans text-[9px] uppercase tracking-widest text-bureau-dim mb-2">
        {type}
      </p>
      <p className="font-serif text-base text-bureau-text text-center leading-snug mb-4 line-clamp-3">
        {title}
      </p>

      {/* Engraved cause */}
      <div className="mt-auto pt-3 border-t border-white/10 w-full text-center">
        <p className="font-sans text-[9px] uppercase tracking-widest text-bureau-dim/60">
          Cause of Death
        </p>
        <p className="font-sans text-[10px] text-bureau-dim mt-0.5">{cause}</p>
      </div>
    </div>
  )
}

// The project card that rises from the crack
function RisingProjectCard({
  title,
  cause,
  type,
}: {
  title: string
  cause: string
  type: string
}) {
  return (
    <div className="glass grain rounded-lg p-5 w-full shadow-gold-md">
      {/* Top row */}
      <div className="flex items-center justify-between mb-3">
        <span className="badge badge-muted badge-sm">{type}</span>
        <span className="font-sans text-[9px] uppercase tracking-widest text-bureau-dim">
          Available
        </span>
      </div>

      {/* Title */}
      <h3 className="font-serif text-lg text-bureau-text mb-2 leading-snug">
        {title}
      </h3>

      {/* Cause */}
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-bureau-gold animate-pulse flex-shrink-0" />
        <span className="font-sans text-xs text-bureau-muted">{cause}</span>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
        <span className="font-sans text-[9px] uppercase tracking-widest text-bureau-dim">
          Open Casket
        </span>
        <span className="font-sans text-[10px] text-bureau-gold glow-gold-sm">
          Awaiting adoption →
        </span>
      </div>
    </div>
  )
}

export default function ResurrectionHero({
  projectTitle  = 'CanvasFlow',
  projectCause  = 'Perfectionism',
  projectType   = 'Design System',
}: ResurrectionHeroProps) {
  const [scope, animate] = useAnimate()
  const prefersReduced   = useReducedMotion()

  useEffect(() => {
    if (prefersReduced) {
      // Skip to end state immediately
      animate('#ts-left',   { opacity: 0, x: -50, rotate: -3 }, { duration: 0 })
      animate('#ts-right',  { opacity: 0, x: 50,  rotate: 3  }, { duration: 0 })
      animate('#ts-card',   { opacity: 1, y: 0 },               { duration: 0 })
      animate('#hero-text', { opacity: 1, y: 0 },               { duration: 0 })
      animate('#crack-glow',{ opacity: 1 },                     { duration: 0 })
      return
    }

    const runSequence = async () => {
      // ── Set initial states (duration 0) ─────────────────────────────────
      await Promise.all([
        animate('#ts-left',    { opacity: 0, x: 0, rotate: 0, y: 20 }, { duration: 0 }),
        animate('#ts-right',   { opacity: 0, x: 0, rotate: 0, y: 20 }, { duration: 0 }),
        animate('#crack-line', { scaleY: 0, opacity: 0 },               { duration: 0 }),
        animate('#crack-glow', { opacity: 0 },                          { duration: 0 }),
        animate('#ts-card',    { opacity: 0, y: 60 },                   { duration: 0 }),
        animate('#hero-text',  { opacity: 0, y: 24 },                   { duration: 0 }),
      ])

      // ── Phase 1: Tombstone appears (0 → 0.7s) ───────────────────────────
      await Promise.all([
        animate('#ts-left',  { opacity: 1, y: 0 }, { duration: 0.7, ease: [0.22, 1, 0.36, 1] }),
        animate('#ts-right', { opacity: 1, y: 0 }, { duration: 0.7, ease: [0.22, 1, 0.36, 1] }),
      ])

      // ── Phase 2: Idle — let it sit ───────────────────────────────────────
      await new Promise<void>((r) => setTimeout(r, 900))

      // ── Phase 3: Subtle shake — something stirs inside ───────────────────
      await Promise.all([
        animate('#ts-left',  { x: [-2, 2, -1.5, 1.5, -1, 1, 0] }, { duration: 0.55, ease: 'easeInOut' }),
        animate('#ts-right', { x: [-2, 2, -1.5, 1.5, -1, 1, 0] }, { duration: 0.55, ease: 'easeInOut' }),
      ])

      await new Promise<void>((r) => setTimeout(r, 250))

      // ── Phase 4: Crack appears — violent shake ────────────────────────────
      animate('#crack-line', { scaleY: 1, opacity: 1 }, { duration: 0.25, ease: 'easeOut' })
      await Promise.all([
        animate('#ts-left',  { x: [-4, 4, -3, 3, -2, 2, -1, 0] }, { duration: 0.45 }),
        animate('#ts-right', { x: [-4, 4, -3, 3, -2, 2, -1, 0] }, { duration: 0.45 }),
      ])

      // ── Phase 5: Gold light + halves split ───────────────────────────────
      animate('#crack-glow', { opacity: 1 }, { duration: 0.35 })
      animate('#ts-left',  { x: -52, rotate: -4, opacity: 0.7 },
        { duration: 0.65, ease: [0.22, 1, 0.36, 1] })
      animate('#ts-right', { x: 52,  rotate: 4,  opacity: 0.7 },
        { duration: 0.65, ease: [0.22, 1, 0.36, 1] })

      // Small delay then card rises
      await new Promise<void>((r) => setTimeout(r, 200))

      // ── Phase 6: Project card rises through the crack ─────────────────────
      await Promise.all([
        animate('#ts-card',   { opacity: 1, y: 0 },
          { duration: 0.75, ease: [0.22, 1, 0.36, 1] }),
        animate('#hero-text', { opacity: 1, y: 0 },
          { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.15 }),
      ])

      // ── Phase 7: Eternal float ────────────────────────────────────────────
      animate('#ts-card', { y: [-6, 0] },
        { duration: 2.2, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' })
    }

    runSequence()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section ref={scope} className="relative min-h-[88vh] flex flex-col items-center justify-center
                                    text-center px-6 pt-20 pb-20 overflow-hidden">

      {/* Resurrection beam background */}
      <div aria-hidden="true" className="resurrection-beam" />

      {/* Ambient particles */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
        {[
          'top-[12%] left-[7%]',  'top-[38%] left-[91%]',
          'top-[68%] left-[12%]', 'top-[22%] left-[80%]',
          'top-[82%] left-[62%]', 'top-[9%]  left-[52%]',
          'top-[55%] left-[4%]',  'top-[45%] left-[96%]',
        ].map((pos, i) => (
          <div
            key={i}
            className={`absolute rounded-full bg-white/10 ${pos} ${i % 2 === 0 ? 'w-1 h-1' : 'w-[3px] h-[3px]'}`}
          />
        ))}
      </div>

      {/* ── Tombstone animation scene ─────────────────────────────────── */}
      <div className="relative z-10 mb-12 w-[240px] h-[320px]">

        {/* Left half of tombstone */}
        <div
          id="ts-left"
          className="absolute inset-0 ts-clip-left overflow-hidden"
        >
          <TombstoneContent title={projectTitle} cause={projectCause} type={projectType} />
        </div>

        {/* Right half of tombstone */}
        <div
          id="ts-right"
          className="absolute inset-0 ts-clip-right overflow-hidden"
        >
          <TombstoneContent title={projectTitle} cause={projectCause} type={projectType} />
        </div>

        {/* Crack line — golden vertical slash */}
        <div
          id="crack-line"
          className="ts-crack-line absolute left-1/2 -translate-x-1/2 top-0 w-[2px] h-full origin-top"
        />

        {/* Gold glow through the crack */}
        <div
          id="crack-glow"
          className="ts-crack-glow absolute left-1/2 -translate-x-1/2 top-[15%] h-[70%] w-24"
        />

        {/* Rising project card — centered via left offset (no CSS transform so Framer Motion y is unambiguous) */}
        <div
          id="ts-card"
          className="absolute w-[220px] top-[80px] left-[10px]"
        >
          <RisingProjectCard
            title={projectTitle}
            cause={projectCause}
            type={projectType}
          />
        </div>
      </div>

      {/* ── Hero text — fades in after card rises ─────────────────────── */}
      <div id="hero-text" className="relative z-10 max-w-3xl mx-auto">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full
                        border border-bureau-gold/20 bg-bureau-gold/5 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-bureau-gold animate-pulse" />
          <span className="font-sans text-[11px] uppercase tracking-widest text-bureau-gold">
            Established in grief, operating in hope
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-serif font-light text-[clamp(2.6rem,6.5vw,4.5rem)]
                       leading-[1.08] tracking-tight text-bureau-text mb-5 candle-glow">
          The Bureau of<br />
          <span className="text-bureau-gold italic">Unfinished Things</span>
        </h1>

        <p className="font-sans text-lg text-bureau-muted leading-relaxed max-w-2xl mx-auto mb-2">
          Everyone has a graveyard of projects. We archive yours, diagnose them, and
          let the world adopt what you couldn&apos;t finish.
        </p>
        <p className="font-sans text-sm text-bureau-dim mb-10">
          Part marketplace. Part therapy. Part archive.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/submit" className="btn-bureau text-sm px-8 py-3">
            Submit a Corpse
          </Link>
          <Link href="/morgue" className="btn-bureau-ghost text-sm px-8 py-3">
            Browse the Morgue
          </Link>
        </div>
      </div>

    </section>
  )
}
