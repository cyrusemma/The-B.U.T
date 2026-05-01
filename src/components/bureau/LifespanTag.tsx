import { formatDate, formatLifespan } from '@/lib/utils/format'

interface LifespanTagProps {
  startedAt?: string | null
  diedAt: string
  className?: string
}

export default function LifespanTag({ startedAt, diedAt, className = '' }: LifespanTagProps) {
  return (
    <div className={`flex items-center gap-4 text-center ${className}`}>
      <div>
        <p className="font-sans text-[10px] uppercase tracking-widest mb-1 text-bureau-dim">
          Born
        </p>
        <p className="font-sans text-xs text-bureau-muted">
          {startedAt ? formatDate(startedAt) : 'Unknown'}
        </p>
      </div>

      <div className="h-px flex-1 lifespan-divider" />

      <div>
        <p className="font-sans text-[10px] uppercase tracking-widest mb-1 text-bureau-dim">
          Died
        </p>
        <p className="font-sans text-xs text-bureau-muted">
          {formatDate(diedAt)}
        </p>
      </div>

      {startedAt && (
        <>
          <div className="h-px flex-1 lifespan-divider" />
          <div>
            <p className="font-sans text-[10px] uppercase tracking-widest mb-1 text-bureau-dim">
              Age
            </p>
            <p className="font-sans text-xs text-bureau-muted">
              {formatLifespan(startedAt, diedAt)}
            </p>
          </div>
        </>
      )}
    </div>
  )
}
