import { formatDistanceToNow, format, differenceInMonths } from 'date-fns'

export function formatDate(date: string | Date) {
  return format(new Date(date), 'MMMM d, yyyy')
}

export function formatRelative(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function formatLifespan(startedAt: string | null, diedAt: string): string {
  if (!startedAt) return 'Unknown lifespan'
  const months = differenceInMonths(new Date(diedAt), new Date(startedAt))
  if (months < 1) return 'Less than a month'
  if (months < 12) return `${months} month${months === 1 ? '' : 's'}`
  const years = Math.floor(months / 12)
  const remaining = months % 12
  if (remaining === 0) return `${years} year${years === 1 ? '' : 's'}`
  return `${years}y ${remaining}m`
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function causeToSlug(cause: string): string {
  return cause.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
}
