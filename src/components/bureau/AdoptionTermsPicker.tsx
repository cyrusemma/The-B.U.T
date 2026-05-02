'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'
import type { AdoptionType } from '@/lib/types/database'
import { ADOPTION_TYPES } from '@/lib/types/database'

interface AdoptionTermsPickerProps {
  value: AdoptionType | ''
  price: string
  onChange: (type: AdoptionType) => void
  onPriceChange: (price: string) => void
}

const TERM_ICONS: Record<string, string> = {
  open_casket:        '⬡',
  organ_donor:        '◈',
  resurrection_rights: '◉',
}

export default function AdoptionTermsPicker({
  value,
  price,
  onChange,
  onPriceChange,
}: AdoptionTermsPickerProps) {
  return (
    <div className="space-y-2">
      {ADOPTION_TYPES.map((type) => {
        const isSelected = value === type.value

        return (
          <motion.button
            key={type.value}
            type="button"
            onClick={() => onChange(type.value as AdoptionType)}
            whileTap={{ scale: 0.99 }}
            className={cn(
              'w-full text-left px-5 py-4 rounded transition-all duration-200 cursor-pointer border',
              isSelected ? 'border-amber-600/50 bg-amber-600/6' : 'border-bureau-glass bg-bureau-glass'
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className={cn('font-serif text-xl mt-0.5 flex-shrink-0', isSelected ? 'text-amber-600' : 'text-bureau-dim')}>
                  {TERM_ICONS[type.value] ?? '◯'}
                </span>
                <div>
                  <p className={cn('font-sans text-sm font-semibold transition-colors', isSelected ? 'text-amber-600' : 'text-bureau-text')}>
                    {type.label}
                  </p>
                  <p className="font-sans text-xs mt-0.5 leading-relaxed text-bureau-muted">
                    {type.description}
                  </p>
                </div>
              </div>
              <div className="flex-shrink-0 mt-0.5">
                {type.price === null ? (
                  <span className="badge badge-green badge-sm">
                    Free
                  </span>
                ) : (
                  <span className="badge badge-gold badge-sm">
                    Paid
                  </span>
                )}
              </div>
            </div>
          </motion.button>
        )
      })}

      {/* Price input for resurrection_rights */}
      {value === 'resurrection_rights' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25 }}
          className="overflow-hidden pt-2"
        >
          <label
            htmlFor="adoption-price"
            className="block font-sans text-[10px] uppercase tracking-widest mb-2 text-slate-400"
          >
            Price (Ghana Cedis - GHc)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-sans text-sm text-slate-500">
              GH₵
            </span>
            <input
              id="adoption-price"
              type="number"
              value={price}
              onChange={(e) => onPriceChange(e.target.value)}
              placeholder="0"
              min="1"
              step="0.01"
              className="w-full pl-12 px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-600/50 focus:ring-1 focus:ring-amber-600/50 transition-colors font-sans"
            />
          </div>
          <p className="font-sans text-[10px] mt-2 text-slate-400 space-y-1">
            <span className="block">• Bureau takes 10% (creator support)</span>
            <span className="block">• You receive 90% of the amount</span>
          </p>
        </motion.div>
      )}
    </div>
  )
}
