import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatLifespan, formatFileSize } from '@/lib/utils/format'
import type { ProjectWithProfile, AutopsyWithComments } from '@/lib/types/database'
import AutopsySection from '@/components/autopsies/AutopsySection'
import AdoptButton from '@/components/adoptions/AdoptButton'

const CAUSE_COLORS: Record<string, string> = {
  'Perfectionism': 'text-purple-400 border-purple-900/50 bg-purple-900/10',
  'Ran out of money': 'text-red-400 border-red-900/50 bg-red-900/10',
  'Scope creep': 'text-blue-400 border-blue-900/50 bg-blue-900/10',
  'Lost interest': 'text-yellow-400 border-yellow-900/50 bg-yellow-900/10',
  'Life got in the way': 'text-green-400 border-green-900/50 bg-green-900/10',
  'Team breakup': 'text-pink-400 border-pink-900/50 bg-pink-900/10',
  'Technology became obsolete': 'text-cyan-400 border-cyan-900/50 bg-cyan-900/10',
  'Market vanished': 'text-orange-400 border-orange-900/50 bg-orange-900/10',
  'Other': 'text-slate-400 border-slate-700 bg-slate-800/50',
}

async function getProject(id: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('projects')
    .select(`
      *,
      profiles(*),
      project_files(*),
      autopsies(*, autopsy_comments(*, profiles(*)))
    `)
    .eq('id', id)
    .single()
  return data as unknown as (ProjectWithProfile & { autopsies: AutopsyWithComments }) | null
}

async function getCurrentUserId() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { submitted?: string }
}) {
  const [project, userId] = await Promise.all([
    getProject(params.id),
    getCurrentUserId(),
  ])

  if (!project) notFound()

  const isOwner = userId === project.creator_id
  const autopsy = project.autopsies as unknown as AutopsyWithComments | null

  const adoptionLabel =
    project.adoption_type === 'open_casket' ? 'Open Casket'
    : project.adoption_type === 'organ_donor' ? 'Organ Donor'
    : 'Resurrection Rights'

  return (
    <div className="min-h-screen px-4 py-10" style={{ background: '#0f172a' }}>
      {/* Nav */}
      <nav className="max-w-3xl mx-auto flex items-center justify-between mb-10">
        <Link href="/morgue" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
          ← Back to Morgue
        </Link>
        {isOwner && (
          <span className="text-xs text-amber-600 border border-amber-600/40 rounded px-2 py-1">
            Your project
          </span>
        )}
      </nav>

      <div className="max-w-3xl mx-auto space-y-8">
        {/* Submitted success banner */}
        {searchParams.submitted && (
          <div className="bg-green-900/20 border border-green-700/40 rounded-xl p-4 text-center">
            <p className="text-green-400 font-serif text-lg mb-1">The corpse has been filed.</p>
            <p className="text-green-600 text-sm">
              Your project is now at rest in the Bureau. The autopsy has been initiated.
            </p>
          </div>
        )}

        {/* Header */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-20 border border-slate-600/50 flex items-center justify-center"
                 style={{ borderRadius: '50% 50% 0 0 / 40% 40% 0 0' }}>
              <span className="font-serif text-slate-600 text-sm italic">RIP</span>
            </div>
          </div>

          <h1 className="font-serif text-4xl text-slate-100 text-center mb-2 leading-tight">
            {project.title}
          </h1>
          <p className="text-slate-500 text-sm text-center mb-6">
            Filed by{' '}
            <span className="text-slate-300">
              {project.profiles?.display_name ?? project.profiles?.username}
            </span>
          </p>

          <div className="grid grid-cols-3 gap-4 text-center border-t border-b border-slate-700/50 py-5 mb-6">
            <div>
              <div className="text-xs text-slate-600 uppercase tracking-wide mb-1">Born</div>
              <div className="text-slate-300 text-sm">
                {project.started_at ? formatDate(project.started_at) : 'Unknown'}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-600 uppercase tracking-wide mb-1">Died</div>
              <div className="text-slate-300 text-sm">{formatDate(project.died_at)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-600 uppercase tracking-wide mb-1">Age</div>
              <div className="text-slate-300 text-sm">
                {formatLifespan(project.started_at, project.died_at)}
              </div>
            </div>
          </div>

          {/* Causes */}
          <div className="mb-6">
            <p className="text-xs text-slate-600 uppercase tracking-widest mb-3 text-center">
              Causes of Death
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {project.causes_of_death.map((cause) => (
                <span
                  key={cause}
                  className={`px-3 py-1.5 rounded-full border text-sm ${
                    CAUSE_COLORS[cause] ?? 'text-slate-400 border-slate-700 bg-slate-800/50'
                  }`}
                >
                  {cause}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 text-xs text-slate-600">
            <span className="border border-slate-700 rounded px-2 py-1">{project.project_type}</span>
            <span className="border border-slate-700 rounded px-2 py-1">{adoptionLabel}</span>
            {project.adoption_price && (
              <span className="border border-amber-700/50 text-amber-500 rounded px-2 py-1">
                ${project.adoption_price}
              </span>
            )}
            {project.is_adopted && (
              <span className="border border-green-700/50 text-green-400 rounded px-2 py-1">
                Adopted
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        {project.description && (
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
            <h2 className="font-serif text-lg text-slate-300 mb-3">About this Project</h2>
            <p className="text-slate-400 leading-relaxed text-sm font-sans">{project.description}</p>
          </div>
        )}

        {/* Ghost Letter */}
        {project.ghost_letter && (
          <div className="bg-slate-900 border border-amber-700/20 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-4 h-4 border border-amber-600/40 rounded-full" />
              <h2 className="font-serif text-lg text-amber-500/80">Ghost Letter</h2>
            </div>
            <p className="ghost-text text-slate-400 leading-relaxed whitespace-pre-wrap">
              {project.ghost_letter}
            </p>
          </div>
        )}

        {/* Files */}
        {project.project_files && project.project_files.length > 0 && (
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
            <h2 className="font-serif text-lg text-slate-300 mb-4">
              The Remains ({project.project_files.length} file
              {project.project_files.length !== 1 ? 's' : ''})
            </h2>
            <div className="space-y-2">
              {project.project_files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between bg-slate-800 rounded-lg px-4 py-3"
                >
                  <div>
                    <p className="text-slate-300 text-sm">{file.file_name}</p>
                    <p className="text-slate-600 text-xs">
                      {file.file_size_bytes
                        ? formatFileSize(file.file_size_bytes)
                        : 'Unknown size'}
                    </p>
                  </div>
                  <span className="text-slate-600 text-xs">{file.file_type || 'unknown'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Autopsy Report */}
        {autopsy && (
          <AutopsySection
            autopsy={autopsy}
            projectId={project.id}
            currentUserId={userId}
            projectTitle={project.title}
            causesOfDeath={project.causes_of_death}
          />
        )}

        {/* Adoption Section */}
        {!project.is_adopted && !isOwner && userId && (
          <AdoptButton
            project={project}
            currentUserId={userId}
          />
        )}

        {project.is_adopted && (
          <div className="bg-green-900/10 border border-green-700/30 rounded-xl p-6 text-center">
            <div className="text-green-400 text-2xl mb-2">✓</div>
            <h3 className="font-serif text-xl text-green-300 mb-1">This project has been adopted.</h3>
            <p className="text-green-700 text-sm">
              Someone believed in it enough to carry it forward.
            </p>
          </div>
        )}

        {!userId && !project.is_adopted && (
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 text-center">
            <p className="text-slate-400 mb-4 font-sans text-sm">
              Sign in to adopt this project or leave a comment.
            </p>
            <Link href="/login" className="btn-bureau">
              Sign in to adopt
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
