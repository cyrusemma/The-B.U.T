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

function FileIcon() {
  return (
    <svg className="w-3 h-3 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 2h5.5L12 4.5V14H4V2z" />
      <path strokeLinecap="round" d="M9 2v3h3" />
      <path strokeLinecap="round" d="M6 8h4M6 11h3" />
    </svg>
  )
}

export default function TombstoneCard({ project, index = 0, resurrected }: TombstoneCardProps) {
  const preview = project.ghost_letter ?? project.description ?? null
  const fileCount = project.project_files?.length ?? 0
  const spinClass = resurrected ? 'card-glow-spin-green' : 'card-glow-spin'
  const lifespan = project.started_at ? formatLifespan(project.started_at, project.died_at) : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="h-full"
    >
      {/* Outer dossier card container */}
      <div className={`group/card relative rounded-lg overflow-hidden h-full cursor-pointer bg-bureau-card border
        ${resurrected ? 'border-bureau-green/20' : 'border-white/5'}
        hover:border-bureau-gold/30 transition-all duration-300 shadow-lg hover:shadow-[0_4px_24px_rgba(229,193,133,0.06)]`}>

        {/* Double gold frame overlay on hover */}
        <div className="absolute inset-[3px] border border-dashed border-transparent group-hover/card:border-bureau-gold/15 transition-all duration-500 pointer-events-none rounded-[5px]" />

        {/* Hover underglow */}
        <div
          aria-hidden="true"
          className={`absolute inset-0 bg-gradient-to-t pointer-events-none opacity-0 group-hover/card:opacity-100 transition-opacity duration-500
            ${resurrected
              ? 'from-bureau-green/4 to-transparent'
              : 'from-bureau-gold/3 to-transparent'
            }`}
        />

        <Link href={`/morgue/${project.id}`} className="block h-full">
          <div className="relative p-1 overflow-hidden h-full flex flex-col">

            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="tombstone-header relative pb-5">

              {/* File number (dossier style) */}
              <div className="absolute top-3 left-4 flex items-center gap-1.5">
                <span className={`text-[0.6rem] font-mono tracking-wider font-semibold
                  ${resurrected ? 'text-bureau-green/60' : 'text-bureau-gold/40 group-hover/card:text-bureau-gold/70 transition-colors duration-300'}`}>
                  CASE // {project.id.slice(0, 6).toUpperCase()}
                </span>
              </div>

              {/* Project type */}
              {project.project_type && (
                <div className="absolute top-3 right-4">
                  <span className="text-[0.58rem] font-mono tracking-widest uppercase text-bureau-dim">
                    {project.project_type}
                  </span>
                </div>
              )}

              {/* Archival stamp/seal */}
              <div className={`w-8 h-8 rounded-full border border-dashed mx-auto mb-3 mt-4 flex items-center justify-center transition-colors duration-300
                ${resurrected
                  ? 'border-bureau-green/40 text-bureau-green bg-bureau-green/5'
                  : 'border-bureau-gold/20 text-bureau-gold/50 group-hover/card:border-bureau-gold/50 group-hover/card:text-bureau-gold'
                }`}>
                <span className="font-mono text-[8px] uppercase tracking-wider font-bold">
                  {resurrected ? 'ALV' : 'REC'}
                </span>
              </div>

              {/* Title */}
              <h3 className="font-serif text-base leading-snug line-clamp-2 mb-1 text-bureau-text group-hover/card:text-bureau-gold transition-colors duration-300">
                {project.title}
              </h3>

              {/* Creator */}
              <p className="font-sans text-[0.68rem] text-bureau-dim">
                by {project.profiles?.display_name ?? project.profiles?.username ?? 'anonymous'}
              </p>

              {/* Grid separator line */}
              <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
            </div>

            {/* ── Content preview ─────────────────────────────────────────── */}
            <div className="px-5 py-4 flex-1 flex flex-col gap-3">

              {/* Ghost letter / description excerpt */}
              {preview && (
                <div className={`text-xs leading-relaxed line-clamp-3 ${
                  project.ghost_letter
                    ? 'font-serif italic text-bureau-muted/80'
                    : 'font-sans text-bureau-muted'
                }`}>
                  {project.ghost_letter ? `"${preview}"` : preview}
                </div>
              )}

              {/* Attached files indicator */}
              {fileCount > 0 && (
                <div className={`flex items-center gap-1.5 text-[0.65rem] font-sans transition-colors duration-300
                  ${resurrected ? 'text-bureau-green/60' : 'text-bureau-dim group-hover/card:text-bureau-gold/60'}`}>
                  <FileIcon />
                  <span>{fileCount} {fileCount === 1 ? 'file' : 'files'} attached</span>
                </div>
              )}

              {/* Causes of death */}
              {project.causes_of_death.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-auto pt-1">
                  {project.causes_of_death.slice(0, 2).map((cause) => (
                    <CauseOfDeathBadge key={cause} cause={cause} />
                  ))}
                  {project.causes_of_death.length > 2 && (
                    <span className="cause-tag">+{project.causes_of_death.length - 2}</span>
                  )}
                </div>
              )}
            </div>

            {/* ── Footer ──────────────────────────────────────────────────── */}
            <div className="tombstone-footer border-t border-white/5">
              <p className="font-sans text-[0.65rem] text-bureau-dim">
                {formatDate(project.died_at)}
                {lifespan && <span className="ml-1.5 text-bureau-dim/60">· {lifespan}</span>}
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
      </div>
    </motion.div>
  )
}

