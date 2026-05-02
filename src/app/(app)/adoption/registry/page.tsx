'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import PageWrapper from '@/components/bureau/PageWrapper'
import { CheckCircle2, TrendingUp, Users, Zap, Search, ExternalLink } from 'lucide-react'

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
        recentAdoptions: recentFiltered.slice(0, 50),
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
        <div className="min-h-screen bg-bureau-void">
          <div className="max-w-7xl mx-auto px-6 py-24">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="w-8 h-8 border-2 border-amber-600/30 border-t-amber-600 rounded-full animate-spin" />
              <p className="text-sm text-amber-600/70 font-serif">Retrieving adoption records…</p>
            </div>
          </div>
        </div>
      </PageWrapper>
    )
  }

  if (!stats) {
    return (
      <PageWrapper>
        <div className="min-h-screen bg-bureau-void">
          <div className="max-w-7xl mx-auto px-6 py-24 text-center">
            <p className="font-serif text-2xl text-bureau-dim">Unable to load adoption registry</p>
          </div>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <div className="min-h-screen bg-bureau-void text-white">
        {/* Ambient Background */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-600/10 rounded-full mix-blend-screen filter blur-[120px] opacity-30" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-orange-600/5 rounded-full mix-blend-screen filter blur-[150px] opacity-20" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-600/20 bg-amber-600/10 mb-6">
              <CheckCircle2 className="w-4 h-4 text-amber-500" />
              <span className="font-sans text-xs uppercase tracking-widest text-amber-400">
                Adoption Registry
              </span>
            </div>
            <h1 className="font-serif text-5xl md:text-6xl text-white mb-4 font-light">
              The Adoption Registry
            </h1>
            <p className="font-sans text-bureau-muted text-lg max-w-2xl leading-relaxed">
              A living record of projects brought back to life. Track resurrections, celebrate second chances, and witness the circulation of creative work through the Bureau.
            </p>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
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
            ].map(({ icon: Icon, label, value, color }, idx) => {
              const colorMap = {
                amber: { icon: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
                green: { icon: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
                blue: { icon: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
                purple: { icon: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
              }
              const style = colorMap[color as keyof typeof colorMap]
              return (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="glass-morphism rounded-2xl p-8 border border-white/10"
                >
                  <div className={`w-12 h-12 rounded-xl ${style.bg} border ${style.border} flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 ${style.icon}`} />
                  </div>
                  <div className="font-serif text-4xl text-white mb-2 font-light">{value}</div>
                  <div className="font-sans text-xs uppercase tracking-widest text-bureau-dim">
                    {label}
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Filters and Search */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-wrap gap-3">
              {['all', 'active', 'resurrected'].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => {
                    setFilter(f as 'all' | 'active' | 'resurrected')
                    setSearch('')
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-sans font-semibold transition-all ${
                    filter === f
                      ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-black shadow-lg shadow-amber-600/20'
                      : 'glass-morphism border border-white/10 text-bureau-muted hover:border-white/20'
                  }`}
                >
                  {f === 'all' ? 'All Adoptions' : f === 'active' ? 'Active Projects' : '✓ Resurrected'}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-bureau-dim" />
              <input
                type="text"
                placeholder="Search by project, creator, or adopter…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-bureau-dim focus:outline-none focus:border-amber-600/50 focus:ring-1 focus:ring-amber-600/50 transition-colors"
              />
            </div>
          </div>

          {/* Adoptions List */}
          <div className="glass-morphism rounded-2xl border border-white/10 overflow-hidden">
            {stats.recentAdoptions.length === 0 ? (
              <div className="text-center py-16">
                <p className="font-serif text-xl text-bureau-dim mb-2">No adoptions found</p>
                <p className="font-sans text-sm text-bureau-dim">
                  {search ? 'Try adjusting your search' : 'The archive awaits its first adopter'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-white/10 bg-white/5">
                    <tr className="text-left">
                      <th className="px-6 py-4 font-sans text-xs uppercase tracking-widest text-bureau-dim">
                        Project
                      </th>
                      <th className="px-6 py-4 font-sans text-xs uppercase tracking-widest text-bureau-dim">
                        Creator
                      </th>
                      <th className="px-6 py-4 font-sans text-xs uppercase tracking-widest text-bureau-dim">
                        Adopter
                      </th>
                      <th className="px-6 py-4 font-sans text-xs uppercase tracking-widest text-bureau-dim">
                        Status
                      </th>
                      <th className="px-6 py-4 font-sans text-xs uppercase tracking-widest text-bureau-dim">
                        Date
                      </th>
                      <th className="px-6 py-4 font-sans text-xs uppercase tracking-widest text-bureau-dim" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {stats.recentAdoptions.map((adoption, idx) => (
                      <motion.tr
                        key={adoption.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="font-serif text-sm text-white font-medium">
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
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-sans font-semibold
                                           bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                                <CheckCircle2 className="w-3 h-3" />
                                Resurrected
                              </span>
                            ) : (
                              <span className={`px-3 py-1.5 rounded-full text-xs font-sans font-semibold ${
                                adoption.status === 'active'
                                  ? 'bg-blue-500/10 border border-blue-500/30 text-blue-400'
                                  : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
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
                            href={`/adoption/${adoption.id}`}
                            className="inline-flex items-center gap-1.5 text-amber-500 hover:text-amber-400 font-sans text-xs transition-colors"
                          >
                            View
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </td>
                      </motion.tr>
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
