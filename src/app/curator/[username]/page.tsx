import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils/format'
import PageWrapper from '@/components/bureau/PageWrapper'
import ResurrectionScore from '@/components/bureau/ResurrectionScore'
import { Flame, FileText, CheckCircle2, Clock } from 'lucide-react'
import type { Adoption, Project, ProjectWithProfile } from '@/lib/types/database'

type CuratorProfileNote = {
  id: string
  content: string
  project_id: string
  created_at: string
}

type CuratorAdoption = Adoption & {
  projects?: Pick<Project, 'id' | 'title' | 'created_at'> | null
}

async function getCuratorData(username: string) {
  const supabase = createClient()

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (!profile) return null

  // Get curator's public notes count
  const { data: notes } = await supabase
    .from('curator_notes')
    .select('id, content, project_id, created_at')
    .eq('curator_id', profile.id)
    .eq('is_public', true)
    .order('created_at', { ascending: false })

  // Get curator's projects (as creator)
  const { data: projects } = await supabase
    .from('projects')
    .select('*, profiles!creator_id(*), project_files(*), autopsies(*)')
    .eq('creator_id', profile.id)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(6)

  // Get curator's adoptions (as adopter)
  const { data: adoptions } = await supabase
    .from('adoptions')
    .select('*, projects!project_id(id, title, created_at)')
    .eq('adopter_id', profile.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(6)

  return {
    profile,
    notes: (notes || []) as unknown as CuratorProfileNote[],
    projects: (projects || []) as unknown as ProjectWithProfile[],
    adoptions: (adoptions || []) as unknown as CuratorAdoption[],
  }
}

export default async function CuratorProfilePage({ params }: { params: { username: string } }) {
  const data = await getCuratorData(params.username)

  if (!data) {
    notFound()
  }

  const { profile, notes, projects, adoptions } = data

  const stats = {
    totalAnnotations: notes.length,
    projectsCreated: projects.length,
    projectsResurrected: adoptions.length,
    avgAnnotationLength:
      notes.length > 0 ? Math.round(notes.reduce((sum, n) => sum + n.content.length, 0) / notes.length) : 0,
  }

  return (
    <PageWrapper>
      <div className="min-h-screen px-4 md:px-6 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-start justify-between gap-6 mb-6 flex-wrap">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-600/20 bg-amber-600/5 mb-4">
                  <Flame className="w-3 h-3 text-bureau-gold" />
                  <span className="font-sans text-xs uppercase tracking-widest text-bureau-gold">
                    Curator
                  </span>
                </div>
                <h1 className="font-serif text-5xl md:text-6xl text-bureau-text mb-2">
                  {profile.display_name || profile.username}
                </h1>
                <p className="font-sans text-bureau-dim text-lg">@{profile.username}</p>
                {profile.bio && (
                  <p className="font-sans text-bureau-muted mt-4 max-w-2xl leading-relaxed">
                    {profile.bio}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-6">
                <ResurrectionScore score={profile.resurrection_score || 0} size="lg" />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid sm:grid-cols-4 gap-4 mt-8">
              {[
                { icon: FileText, label: 'Annotations', value: stats.totalAnnotations },
                { icon: Clock, label: 'Projects Created', value: stats.projectsCreated },
                { icon: CheckCircle2, label: 'Resurrected', value: stats.projectsResurrected },
                {
                  icon: Flame,
                  label: 'Resurrection Score',
                  value: profile.resurrection_score || 0,
                  formatted: true,
                },
              ].map(({ icon: Icon, label, value, formatted }) => (
                <div
                  key={label}
                  className="glass grain rounded-lg p-4 text-center"
                >
                  <Icon className="w-5 h-5 text-bureau-gold mx-auto mb-2" />
                  <div className="font-serif text-2xl text-bureau-text mb-1">
                    {formatted ? value.toFixed(1) : value}
                  </div>
                  <div className="font-sans text-xs uppercase tracking-widest text-bureau-dim">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-12">
            {/* Recent Annotations */}
            {notes.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-serif text-2xl text-bureau-text">Recent Annotations</h2>
                  <p className="text-xs text-bureau-dim font-sans">
                    {stats.totalAnnotations} total • Avg length{' '}
                    {stats.avgAnnotationLength > 0 ? `${stats.avgAnnotationLength} chars` : 'N/A'}
                  </p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {notes.slice(0, 4).map((note) => (
                    <Link
                      key={note.id}
                      href={`/morgue/${note.project_id}`}
                      className="group bg-bureau-card border border-white/10 rounded-lg p-5
                               hover:border-bureau-gold/40 transition-all hover:-translate-y-0.5"
                    >
                      <p className="font-sans text-xs text-bureau-dim mb-2">
                        {new Date(note.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="font-sans text-sm text-bureau-muted line-clamp-3 group-hover:text-bureau-text transition-colors">
                        {note.content}
                      </p>
                      <div className="mt-3 text-xs text-bureau-gold group-hover:text-amber-500 font-sans flex items-center gap-1">
                        View Project →
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Projects Created */}
            {projects.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-serif text-2xl text-bureau-text">Projects in Curation</h2>
                  {projects.length > 6 && (
                    <Link
                      href={`/profile/${profile.username}?tab=projects`}
                      className="text-xs text-bureau-gold hover:text-amber-500 font-sans transition-colors"
                    >
                      View all →
                    </Link>
                  )}
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projects.slice(0, 6).map((project) => (
                    <Link
                      key={project.id}
                      href={`/morgue/${project.id}`}
                      className="group bg-bureau-card border border-white/10 rounded-lg overflow-hidden
                               hover:border-bureau-gold/40 transition-all hover:-translate-y-1"
                    >
                      <div className="h-32 overflow-hidden bg-bureau-elevated relative flex items-center justify-center border-b border-white/10">
                        <span className="font-sans text-[0.65rem] uppercase tracking-[0.16em] text-bureau-dim">
                          {project.project_files?.length
                            ? `${project.project_files.length} file${project.project_files.length === 1 ? '' : 's'}`
                            : 'No files'}
                        </span>
                      </div>
                      <div className="p-4">
                        <h3 className="font-serif text-sm text-bureau-text group-hover:text-bureau-gold transition-colors line-clamp-2">
                          {project.title}
                        </h3>
                        <p className="font-sans text-xs text-bureau-dim mt-2">
                          {new Date(project.died_at).getFullYear()}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Adopted Projects */}
            {adoptions.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-serif text-2xl text-bureau-text">Resurrections</h2>
                  <p className="text-xs text-bureau-dim font-sans">
                    {adoptions.length} projects brought back to life
                  </p>
                </div>
                <div className="glass grain rounded-lg p-6">
                  <div className="space-y-3">
                    {adoptions.slice(0, 5).map((adoption) => (
                      <div
                        key={adoption.id}
                        className="flex items-center justify-between py-3 border-b border-white/10 last:border-0"
                      >
                        <div>
                          <p className="font-serif text-bureau-text">
                            {adoption.projects?.title || 'Unknown Project'}
                          </p>
                          <p className="font-sans text-xs text-bureau-dim mt-1">
                            Adopted {formatDate(adoption.created_at)}
                          </p>
                        </div>
                        <Link
                          href={`/morgue/${adoption.project_id}`}
                          className="text-bureau-gold hover:text-amber-500 text-xs font-sans transition-colors"
                        >
                          View →
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Empty State */}
            {notes.length === 0 && projects.length === 0 && adoptions.length === 0 && (
              <div className="text-center py-20 border border-dashed border-white/10 rounded-lg">
                <p className="font-serif text-2xl text-bureau-dim mb-2">
                  Just getting started.
                </p>
                <p className="text-bureau-dim text-sm">
                  This curator hasn&apos;t added annotations or projects yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
