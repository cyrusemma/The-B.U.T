'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { CAUSES_OF_DEATH, PROJECT_TYPES, type ProjectWithProfile } from '@/lib/types/database'
import { formatDate, formatLifespan } from '@/lib/utils/format'

const CAUSE_COLORS: Record<string, string> = {
  'Perfectionism': 'text-purple-400 border-purple-900/50',
  'Ran out of money': 'text-red-400 border-red-900/50',
  'Scope creep': 'text-blue-400 border-blue-900/50',
  'Lost interest': 'text-yellow-400 border-yellow-900/50',
  'Life got in the way': 'text-green-400 border-green-900/50',
  'Team breakup': 'text-pink-400 border-pink-900/50',
  'Technology became obsolete': 'text-cyan-400 border-cyan-900/50',
  'Market vanished': 'text-orange-400 border-orange-900/50',
  'Other': 'text-slate-400 border-slate-700',
}

function TombstoneCard({ project }: { project: ProjectWithProfile }) {
  const primaryCause = project.causes_of_death[0]
  const causeStyle = CAUSE_COLORS[primaryCause] ?? 'text-slate-400 border-slate-700'

  return (
    <Link href={`/morgue/${project.id}`} className="group block">
      <div className="h-full bg-slate-900 border border-slate-700/60 rounded-lg overflow-hidden
                      hover:border-amber-600/40 transition-all duration-300
                      hover:shadow-[0_4px_24px_rgba(0,0,0,0.4)]
                      hover:-translate-y-0.5 flex flex-col">
        {/* Tombstone arch top */}
        <div className="bg-slate-800/60 px-5 pt-6 pb-4 text-center border-b border-slate-700/50">
          <div className="w-12 h-14 mx-auto border border-slate-600/50 group-hover:border-amber-600/30
                          transition-colors mb-3 flex items-center justify-center"
               style={{ borderRadius: '50% 50% 0 0 / 40% 40% 0 0' }}>
            <span className="text-slate-600 text-xs font-serif italic">RIP</span>
          </div>
          <h3 className="font-serif text-base text-slate-100 leading-snug group-hover:text-amber-100 transition-colors line-clamp-2">
            {project.title}
          </h3>
          <p className="text-slate-600 text-xs mt-1 font-sans">
            by {project.profiles?.display_name ?? project.profiles?.username ?? 'unknown'}
          </p>
        </div>

        {/* Body */}
        <div className="px-5 py-4 flex-1 flex flex-col gap-3">
          {project.description && (
            <p className="text-slate-500 text-xs leading-relaxed line-clamp-3">
              {project.description}
            </p>
          )}

          <div className="flex flex-wrap gap-1.5 mt-auto">
            {project.causes_of_death.map((cause) => (
              <span
                key={cause}
                className={`text-xs px-2 py-0.5 rounded border ${CAUSE_COLORS[cause] ?? 'text-slate-400 border-slate-700'}`}
              >
                {cause}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-700/50 bg-slate-800/30">
          <div className="flex items-center justify-between">
            <div className="text-slate-600 text-xs">
              <span>{formatDate(project.died_at)}</span>
              {project.started_at && (
                <span className="ml-2 text-slate-700">
                  · {formatLifespan(project.started_at, project.died_at)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600">{project.project_type}</span>
              {project.is_adopted ? (
                <span className="text-xs px-1.5 py-0.5 rounded bg-green-900/30 border border-green-800/50 text-green-400">
                  Adopted
                </span>
              ) : project.adoption_type === 'resurrection_rights' && project.adoption_price ? (
                <span className="text-xs px-1.5 py-0.5 rounded bg-amber-900/30 border border-amber-700/50 text-amber-400">
                  ${project.adoption_price}
                </span>
              ) : (
                <span className="text-xs px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-500">
                  Free
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function MorguePage() {
  const [projects, setProjects] = useState<ProjectWithProfile[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  const [filters, setFilters] = useState({
    cause: '',
    type: '',
    adopted: '',
    search: '',
  })
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search), 350)
    return () => clearTimeout(t)
  }, [filters.search])

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (filters.cause) params.set('cause', filters.cause)
    if (filters.type) params.set('type', filters.type)
    if (filters.adopted) params.set('adopted', filters.adopted)
    if (debouncedSearch) params.set('search', debouncedSearch)

    const res = await fetch(`/api/projects?${params}`)
    const data = await res.json()
    setProjects(data.projects ?? [])
    setTotal(data.total ?? 0)
    setLoading(false)
  }, [page, filters.cause, filters.type, filters.adopted, debouncedSearch])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  function setFilter(key: keyof typeof filters, value: string) {
    setFilters((p) => ({ ...p, [key]: value }))
    setPage(1)
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="min-h-screen px-4 py-10" style={{ background: '#0f172a' }}>
      {/* Nav */}
      <nav className="max-w-6xl mx-auto flex items-center justify-between mb-10">
        <Link href="/" className="font-serif text-slate-300 hover:text-amber-400 transition-colors text-sm">
          ← The Bureau
        </Link>
        <Link href="/submit" className="btn-bureau text-sm py-2 px-4">
          Submit a Corpse
        </Link>
      </nav>

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-4xl text-slate-100 mb-2">The Morgue</h1>
          <p className="text-slate-500 font-sans text-sm">
            {total > 0 ? `${total.toLocaleString()} projects at rest.` : 'No projects yet.'}
          </p>
        </div>

        {/* Filters */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              value={filters.search}
              onChange={(e) => setFilter('search', e.target.value)}
              placeholder="Search by name…"
              className="bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm
                         text-slate-100 placeholder-slate-600 focus:outline-none
                         focus:border-amber-600/60 col-span-1 md:col-span-1"
            />
            <select
              value={filters.cause}
              onChange={(e) => setFilter('cause', e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm
                         text-slate-300 focus:outline-none focus:border-amber-600/60"
            >
              <option value="">All causes</option>
              {CAUSES_OF_DEATH.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={filters.type}
              onChange={(e) => setFilter('type', e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm
                         text-slate-300 focus:outline-none focus:border-amber-600/60"
            >
              <option value="">All types</option>
              {PROJECT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select
              value={filters.adopted}
              onChange={(e) => setFilter('adopted', e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm
                         text-slate-300 focus:outline-none focus:border-amber-600/60"
            >
              <option value="">Any status</option>
              <option value="false">Available</option>
              <option value="true">Adopted</option>
            </select>
          </div>

          {(filters.cause || filters.type || filters.adopted || debouncedSearch) && (
            <button
              onClick={() => {
                setFilters({ cause: '', type: '', adopted: '', search: '' })
                setPage(1)
              }}
              className="mt-2 text-xs text-amber-600 hover:text-amber-500 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-lg h-64 animate-pulse" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-slate-800 rounded-xl">
            <p className="font-serif text-2xl text-slate-600 mb-3">Nothing here.</p>
            <p className="text-slate-600 text-sm mb-6">
              {filters.cause || filters.type || debouncedSearch
                ? 'No projects match your filters.'
                : 'The morgue is empty.'}
            </p>
            <Link href="/submit" className="btn-bureau">Submit the first corpse</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {projects.map((project) => (
              <TombstoneCard key={project.id} project={project} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded border border-slate-700 text-slate-400 text-sm
                         hover:border-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-slate-500 text-sm">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded border border-slate-700 text-slate-400 text-sm
                         hover:border-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
