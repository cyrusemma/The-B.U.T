'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { ProjectWithProfile } from '@/lib/types/database'
import PageWrapper from '@/components/bureau/PageWrapper'
import { Filter, Search, ArrowRight } from 'lucide-react'

// Era ranges for filtering
const ERA_OPTIONS = [
  { id: 'roaring-20s', label: '2020-2022: The Roaring 20s', range: [2020, 2022] },
  { id: 'winter-2023', label: '2023: The Winter', range: [2023, 2023] },
  { id: 'recent', label: '2024-Present: Recent Casualties', range: [2024, new Date().getFullYear()] },
]

interface ArchiveFilters {
  eras: string[]
  causes: string[]
  search: string
  sortBy: 'recent' | 'oldest' | 'alphabetical'
}

export default function MorgueArchivePage() {
  const [filters, setFilters] = useState<ArchiveFilters>({
    eras: [],
    causes: [],
    search: '',
    sortBy: 'recent',
  })
  const [projects, setProjects] = useState<ProjectWithProfile[]>([])
  const [loading, setLoading] = useState(false)

  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search), 350)
    return () => clearTimeout(t)
  }, [filters.search])

  // Fetch projects on filter change
  useEffect(() => {
    fetchProjects()
  }, [filters.eras, filters.causes, filters.sortBy, debouncedSearch])

  async function fetchProjects() {
    setLoading(true)
    try {
      const supabase = createClient()
      let query = supabase
        .from('projects')
        .select('*, profiles!creator_id(*), project_files(*)')
        .eq('is_public', true)

      // Apply cause filters
      if (filters.causes.length > 0) {
        query = query.filter('causes_of_death', 'cs', `{${filters.causes.join(',')}}`)
      }

      // Apply search
      if (debouncedSearch) {
        query = query.or(
          `title.ilike.%${debouncedSearch}%,description.ilike.%${debouncedSearch}%`
        )
      }

      // Apply sorting
      const orderOptions: {
        column: string
        ascending: boolean
      } = {
        column: filters.sortBy === 'alphabetical' ? 'title' : 'died_at',
        ascending: filters.sortBy === 'oldest',
      }
      query = query.order(orderOptions.column, { ascending: orderOptions.ascending })

      const { data } = await query
      let filtered = (data || []) as unknown as ProjectWithProfile[]

      // Filter by era client-side (date ranges)
      if (filters.eras.length > 0) {
        filtered = filtered.filter((p) => {
          const year = new Date(p.died_at).getFullYear()
          return filters.eras.some((eraId) => {
            const era = ERA_OPTIONS.find((e) => e.id === eraId)
            return era && year >= era.range[0] && year <= era.range[1]
          })
        })
      }

      setProjects(filtered)
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }

  function toggleEra(eraId: string) {
    setFilters((prev) => ({
      ...prev,
      eras: prev.eras.includes(eraId)
        ? prev.eras.filter((e) => e !== eraId)
        : [...prev.eras, eraId],
    }))
  }

  function toggleCause(cause: string) {
    setFilters((prev) => ({
      ...prev,
      causes: prev.causes.includes(cause)
        ? prev.causes.filter((c) => c !== cause)
        : [...prev.causes, cause],
    }))
  }

  function resetFilters() {
    setFilters({
      eras: [],
      causes: [],
      search: '',
      sortBy: 'recent',
    })
  }

  const causes = [
    'Perfectionism',
    'Ran out of money',
    'Scope creep',
    'Lost interest',
    'Life got in the way',
    'Team breakup',
    'Technology became obsolete',
    'Market vanished',
    'Other',
  ]

  return (
    <PageWrapper>
      <div className="min-h-screen px-4 py-12 md:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-12 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-600/20 bg-amber-600/5 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
              <span className="font-sans text-xs uppercase tracking-widest text-amber-600">Archive</span>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl text-bureau-text mb-3">
              The Morgue Archive
            </h1>
            <p className="text-bureau-muted text-lg max-w-2xl">
              A searchable repository of abandoned ambitions, discarded prototypes, and ideas that
              died on the vine. Filter by era, dissect the causes, and study the anatomy of failure.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {/* Sidebar Filters */}
            <aside className="md:col-span-1">
              <div className="sticky top-20 glass grain rounded-lg p-6 space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-white/10">
                  <Filter className="w-4 h-4 text-bureau-gold" />
                  <h2 className="font-serif text-lg text-bureau-text">Taxonomy</h2>
                </div>

                {/* Era Filters */}
                <div>
                  <h3 className="font-sans text-xs uppercase tracking-widest text-bureau-dim mb-3">
                    Era of Demise
                  </h3>
                  <div className="space-y-2">
                    {ERA_OPTIONS.map((era) => (
                      <label key={era.id} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={filters.eras.includes(era.id)}
                          onChange={() => toggleEra(era.id)}
                          className="w-4 h-4 rounded bg-bureau-card border border-white/10 text-bureau-gold
                                   checked:bg-bureau-gold checked:border-bureau-gold cursor-pointer"
                        />
                        <span className="font-sans text-sm text-bureau-muted group-hover:text-bureau-text transition-colors">
                          {era.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Cause Filters */}
                <div>
                  <h3 className="font-sans text-xs uppercase tracking-widest text-bureau-dim mb-3">
                    Cause of Death
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {causes.map((cause) => (
                      <button
                        key={cause}
                        onClick={() => toggleCause(cause)}
                        className={`px-2 py-1 text-xs rounded border font-sans tracking-wide transition-all ${
                          filters.causes.includes(cause)
                            ? 'bg-bureau-gold/20 border-bureau-gold/50 text-bureau-gold'
                            : 'bg-bureau-card/40 border-white/10 text-bureau-muted hover:border-bureau-gold/30'
                        }`}
                      >
                        {cause}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reset Button */}
                <button
                  onClick={resetFilters}
                  className="w-full py-2 bg-bureau-card hover:bg-bureau-elevated border border-white/10
                           font-sans text-xs uppercase tracking-wider text-bureau-muted transition-colors rounded"
                >
                  Reset Filters
                </button>
              </div>
            </aside>

            {/* Main Content */}
            <div className="md:col-span-3">
              {/* Search and Sort Bar */}
              <div className="mb-6 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bureau-dim" />
                  <input
                    type="text"
                    placeholder="Search the archives..."
                    value={filters.search}
                    onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                    className="input-bureau w-full pl-10 pr-4 py-2 text-sm"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-sans text-xs text-bureau-dim uppercase tracking-wide">Sort:</span>
                  <select
                    value={filters.sortBy}
                    aria-label="Sort archive results"
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        sortBy: e.target.value as ArchiveFilters['sortBy'],
                      }))
                    }
                    className="input-bureau rounded px-3 py-2 font-sans text-sm cursor-pointer"
                  >
                    <option value="recent">Date of Demise (Newest)</option>
                    <option value="oldest">Date of Demise (Oldest)</option>
                    <option value="alphabetical">Alphabetical (A-Z)</option>
                  </select>
                </div>
              </div>

              {/* Results Count */}
              <p className="text-sm text-bureau-dim mb-4">
                {loading ? 'Loading...' : `${projects.length} artifact${projects.length !== 1 ? 's' : ''} in archive`}
              </p>

              {/* Projects Grid */}
              {projects.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-white/10 rounded-lg">
                  <p className="font-serif text-2xl text-bureau-dim mb-2">Nothing here.</p>
                  <p className="text-bureau-dim text-sm">
                    {filters.eras.length > 0 || filters.causes.length > 0 || filters.search
                      ? 'No projects match your filters.'
                      : 'The archive is empty.'}
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {projects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/morgue/${project.id}`}
                      className="group relative"
                    >
                      <div className="absolute inset-0 bg-bureau-gold opacity-0 group-hover:opacity-10
                                  blur-xl transition-opacity duration-500 rounded-lg" />

                      <article className="relative bg-bureau-card border border-white/10 rounded-lg
                                    overflow-hidden h-full flex flex-col transition-all duration-300
                                    group-hover:border-bureau-gold/40 group-hover:-translate-y-1">
                        {/* Image Section */}
                        <div className="h-40 bg-bureau-elevated border-b border-white/10 flex items-center
                                    justify-center text-bureau-dim">
                          <div className="text-center text-xs uppercase tracking-widest">
                            {project.project_files?.length
                              ? `${project.project_files.length} preserved file${project.project_files.length === 1 ? '' : 's'}`
                              : 'No files'}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-5 flex flex-col flex-grow">
                          <div className="flex items-start justify-between mb-2">
                            <span className="font-sans text-xs uppercase tracking-widest text-bureau-dim">
                              {new Date(project.died_at).getFullYear()}
                            </span>
                            <span className="text-xs px-2 py-1 rounded bg-bureau-elevated text-bureau-muted font-sans">
                              {project.project_type}
                            </span>
                          </div>

                          <h3 className="font-serif text-lg text-bureau-text mb-2 group-hover:text-bureau-gold
                                    transition-colors line-clamp-2">
                            {project.title}
                          </h3>

                          <p className="font-sans text-sm text-bureau-muted mb-4 line-clamp-2 flex-grow">
                            {project.description || 'No description provided'}
                          </p>

                          <div className="flex items-center justify-between pt-4 border-t border-white/10">
                            <div className="flex flex-wrap gap-1">
                              {project.causes_of_death && project.causes_of_death.length > 0 && (
                                <span className="text-xs px-2 py-1 rounded bg-bureau-gold/10 text-bureau-gold font-sans">
                                  {project.causes_of_death[0]}
                                </span>
                              )}
                            </div>
                            <ArrowRight className="w-3 h-3 text-bureau-dim group-hover:text-bureau-gold
                                           transition-colors" />
                          </div>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
