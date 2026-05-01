'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import PageWrapper from '@/components/bureau/PageWrapper'
import { CheckCircle2, TrendingUp, Users, Zap, Search } from 'lucide-react'

interface AdoptionStats {
  totalAdoptions: number
  activeAdoptions: number
  resurrectedProjects: number
  pendingTransfers: number
  recentAdoptions: Array<{
    id: string
    project_id: string
    projectTitle: string
    creatorName: string
    adopterName: string
    adoptedAt: string
    status: string
    resurrected: boolean
  }>
}

export default function AdoptionRegistryPage() {
  const [stats, setStats] = useState<AdoptionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'resurrected'>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchAdoptionData()
  }, [filter])

  async function fetchAdoptionData() {
    setLoading(true)
    try {
      const supabase = createClient()

      // Get adoption statistics
      const { data: adoptions } = await supabase
        .from('adoptions')
        .select(
          `
          id,
          project_id,
          status,
          resurrected_at,
          created_at,
          projects!project_id(id, title),
          profiles!creator_id(username, display_name),
          adopter:profiles!adopter_id(username, display_name)
        `
        )
        .order('created_at', { ascending: false })
        .limit(100)

      const adoptionList = (adoptions || []) as any[]

      const totalAdoptions = adoptionList.length
      const activeAdoptions = adoptionList.filter((a) => a.status === 'active').length
      const resurrectedProjects = adoptionList.filter((a) => a.resurrected_at).length
      const pendingTransfers = adoptionList.filter((a) => a.status === 'pending').length

      // Format recent adoptions
      let recentFiltered = adoptionList.map((a) => ({
        id: a.id,
        project_id: a.project_id,
        projectTitle: a.projects?.title || 'Unknown Project',
        creatorName: a.profiles?.display_name || a.profiles?.username || 'Unknown',
        adopterName: a.adopter?.display_name || a.adopter?.username || 'Unknown',
        adoptedAt: a.created_at,
        status: a.status,
        resurrected: !!a.resurrected_at,
      }))

      if (filter === 'resurrected') {
        recentFiltered = recentFiltered.filter((a) => a.resurrected)
      } else if (filter === 'active') {
        recentFiltered = recentFiltered.filter((a) => a.status === 'active')
      }

      if (search) {
        const searchLower = search.toLowerCase()
        recentFiltered = recentFiltered.filter(
          (a) =>
            a.projectTitle.toLowerCase().includes(searchLower) ||
            a.creatorName.toLowerCase().includes(searchLower) ||
            a.adopterName.toLowerCase().includes(searchLower)
        )
      }

      setStats({
        totalAdoptions,
        activeAdoptions,
        resurrectedProjects,
        pendingTransfers,
        recentAdoptions: recentFiltered.slice(0, 20),
      })
    } catch (error) {
      console.error('Error fetching adoption data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <PageWrapper>
        <div className="min-h-screen px-4 md:px-6 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-20 bg-bureau-elevated rounded" />
              <div className="grid md:grid-cols-4 gap-4">
                {Array(4)
                  .fill(null)
                  .map((_, i) => (
                    <div key={i} className="h-32 bg-bureau-elevated rounded" />
                  ))}
              </div>
            </div>
          </div>
        </div>
      </PageWrapper>
    )
  }

  if (!stats) {
    return (
      <PageWrapper>
        <div className="min-h-screen px-4 md:px-6 py-12">
          <div className="max-w-7xl mx-auto text-center">
            <p className="font-serif text-2xl text-bureau-muted">Unable to load adoption registry</p>
          </div>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <div className="min-h-screen px-4 md:px-6 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-600/20 bg-amber-600/5 mb-4">
              <CheckCircle2 className="w-3 h-3 text-bureau-gold" />
              <span className="font-sans text-xs uppercase tracking-widest text-bureau-gold">
                Adoption Registry
              </span>
            </div>
            <h1 className="font-serif text-5xl md:text-6xl text-bureau-text mb-3">
              The Adoption Registry
            </h1>
            <p className="font-sans text-bureau-muted text-lg max-w-2xl">
              A living record of projects brought back to life. Track resurrections, celebrate
              second chances, and witness the circulation of creative work through the Bureau.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {[
              {
                icon: CheckCircle2,
                label: 'Total Adoptions',
                value: stats.totalAdoptions,
                color: 'amber',
              },
              {
                icon: Zap,
                label: 'Active Now',
                value: stats.activeAdoptions,
                color: 'green',
              },
              {
                icon: TrendingUp,
                label: 'Resurrected',
                value: stats.resurrectedProjects,
                color: 'blue',
              },
              {
                icon: Users,
                label: 'Pending Transfer',
                value: stats.pendingTransfers,
                color: 'purple',
              },
            ].map(({ icon: Icon, label, value, color }) => {
              const colorMap = {
                amber: 'text-amber-600 bg-amber-600/10',
                green: 'text-green-600 bg-green-600/10',
                blue: 'text-blue-600 bg-blue-600/10',
                purple: 'text-purple-600 bg-purple-600/10',
              }
              return (
                <div
                  key={label}
                  className="glass grain rounded-lg p-6"
                >
                  <div className={`w-10 h-10 rounded-lg ${colorMap[color as keyof typeof colorMap]} flex items-center justify-center mb-3`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="font-serif text-3xl text-bureau-text mb-1">{value}</div>
                  <div className="font-sans text-xs uppercase tracking-widest text-bureau-dim">
                    {label}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Filters and Search */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-wrap gap-2">
              {['all', 'active', 'resurrected'].map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    setFilter(f as 'all' | 'active' | 'resurrected')
                    setSearch('')
                  }}
                  className={`px-4 py-2 rounded text-sm font-sans font-semibold transition-all ${
                    filter === f
                      ? 'bg-bureau-gold text-bureau-void'
                      : 'bg-bureau-card text-bureau-muted hover:bg-bureau-elevated'
                  }`}
                >
                  {f === 'all' ? 'All Adoptions' : f === 'active' ? 'Active Projects' : 'Resurrected'}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bureau-dim" />
              <input
                type="text"
                placeholder="Search by project, creator, or adopter..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-bureau w-full pl-10 pr-4 py-2.5 text-sm"
              />
            </div>
          </div>

          {/* Adoptions Table */}
          <div className="glass grain rounded-lg overflow-hidden">
            {stats.recentAdoptions.length === 0 ? (
              <div className="text-center py-12">
                <p className="font-serif text-lg text-bureau-dim mb-2">No adoptions found</p>
                <p className="font-sans text-sm text-bureau-dim">
                  {search ? 'Try adjusting your search' : 'Be the first to adopt a project'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-white/10">
                    <tr className="text-left">
                      <th className="px-6 py-3 font-sans text-xs uppercase tracking-widest text-bureau-dim">
                        Project
                      </th>
                      <th className="px-6 py-3 font-sans text-xs uppercase tracking-widest text-bureau-dim">
                        Creator
                      </th>
                      <th className="px-6 py-3 font-sans text-xs uppercase tracking-widest text-bureau-dim">
                        Adopter
                      </th>
                      <th className="px-6 py-3 font-sans text-xs uppercase tracking-widest text-bureau-dim">
                        Status
                      </th>
                      <th className="px-6 py-3 font-sans text-xs uppercase tracking-widest text-bureau-dim">
                        Date
                      </th>
                      <th className="px-6 py-3 font-sans text-xs uppercase tracking-widest text-bureau-dim" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {stats.recentAdoptions.map((adoption) => (
                      <tr
                        key={adoption.id}
                        className="hover:bg-white/[0.03] transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="font-serif text-sm text-bureau-text">
                            {adoption.projectTitle}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-sans text-sm text-bureau-muted">
                            {adoption.creatorName}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-sans text-sm text-bureau-muted">
                            {adoption.adopterName}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {adoption.resurrected ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-sans
                                           bg-green-600/20 border border-green-600/30 text-green-400">
                                <CheckCircle2 className="w-3 h-3" />
                                Resurrected
                              </span>
                            ) : (
                              <span className={`px-2 py-1 rounded text-xs font-sans font-semibold ${
                                adoption.status === 'active'
                                  ? 'bg-blue-600/20 border border-blue-600/30 text-blue-400'
                                  : 'bg-amber-600/20 border border-amber-600/30 text-amber-400'
                              }`}>
                                {adoption.status === 'active' ? 'In Progress' : 'Pending'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-sans text-xs text-bureau-dim">
                            {new Date(adoption.adoptedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/morgue/${adoption.project_id}`}
                            className="text-bureau-gold hover:text-amber-500 font-sans text-xs transition-colors"
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
