'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import type { ProjectWithProfile } from '@/lib/types/database'
import { formatDate, formatLifespan } from '@/lib/utils/format'
import CauseOfDeathBadge from './CauseOfDeathBadge'
import AdoptionTermsBadge from './AdoptionTermsBadge'

interface CorpseListItemProps {
  project: ProjectWithProfile
  index?: number
}

export default function CorpseListItem({ project, index = 0 }: CorpseListItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link href={`/morgue/${project.id}`} className="group block cursor-pointer">
        <div className="card-void flex items-start gap-4 px-5 py-4 rounded-lg
                        hover:border-bureau-gold/30 hover:-translate-y-px
                        transition-all duration-200">
          <div className="arch-sm w-7 h-9 border border-bureau-dim/40 flex-shrink-0 mt-0.5
                          group-hover:border-bureau-gold/30 transition-colors duration-200" />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-1">
              <h3 className="font-serif text-sm leading-snug text-bureau-text truncate
                             group-hover:text-amber-200 transition-colors duration-200">
                {project.title}
              </h3>
              <AdoptionTermsBadge
                adoptionType={project.adoption_type}
                adopted={project.is_adopted}
                price={project.adoption_price ?? undefined}
              />
            </div>

            {project.description && (
              <p className="font-sans text-xs leading-relaxed line-clamp-2 mb-2 text-bureau-muted">
                {project.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <span className="font-sans text-xs uppercase tracking-wide text-bureau-dim">
                {project.project_type}
              </span>
              <span className="text-xs text-bureau-dim">·</span>
              <span className="font-sans text-xs text-bureau-dim">
                {formatDate(project.died_at)}
                {project.started_at && ` · ${formatLifespan(project.started_at, project.died_at)}`}
              </span>
              {project.causes_of_death.slice(0, 2).map((cause) => (
                <CauseOfDeathBadge key={cause} cause={cause} />
              ))}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
