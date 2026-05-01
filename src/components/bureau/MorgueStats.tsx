'use client'

import { useState, useEffect, useRef } from 'react'
import { useInView } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

interface Stats {
  allTime: {
    totalProjects: number
    totalResurrections: number
    totalAdoptions: number
  }
  today: { newProjects: number }
  topCause: { name: string; count: number } | null
}

function useCountUp(target: number, duration = 2000, triggered: boolean) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!triggered || target === 0) return
    const start = Date.now()
    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(target * eased))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, duration, triggered])

  return value
}

type StatColorType = 'gold' | 'green' | 'blue' | 'purple'

const statColorClasses: Record<StatColorType, { text: string; glow: string }> = {
  gold: { text: 'text-bureau-gold', glow: 'glow-gold' },
  green: { text: 'text-bureau-green', glow: 'glow-gold' },
  blue: { text: 'text-bureau-blue', glow: 'glow-gold' },
  purple: { text: 'text-purple-400', glow: 'glow-purple' },
}

interface StatItemProps {
  value: number
  label: string
  colorType?: StatColorType
  triggered: boolean
}

function StatItem({ value, label, colorType = 'gold', triggered }: StatItemProps) {
  const count = useCountUp(value, 2000, triggered)
  const colors = statColorClasses[colorType]
  return (
    <div className="flex flex-col items-center gap-1">
      <span className={cn('font-serif text-3xl md:text-4xl leading-none tabular-nums', colors.text, colors.glow)}>
        {count.toLocaleString()}
      </span>
      <span className="font-sans text-[10px] uppercase tracking-widest text-bureau-dim">
        {label}
      </span>
    </div>
  )
}

interface MorgueStatsProps {
  /** Pass stats directly (SSR) or leave undefined to fetch client-side */
  initialStats?: Stats | null
}

export default function MorgueStats({ initialStats }: MorgueStatsProps) {
  const [stats, setStats] = useState<Stats | null>(initialStats ?? null)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })
  const triggered = inView && stats !== null

  useEffect(() => {
    if (initialStats) return
    fetch('/api/stats/daily')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setStats(data) })
      .catch(() => {})
  }, [initialStats])

  if (!stats) return null

  return (
    <div ref={ref} className="w-full">
      <div className="glass grain rounded-lg py-8 px-6 md:px-12 flex flex-wrap justify-center md:justify-between items-center gap-8">
        <StatItem
          value={stats.allTime.totalProjects}
          label="Projects filed"
          colorType="gold"
          triggered={triggered}
        />

        <div className="hidden md:block h-10 w-px separator-v" />

        <StatItem
          value={stats.allTime.totalResurrections}
          label="Resurrected"
          colorType="green"
          triggered={triggered}
        />

        <div className="hidden md:block h-10 w-px separator-v" />

        <StatItem
          value={stats.allTime.totalAdoptions}
          label="Adoptions"
          colorType="blue"
          triggered={triggered}
        />

        {stats.topCause && (
          <>
            <div className="hidden md:block h-10 w-px separator-v" />
            <div className="flex flex-col items-center gap-1">
              <span className="font-serif text-xl leading-tight text-center max-w-[140px] text-purple-400 glow-purple">
                {stats.topCause.name}
              </span>
              <span className="font-sans text-[10px] uppercase tracking-widest text-bureau-dim">
                Top Killer ({stats.topCause.count})
              </span>
            </div>
          </>
        )}
      </div>

      {stats.today.newProjects > 0 && (
        <p className="text-center font-sans text-xs mt-3 text-bureau-dim">
          Today: {stats.today.newProjects} project{stats.today.newProjects !== 1 ? 's' : ''} filed.
          {stats.topCause && (
            <> Top cause:{' '}
              <span className="text-purple-400">{stats.topCause.name}</span>.
            </>
          )}
        </p>
      )}
    </div>
  )
}
