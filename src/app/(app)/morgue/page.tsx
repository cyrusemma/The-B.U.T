'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { CAUSES_OF_DEATH, PROJECT_TYPES, type ProjectWithProfile } from '@/lib/types/database'
import PageWrapper from '@/components/bureau/PageWrapper'
import TombstoneCard from '@/components/bureau/TombstoneCard'
import CorpseListItem from '@/components/bureau/CorpseListItem'
import CauseOfDeathBadge from '@/components/bureau/CauseOfDeathBadge'

type ViewMode = 'grid' | 'list'

function FilterSelect({
  label, value, onChange, options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div>
      <label className="block font-sans text-[10px] uppercase tracking-widest text-bureau-dim mb-2">
        {label}
      </label>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-bureau text-xs py-2"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

function TombstoneSkeleton() {
  return (
    <div className="rounded-lg border border-white/5 bg-bureau-card overflow-hidden h-[320px] flex flex-col">
      {/* Header skeleton */}
      <div className="tombstone-header space-y-2">
        <div className="skeleton w-10 h-12 mx-auto rounded" />
        <div className="skeleton h-4 w-3/4 mx-auto rounded" />
        <div className="skeleton h-3 w-1/3 mx-auto rounded" />
      </div>
      {/* Body skeleton */}
      <div className="px-5 py-4 flex-1 space-y-2">
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-5/6 rounded" />
        <div className="skeleton h-3 w-4/6 rounded" />
        <div className="flex gap-2 mt-4">
          <div className="skeleton h-5 w-20 rounded" />
          <div className="skeleton h-5 w-16 rounded" />
        </div>
      </div>
      {/* Footer skeleton */}
      <div className="tombstone-footer">
        <div className="skeleton h-3 w-20 rounded" />
        <div className="skeleton h-5 w-12 rounded" />
      </div>
    </div>
  )
}

export default function MorguePage() {
  const [projects, setProjects]   = useState<ProjectWithProfile[]>([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(true)
  const [page, setPage]           = useState(1)
  const [view, setView]           = useState<ViewMode>('grid')
  const [filters, setFilters]     = useState({ cause: '', type: '', adopted: '', search: '' })
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search), 350)
    return () => clearTimeout(t)
  }, [filters.search])

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (filters.cause)    params.set('cause',   filters.cause)
    if (filters.type)     params.set('type',    filters.type)
    if (filters.adopted)  params.set('adopted', filters.adopted)
    if (debouncedSearch)  params.set('search',  debouncedSearch)
    const res  = await fetch(`/api/projects?${params}`)
    const data = await res.json()
    setProjects(data.projects ?? [])
    setTotal(data.total ?? 0)
    setLoading(false)
  }, [page, filters.cause, filters.type, filters.adopted, debouncedSearch])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  function setFilter(key: keyof typeof filters, value: string) {
    setFilters((p) => ({ ...p, [key]: value }))
    setPage(1)
  }

  function clearFilters() {
    setFilters({ cause: '', type: '', adopted: '', search: '' })
    setPage(1)
  }

  const hasFilters = !!(filters.cause || filters.type || filters.adopted || debouncedSearch)
  const totalPages = Math.ceil(total / 20)

  return (
    <PageWrapper>
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 py-12">

        {/* Header */}
        <div className="mb-10 pb-8 border-b border-white/5">
          <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-bureau-gold mb-3">
            The Archive · Est. 1924
          </p>
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h1 className="font-serif text-5xl md:text-6xl text-bureau-text tracking-tight">
                The Morgue
              </h1>
              <p className="font-sans text-sm text-bureau-dim mt-2">
                {total > 0
                  ? <><span className="text-bureau-gold font-medium">{total.toLocaleString()}</span> projects at rest, awaiting resurrection.</>
                  : 'Awaiting the departed.'}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0 mt-1">
              <Link
                href="/morgue/archive"
                className="text-[0.68rem] font-sans font-bold uppercase tracking-wider text-bureau-dim
                           hover:text-bureau-gold transition-colors px-3 py-2 border border-white/10
                           rounded hover:border-bureau-gold/30"
              >
                Archive →
              </Link>
              <Link href="/submit" className="btn-bureau px-5 py-2 text-xs">
                + Submit
              </Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── Sidebar filters ──────────────────────────────────────────── */}
          <aside className="lg:w-56 flex-shrink-0 space-y-6">

            {/* Search */}
            <div>
              <label htmlFor="morgue-search" className="block font-sans text-[10px] uppercase tracking-widest text-bureau-dim mb-2">
                Search
              </label>
              <input
                id="morgue-search"
                value={filters.search}
                onChange={(e) => setFilter('search', e.target.value)}
                placeholder="Search by name…"
                className="input-bureau text-xs py-2"
              />
            </div>

            <div className="section-divider" />

            <FilterSelect
              label="Cause of death"
              value={filters.cause}
              onChange={(v) => setFilter('cause', v)}
              options={[
                { value: '', label: 'All causes' },
                ...CAUSES_OF_DEATH.map((c) => ({ value: c, label: c })),
              ]}
            />

            <FilterSelect
              label="Project type"
              value={filters.type}
              onChange={(v) => setFilter('type', v)}
              options={[
                { value: '', label: 'All types' },
                ...PROJECT_TYPES.map((t) => ({ value: t, label: t })),
              ]}
            />

            <FilterSelect
              label="Adoption status"
              value={filters.adopted}
              onChange={(v) => setFilter('adopted', v)}
              options={[
                { value: '',      label: 'Any status' },
                { value: 'false', label: 'Available' },
                { value: 'true',  label: 'Adopted' },
              ]}
            />

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="font-sans text-xs text-bureau-gold hover:text-amber-400 transition-colors uppercase tracking-wide"
              >
                Clear filters
              </button>
            )}

            {/* Active cause filter tag */}
            {filters.cause && (
              <div>
                <p className="font-sans text-[10px] uppercase tracking-widest text-bureau-dim mb-2">
                  Active filter
                </p>
                <CauseOfDeathBadge cause={filters.cause} size="md" />
              </div>
            )}

          </aside>

          {/* ── Main grid ────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <p className="font-sans text-xs text-bureau-dim">
                {loading ? 'Loading…' : `${total.toLocaleString()} results`}
              </p>
              {/* Grid / list toggle */}
              <div className="flex items-center gap-1 p-1 rounded border border-white/10 bg-bureau-card">
                <button
                  type="button"
                  onClick={() => setView('grid')}
                  aria-label="Grid view"
                  className={`p-1.5 rounded transition-colors ${view === 'grid' ? 'bg-bureau-gold/15 text-bureau-gold' : 'text-bureau-dim hover:text-bureau-muted'}`}
                >
                  <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                    <rect x="1" y="1" width="6" height="6" rx="1" />
                    <rect x="9" y="1" width="6" height="6" rx="1" />
                    <rect x="1" y="9" width="6" height="6" rx="1" />
                    <rect x="9" y="9" width="6" height="6" rx="1" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setView('list')}
                  aria-label="List view"
                  className={`p-1.5 rounded transition-colors ${view === 'list' ? 'bg-bureau-gold/15 text-bureau-gold' : 'text-bureau-dim hover:text-bureau-muted'}`}
                >
                  <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                    <rect x="1" y="2" width="14" height="2" rx="1" />
                    <rect x="1" y="7" width="14" height="2" rx="1" />
                    <rect x="1" y="12" width="14" height="2" rx="1" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            {loading ? (
              view === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {Array.from({ length: 9 }).map((_, i) => <TombstoneSkeleton key={i} />)}
                </div>
              ) : (
                <div className="space-y-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="skeleton rounded-lg h-20" />
                  ))}
                </div>
              )
            ) : projects.length === 0 ? (
              <div className="text-center py-24 border border-dashed border-white/10 rounded-lg">
                <p className="font-serif text-2xl text-bureau-dim mb-3">Nothing here.</p>
                <p className="font-sans text-sm text-bureau-dim mb-6">
                  {hasFilters
                    ? 'No projects match your filters.'
                    : 'The morgue is empty.'}
                </p>
                {hasFilters ? (
                  <button type="button" onClick={clearFilters} className="btn-bureau">
                    Clear filters
                  </button>
                ) : (
                  <Link href="/submit" className="btn-bureau">Submit the first corpse</Link>
                )}
              </div>
            ) : view === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {projects.map((project, i) => (
                  <TombstoneCard key={project.id} project={project} index={i} />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {projects.map((project, i) => (
                  <CorpseListItem key={project.id} project={project} index={i} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-bureau-outline text-xs py-2 px-4 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>
                <span className="font-sans text-xs text-bureau-dim">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn-bureau-outline text-xs py-2 px-4 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
