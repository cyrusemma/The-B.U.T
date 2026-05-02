import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatRelative, formatLifespan } from '@/lib/utils/format'
import type { ProjectWithProfile, AutopsyWithComments } from '@/lib/types/database'
import PageWrapper from '@/components/bureau/PageWrapper'
import AdoptButton from '@/components/adoptions/AdoptButton'
import ProjectEchoes from '@/components/bureau/ProjectEchoes'

async function getProject(id: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('projects')
    .select('*, profiles!creator_id(*), project_files(*), autopsies(*, autopsy_comments(*, profiles!author_id(*)))')
    .eq('id', id)
    .single()
  return data as unknown as (ProjectWithProfile & { autopsies: AutopsyWithComments }) | null
}

async function getCurrentUser() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles').select('username, display_name').eq('id', user.id).single()
  return { id: user.id, profile }
}

const TYPE_ICONS: Record<string, string> = {
  web_app: '🌐',
  mobile_app: '📱',
  game: '🎮',
  tool: '🔧',
  library: '📦',
  hardware: '⚙️',
  art: '🎨',
  writing: '✍️',
  music: '🎵',
  other: '📁',
}

function fileNumber(id: string) {
  return id.slice(0, 3).toUpperCase() + '-' + id.slice(3, 6).toUpperCase()
}

export default async function ProjectPreviewPage({
  params,
}: {
  params: { id: string }
}) {
  const [project, currentUser] = await Promise.all([
    getProject(params.id),
    getCurrentUser(),
  ])
  if (!project) notFound()

  const userId = currentUser?.id ?? null
  const isOwner = userId === project.creator_id
  const autopsy = project.autopsies as unknown as AutopsyWithComments | null
  const abandonedYear = new Date(project.died_at).getFullYear()
  const lifespan = project.started_at
    ? formatLifespan(project.started_at, project.died_at)
    : null

  const adoptionLabel =
    project.adoption_type === 'open_casket' ? 'Open Casket — Free'
    : project.adoption_type === 'organ_donor' ? 'Organ Donor — Free'
    : `Resurrection Rights — GH₵${project.adoption_price ?? 0}`

  const typeIcon = TYPE_ICONS[project.project_type] ?? '📁'

  return (
    <PageWrapper user={currentUser?.profile}>
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 py-12">

        {/* Back nav */}
        <Link
          href={`/morgue/${project.id}`}
          className="inline-flex items-center gap-1.5 font-sans text-xs uppercase tracking-widest
                     text-bureau-dim hover:text-bureau-muted transition-colors mb-10"
        >
          ← Full Case File
        </Link>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="font-sans text-[10px] uppercase tracking-widest px-2.5 py-1
                             border border-amber-600/40 rounded text-amber-500 bg-amber-500/5">
              FILE #{fileNumber(project.id)}
            </span>
            <span className="font-sans text-[10px] uppercase tracking-widest px-2.5 py-1
                             border border-white/15 rounded text-bureau-dim bg-white/5">
              ABANDONED {abandonedYear}
            </span>
            <span className="font-sans text-[10px] uppercase tracking-widest px-2.5 py-1
                             border border-white/15 rounded text-bureau-dim bg-white/5">
              {typeIcon} {project.project_type.replace(/_/g, ' ')}
            </span>
            {project.is_adopted && (
              <span className="font-sans text-[10px] uppercase tracking-widest px-2.5 py-1
                               border border-emerald-500/40 rounded text-emerald-400 bg-emerald-500/5">
                ✦ ADOPTED
              </span>
            )}
          </div>

          <h1 className="font-serif text-4xl md:text-5xl text-bureau-text leading-tight mb-4">
            {project.title}
          </h1>

          {project.description && (
            <p className="font-sans text-lg text-bureau-muted max-w-2xl leading-relaxed">
              {project.description}
            </p>
          )}
        </div>

        {/* ── 12-col grid ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ── Left column (8 cols) ───────────────────────────────────── */}
          <div className="lg:col-span-8 flex flex-col gap-8">

            {/* Hero gradient banner */}
            <div className="glass-morphism rounded-xl overflow-hidden border border-white/10">
              <div className="relative w-full h-52 md:h-72 flex items-center justify-center
                              bg-gradient-to-br from-[#080C14] via-[#0F1623] to-[#141C2A]">
                <div className="project-hero-glow absolute inset-0 opacity-20" />
                <div className="relative text-center px-8">
                  <div className="text-6xl mb-3">{typeIcon}</div>
                  <p className="font-serif italic text-2xl text-bureau-text/60">{project.title}</p>
                  {lifespan && (
                    <p className="font-sans text-xs uppercase tracking-widest text-bureau-dim mt-2">
                      {lifespan} — {formatDate(project.died_at)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Autopsy Report — bento grid */}
            <section className="glass rounded-xl p-8">
              <h2 className="font-serif text-2xl text-amber-500 mb-6 flex items-center gap-3
                             border-b border-white/10 pb-5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                     className="w-5 h-5 flex-shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                </svg>
                Autopsy Report
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Causes of death */}
                <div>
                  <h3 className="font-sans text-[10px] uppercase tracking-widest text-bureau-dim mb-3">
                    Causes of Abandonment
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {project.causes_of_death.map((cause) => (
                      <span
                        key={cause}
                        className="px-3 py-1 bg-bureau-card rounded border border-white/10
                                   font-sans text-xs text-bureau-text"
                      >
                        {cause}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Lifespan */}
                <div>
                  <h3 className="font-sans text-[10px] uppercase tracking-widest text-bureau-dim mb-3">
                    Lifespan
                  </h3>
                  <div className="space-y-1">
                    {project.started_at && (
                      <p className="font-sans text-sm text-bureau-text">
                        Born: {formatDate(project.started_at)}
                      </p>
                    )}
                    <p className="font-sans text-sm text-bureau-text">
                      Died: {formatDate(project.died_at)}
                    </p>
                    {lifespan && (
                      <p className="font-sans text-xs text-bureau-dim mt-1">
                        Lived {lifespan}
                      </p>
                    )}
                  </div>
                </div>

                {/* AI Pathologist diagnosis */}
                {autopsy?.pathologist_diagnosis && (
                  <div className="md:col-span-2">
                    <h3 className="font-sans text-[10px] uppercase tracking-widest text-bureau-dim mb-3">
                      Pathologist&apos;s Diagnosis
                      {autopsy.confidence_score !== null && (
                        <span className="ml-2 text-amber-500">
                          {autopsy.confidence_score}% confidence
                        </span>
                      )}
                    </h3>
                    <p className="font-sans text-sm text-bureau-muted leading-relaxed">
                      {autopsy.pathologist_diagnosis}
                    </p>
                    {autopsy.pathologist_recommendation && (
                      <p className="font-sans text-sm text-amber-500/70 leading-relaxed mt-3 pl-4
                                    border-l-2 border-amber-600/30">
                        {autopsy.pathologist_recommendation}
                      </p>
                    )}
                  </div>
                )}

                {/* Files inventory */}
                {project.project_files && project.project_files.length > 0 && (
                  <div className="md:col-span-2">
                    <h3 className="font-sans text-[10px] uppercase tracking-widest text-bureau-dim mb-3">
                      Recovered Remains ({project.project_files.length} file{project.project_files.length !== 1 ? 's' : ''})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {project.project_files.map((f) => (
                        <span
                          key={f.id}
                          className="px-3 py-1 bg-bureau-card rounded border border-white/10
                                     font-sans text-xs text-bureau-text"
                        >
                          {f.file_name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Ghost Letter */}
            {project.ghost_letter && (
              <section className="glass grain rounded-xl p-8 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 font-serif italic text-[9rem]
                                text-white/5 leading-none pointer-events-none select-none">
                  &ldquo;
                </div>
                <h2 className="font-sans text-[10px] uppercase tracking-widest text-bureau-dim
                               mb-6 flex items-center gap-3">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                       className="w-4 h-4 flex-shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                  Creator&apos;s Final Note
                </h2>
                <blockquote className="font-serif text-lg text-bureau-text italic leading-relaxed
                                       pl-4 border-l-2 border-amber-600/30 relative z-10">
                  &ldquo;{project.ghost_letter}&rdquo;
                </blockquote>
                <p className="text-right mt-4 font-sans text-xs text-bureau-dim">
                  — {project.profiles?.display_name ?? project.profiles?.username}
                  {project.died_at && (
                    <>, {formatDate(project.died_at)}</>
                  )}
                </p>
              </section>
            )}

            {/* Community Echoes */}
            {autopsy && (
              <ProjectEchoes
                autopsy={autopsy}
                projectId={project.id}
                currentUserId={userId}
              />
            )}
          </div>

          {/* ── Right column — sticky sidebar (4 cols) ─────────────────── */}
          <aside className="lg:col-span-4">
            <div className="sticky top-[88px] glass grain rounded-xl p-7 flex flex-col gap-6">

              {/* Adoption heading */}
              <div>
                <h3 className="font-serif text-2xl text-bureau-text mb-2">
                  Adopt This Project
                </h3>
                <p className="font-sans text-sm text-bureau-muted leading-relaxed">
                  {project.adoption_type === 'open_casket'
                    ? 'Freely available to use, modify, and build upon.'
                    : project.adoption_type === 'organ_donor'
                    ? 'Take parts for your own work. Please credit the original creator.'
                    : 'Receive exclusive rights to revive this project.'}
                </p>
              </div>

              {/* Adoption type + price */}
              <div className="rounded-lg bg-bureau-void/80 border border-white/8 p-4">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-sans text-[10px] uppercase tracking-widest text-bureau-dim">
                    Adoption Type
                  </span>
                  {project.adoption_price && !project.is_adopted && (
                    <span className="font-serif text-xl text-amber-500">
                      GH₵{project.adoption_price}
                    </span>
                  )}
                </div>
                <p className="font-sans text-sm text-bureau-text">{adoptionLabel}</p>
                {project.adoption_type === 'resurrection_rights' && project.adoption_price && (
                  <p className="font-sans text-xs text-bureau-dim mt-1">
                    Creator receives 90% · Bureau takes 10%
                  </p>
                )}
              </div>

              {/* CTA */}
              {!project.is_adopted && !isOwner && userId && (
                <AdoptButton project={project} currentUserId={userId} />
              )}

              {project.is_adopted && (
                <div className="rounded-lg p-4 text-center border border-emerald-500/20 bg-emerald-500/5">
                  <div className="text-2xl mb-1">✦</div>
                  <p className="font-serif text-base text-bureau-green">
                    This project has been adopted.
                  </p>
                  <p className="font-sans text-xs text-bureau-green/60 mt-1">
                    Someone believed in it enough to carry it forward.
                  </p>
                </div>
              )}

              {!userId && !project.is_adopted && (
                <Link
                  href="/login"
                  className="block w-full text-center py-3 rounded-lg bg-amber-600 hover:bg-amber-500
                             text-black font-sans text-sm font-bold uppercase tracking-wide transition-colors"
                >
                  Sign in to Adopt
                </Link>
              )}

              {isOwner && (
                <div className="rounded-lg p-4 text-center border border-white/10 bg-white/5">
                  <p className="font-sans text-xs text-bureau-dim">This is your project.</p>
                </div>
              )}

              {/* Meta list */}
              <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
                <div className="flex items-center gap-3 font-sans text-sm text-bureau-muted">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                       className="w-4 h-4 text-amber-500 flex-shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  <span>
                    Filed by{' '}
                    <Link
                      href={`/profile/${project.profiles?.username}`}
                      className="text-bureau-text hover:text-amber-500 transition-colors"
                    >
                      {project.profiles?.display_name ?? project.profiles?.username}
                    </Link>
                  </span>
                </div>

                {project.project_files && project.project_files.length > 0 && (
                  <div className="flex items-center gap-3 font-sans text-sm text-bureau-muted">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                         className="w-4 h-4 text-amber-500 flex-shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                    </svg>
                    {project.project_files.length} recovered file{project.project_files.length !== 1 ? 's' : ''}
                  </div>
                )}

                {autopsy && (
                  <div className="flex items-center gap-3 font-sans text-sm text-bureau-muted">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                         className="w-4 h-4 text-amber-500 flex-shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                    </svg>
                    {autopsy.community_diagnosis_count} community echo{autopsy.community_diagnosis_count !== 1 ? 'es' : ''}
                  </div>
                )}

                <div className="flex items-center gap-3 font-sans text-sm text-bureau-muted">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                       className="w-4 h-4 text-amber-500 flex-shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
                  </svg>
                  Filed {formatRelative(project.created_at)}
                </div>
              </div>

              {/* Link to full case file */}
              <Link
                href={`/morgue/${project.id}`}
                className="block w-full text-center py-2.5 rounded-lg border border-white/15
                           text-bureau-dim hover:text-bureau-muted hover:border-white/25
                           font-sans text-xs uppercase tracking-widest transition-colors"
              >
                View Full Case File
              </Link>
            </div>
          </aside>

        </div>
      </div>
    </PageWrapper>
  )
}
