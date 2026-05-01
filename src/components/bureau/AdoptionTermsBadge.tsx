import { cn } from '@/lib/utils/cn'

interface AdoptionTermsBadgeProps {
  adoptionType: string | null
  adopted?: boolean
  price?: number | null
  resurrected?: boolean
  size?: 'sm' | 'md'
}

export default function AdoptionTermsBadge({
  adoptionType,
  adopted,
  price,
  resurrected,
  size = 'sm',
}: AdoptionTermsBadgeProps) {
  const sizeClass = size === 'md' ? 'badge-md' : 'badge-sm'

  if (resurrected || (adopted && resurrected !== false)) {
    return (
      <span className={cn('badge badge-green', sizeClass)}>
        Resurrected
      </span>
    )
  }

  if (adopted) {
    return (
      <span className={cn('badge badge-green', sizeClass)}>
        Adopted
      </span>
    )
  }

  if (adoptionType === 'resurrection_rights' && price) {
    return (
      <span className={cn('badge badge-gold', sizeClass)}>
        ${price}
      </span>
    )
  }

  const label =
    adoptionType === 'open_casket'  ? 'Open Casket'
    : adoptionType === 'organ_donor' ? 'Organ Donor'
    : adoptionType === 'resurrection_rights' ? 'For Sale'
    : 'Available'

  return (
    <span className={cn('badge badge-muted', sizeClass)}>
      {label}
    </span>
  )
}
