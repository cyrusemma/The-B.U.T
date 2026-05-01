import { cn } from '@/lib/utils/cn'

interface ResurrectionScoreProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

type TierType = 'grand' | 'master' | 'curator' | 'apprentice'

const TIER = (score: number): { label: string; tier: TierType; colorClass: string; glowClass: string } => {
  if (score >= 100) return { label: 'Grand Necromancer', tier: 'grand', colorClass: 'text-yellow-400', glowClass: 'glow-gold' }
  if (score >= 50)  return { label: 'Necromancer', tier: 'master', colorClass: 'text-bureau-gold', glowClass: 'glow-gold' }
  if (score >= 20)  return { label: 'Curator', tier: 'curator', colorClass: 'text-slate-400', glowClass: 'glow-gold-sm' }
  return                   { label: 'Apprentice', tier: 'apprentice', colorClass: 'text-slate-500', glowClass: '' }
}

export default function ResurrectionScore({
  score,
  size = 'md',
  showLabel = true,
}: ResurrectionScoreProps) {
  const tier = TIER(score)

  const numSize =
    size === 'lg' ? 'text-4xl' :
    size === 'sm' ? 'text-xl'  : 'text-3xl'

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={cn(`font-serif ${numSize} leading-none`, tier.colorClass, tier.glowClass)}>
        {score}
      </span>
      {showLabel && (
        <>
          <span className="font-sans text-[10px] uppercase tracking-widest font-bold text-bureau-dim">
            Resurrection Score
          </span>
          <span className={cn('font-sans text-[10px] uppercase tracking-wide', tier.colorClass)}>
            {tier.label}
          </span>
        </>
      )}
    </div>
  )
}
