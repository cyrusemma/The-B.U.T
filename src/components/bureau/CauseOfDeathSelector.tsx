'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'
import type { CauseOfDeath } from '@/lib/types/database'

const CAUSE_ICONS: Record<string, string> = {
  'Perfectionism':              '∞',
  'Ran out of money':           '$',
  'Scope creep':                '⊕',
  'Lost interest':              '◌',
  'Life got in the way':        '⌛',
  'Team breakup':               '⊗',
  'Technology became obsolete': '⊘',
  'Market vanished':            '↓',
  'Burnout':                    '~',
  'Other':                      '?',
}

interface CauseOfDeathSelectorProps {
  causes: CauseOfDeath[]
  selected: CauseOfDeath[]
  onChange: (causes: CauseOfDeath[]) => void
  max?: number
}

export default function CauseOfDeathSelector({
  causes,
  selected,
  onChange,
  max = 3,
}: CauseOfDeathSelectorProps) {
  function toggle(cause: CauseOfDeath) {
    if (selected.includes(cause)) {
      onChange(selected.filter((c) => c !== cause))
    } else if (selected.length < max) {
      onChange([...selected, cause])
    }
  }

  return (
    <div className="space-y-2">
      <p className="font-sans text-xs mb-3 text-bureau-muted">
        Select up to {max} causes. Be honest.
      </p>
      <div className="grid grid-cols-1 gap-2">
        {causes.map((cause) => {
          const isSelected = selected.includes(cause)
          const isDisabled = !isSelected && selected.length >= max

          return (
            <motion.button
              key={cause}
              type="button"
              onClick={() => !isDisabled && toggle(cause)}
              disabled={isDisabled}
              whileTap={isDisabled ? {} : { scale: 0.98 }}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded text-left transition-all duration-200',
                'disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer',
                isSelected ? 'border-amber-600/50 bg-amber-600/8' : 'border-bureau-glass bg-bureau-glass',
                'border'
              )}
            >
              <span
                className={cn(
                  'font-serif text-lg w-6 text-center flex-shrink-0',
                  isSelected ? 'text-amber-600' : 'text-bureau-dim'
                )}
              >
                {CAUSE_ICONS[cause] ?? '?'}
              </span>
              <span
                className={cn(
                  'font-sans text-sm transition-colors',
                  isSelected ? 'text-amber-600' : 'text-bureau-text'
                )}
              >
                {cause}
              </span>
              {isSelected && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-auto font-sans text-xs text-amber-600"
                >
                  ✓
                </motion.span>
              )}
            </motion.button>
          )
        })}
      </div>

      {selected.length > 0 && (
        <p className="font-sans text-xs pt-1 text-bureau-dim">
          {selected.length}/{max} selected
        </p>
      )}
    </div>
  )
}
