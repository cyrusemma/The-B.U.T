'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { FolderOpen, History, Lightbulb, Globe2, Skull, Zap, TrendingDown } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// ── Count-up number ──────────────────────────────────────────────────────────
function AnimatedNumber({ value, delay = 0 }: { value: number; delay?: number }) {
  const [display, setDisplay] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (value === 0) return
    const DURATION = 1600

    const timer = setTimeout(() => {
      let startTime: number | null = null

      function tick(now: number) {
        if (!startTime) startTime = now
        const progress = Math.min((now - startTime) / DURATION, 1)
        const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
        setDisplay(Math.round(eased * value))
        if (progress < 1) rafRef.current = requestAnimationFrame(tick)
      }

      rafRef.current = requestAnimationFrame(tick)
    }, delay)

    return () => {
      clearTimeout(timer)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [value, delay])

  return <span className="tabular-nums">{display.toLocaleString()}</span>
}

// ── Types ────────────────────────────────────────────────────────────────────
interface StatItem {
  icon: LucideIcon
  label: React.ReactNode
  live: boolean
  href?: string
}

export interface StatsTickerProps {
  totalProjects: number
  totalAdoptions: number
  totalResurrections: number
  todayProjects: number
  topCause: string | null
}

// ── Single stat pill ─────────────────────────────────────────────────────────
function Pill({ item }: { item: StatItem }) {
  const Icon = item.icon
  const inner = (
    <span
      className="flex items-center gap-2.5 px-7 border-r border-white/8 whitespace-nowrap
                 font-sans text-[0.68rem] font-bold uppercase tracking-[0.16em] text-bureau-muted
                 hover:text-bureau-gold transition-colors duration-200 cursor-default select-none"
    >
      {item.live && (
        <span
          aria-hidden="true"
          className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0 animate-pulse"
        />
      )}
      <Icon size={14} className="text-bureau-gold flex-shrink-0" aria-hidden="true" />
      <span>{item.label}</span>
    </span>
  )

  if (item.href) {
    return (
      <Link href={item.href} className="contents">
        {inner}
      </Link>
    )
  }
  return inner
}

// ── Component ────────────────────────────────────────────────────────────────
export default function StatsTicker({
  totalProjects,
  totalAdoptions,
  totalResurrections,
  todayProjects,
  topCause,
}: StatsTickerProps) {
  const items: StatItem[] = [
    {
      icon: FolderOpen,
      label: <><AnimatedNumber value={totalProjects} delay={0} />&nbsp;Fragments Archived</>,
      live: true,
    },
    {
      icon: Lightbulb,
      label: <><AnimatedNumber value={totalAdoptions} delay={150} />&nbsp;Ideas Adopted</>,
      live: true,
    },
    {
      icon: Skull,
      label: <><AnimatedNumber value={totalResurrections} delay={300} />&nbsp;Resurrections</>,
      live: true,
    },
    {
      icon: History,
      label: 'Est. 1924',
      live: false,
    },
    {
      icon: Globe2,
      label: 'Global Ledger',
      live: false,
      href: '/morgue',
    },
    ...(topCause ? [{
      icon: TrendingDown as LucideIcon,
      label: <>Top cause:&nbsp;{topCause}</>,
      live: true,
    }] : []),
    ...(todayProjects > 0 ? [{
      icon: Zap as LucideIcon,
      label: <><AnimatedNumber value={todayProjects} delay={450} />&nbsp;Filed Today</>,
      live: true,
    }] : []),
  ]

  // Duplicate items so the marquee can loop seamlessly (translate -50%)
  const doubled = [...items, ...items]

  return (
    <div className="stats-ticker-wrap w-full overflow-hidden border-y border-white/5 bg-bureau-surface/40 py-3.5">
      <div className="stats-ticker flex items-center">
        {doubled.map((item, i) => (
          <Pill key={i} item={item} />
        ))}
      </div>
    </div>
  )
}
