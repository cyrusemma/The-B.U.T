import { cn } from '@/lib/utils/cn'

const CAUSE_BADGE_CLASSES: Record<string, string> = {
  'Perfectionism':              'badge-purple',
  'Ran out of money':           'badge-red',
  'Scope creep':                'badge-blue',
  'Lost interest':              'badge-yellow',
  'Life got in the way':        'badge-emerald',
  'Team breakup':               'badge-pink',
  'Technology became obsolete': 'badge-cyan',
  'Market vanished':            'badge-orange',
  'Burnout':                    'badge-red',
  'Other':                      'badge-muted',
}

interface CauseOfDeathBadgeProps {
  cause: string
  size?: 'sm' | 'md'
}

export default function CauseOfDeathBadge({ cause, size = 'sm' }: CauseOfDeathBadgeProps) {
  const badgeClass = CAUSE_BADGE_CLASSES[cause] ?? CAUSE_BADGE_CLASSES['Other']
  const sizeClass = size === 'md' ? 'badge-md' : 'badge-sm'

  return (
    <span className={cn('badge', badgeClass, sizeClass)}>
      {cause}
    </span>
  )
}
