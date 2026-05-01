'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import type { ProjectWithProfile } from '@/lib/types/database'
import { formatDate, formatLifespan } from '@/lib/utils/format'
import CauseOfDeathBadge from './CauseOfDeathBadge'
import AdoptionTermsBadge from './AdoptionTermsBadge'

interface TombstoneCardProps {
  project: ProjectWithProfile
  index?: number
  resurrected?: boolean
}

export default function TombstoneCard({ project, index = 0, resurrected }: TombstoneCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link href={`/morgue/${project.id}`} className="group block h-full cursor-pointer">
        <div className={`
          h-full flex flex-col relative overflow-hidden rounded-lg border
          transition-all duration-300
          ${resurrected
            ? 'border-bureau-green/30 shadow-green-glow'
            : 'animate-heartbeat border-white/10 hover:border-bureau-gold/35 hover:-translate-y-0.5'
          }
          bg-bureau-card
        `}>
          {/* Underglow */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-bureau-gold/5 to-transparent
                       opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          />

          {/* Arch header */}
          <div className="tombstone-header">
            <div className={`arch-sm w-10 h-12 mx-auto border mb-3 flex items-center justify-center transition-colors duration-300
              ${resurrected ? 'border-bureau-green/40' : 'border-white/10 group-hover:border-bureau-gold/20'}`}>
              <span className={`font-serif italic text-[10px] transition-colors duration-300
                ${resurrected ? 'text-bureau-green' : 'text-bureau-dim'}`}>
                {resurrected ? '✦' : 'RIP'}
              </span>
            </div>
            <h3 className="font-serif text-base text-bureau-text leading-snug line-clamp-2 mb-1
                           group-hover:text-amber-100 transition-colors duration-300">
              {project.title}
            </h3>
            <p className="font-sans text-xs text-bureau-dim">
              by {project.profiles?.display_name ?? project.profiles?.username ?? 'unknown'}
            </p>
          </div>

          {/* Body */}
          <div className="px-5 py-4 flex-1 flex flex-col gap-3">
            {project.description && (
              <p className="font-sans text-xs leading-relaxed line-clamp-3 text-bureau-muted">
                {project.description}
              </p>
            )}
            {project.causes_of_death.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-auto">
                {project.causes_of_death.slice(0, 2).map((cause) => (
                  <CauseOfDeathBadge key={cause} cause={cause} />
                ))}
                {project.causes_of_death.length > 2 && (
                  <span className="cause-tag">+{project.causes_of_death.length - 2}</span>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="tombstone-footer">
            <p className="font-sans text-xs text-bureau-dim">
              {formatDate(project.died_at)}
              {project.started_at && (
                <span className="ml-1.5">· {formatLifespan(project.started_at, project.died_at)}</span>
              )}
            </p>
            <AdoptionTermsBadge
              adoptionType={project.adoption_type}
              adopted={project.is_adopted}
              price={project.adoption_price ?? undefined}
              resurrected={resurrected}
            />
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
