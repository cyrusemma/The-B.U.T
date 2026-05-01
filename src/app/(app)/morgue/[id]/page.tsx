import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatFileSize } from '@/lib/utils/format'
import type { ProjectWithProfile, AutopsyWithComments, CuratorNote } from '@/lib/types/database'
import AutopsySection from '@/components/autopsies/AutopsySection'
import AdoptButton from '@/components/adoptions/AdoptButton'
import PageWrapper from '@/components/bureau/PageWrapper'
import GhostLetterBlock from '@/components/bureau/GhostLetterBlock'
import CauseOfDeathBadge from '@/components/bureau/CauseOfDeathBadge'
import AdoptionTermsBadge from '@/components/bureau/AdoptionTermsBadge'
import LifespanTag from '@/components/bureau/LifespanTag'
import CuratorNotes from '@/components/bureau/CuratorNotes'

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

async function getSignedUrls(files: { id: string; storage_path: string }[]) {
  if (!files.length) return {}
  const supabase = createClient()
  const results: Record<string, string> = {}
  await Promise.all(
    files.map(async (file) => {
      const { data } = await supabase.storage
        .from('project-files')
        .createSignedUrl(file.storage_path, 3600)
      if (data?.signedUrl) results[file.id] = data.signedUrl
    })
  )
  return results
}

async function getCuratorNotes(projectId: string, currentUserId: string | null) {
  const supabase = createClient()
  let query = supabase
    .from('curator_notes')
    .select('*, curator:curator_id(username, display_name)')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  query = currentUserId
    ? query.or(`is_public.eq.true,curator_id.eq.${currentUserId}`)
    : query.eq('is_public', true)

  const { data } = await query
  return (data ?? []) as unknown as (CuratorNote & {
    curator: { username: string; display_name: string | null }
  })[]
}

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { submitted?: string }
}) {
  const [project, currentUser] = await Promise.all([
    getProject(params.id),
    getCurrentUser(),
  ])
  if (!project) notFound()

  const signedUrls = await getSignedUrls(project.project_files ?? [])
  const userId  = currentUser?.id ?? null
  const isOwner = userId === project.creator_id
  const autopsy = project.autopsies as unknown as AutopsyWithComments | null
  const curatorNotes = await getCuratorNotes(project.id, userId)

  const adoptionLabel =
    project.adoption_type === 'open_casket'  ? 'Open Casket'
    : project.adoption_type === 'organ_donor' ? 'Organ Donor'
    : 'Resurrection Rights'

  const creatorInitials = (
    project.profiles?.display_name ?? project.profiles?.username ?? '?'
  ).slice(0, 2).toUpperCase()

  return (
    <PageWrapper user={currentUser?.profile}>
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 py-12">

        {/* Submitted success banner */}
        {searchParams.submitted && (
          <div className="card-green rounded-lg p-4 text-center mb-8">
            <p className="font-serif text-lg text-bureau-green mb-1">The corpse has been filed.</p>
            <p className="font-sans text-sm text-bureau-green/70">
              Your project is now at rest in the Bureau. The autopsy has been initiated.
            </p>
          </div>
        )}

        {/* Back nav */}
        <div className="flex items-center justify-between mb-10">
          <Link
            href="/morgue"
            className="font-sans text-xs uppercase tracking-widest text-bureau-dim
                       hover:text-bureau-muted transition-colors flex items-center gap-1"
          >
            ← The Morgue
          </Link>
          {isOwner && (
            <span className="badge badge-gold badge-sm">Your project</span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 items-start">

          {/* ── Main column ──────────────────────────────────────────────── */}
          <div className="space-y-8 min-w-0">

            {/* Obituary header */}
            <div className="glass grain rounded-lg p-8 md:p-10 text-center">
              {/* Tombstone arch */}
              <div className="tombstone w-20 h-24 mx-auto border border-white/15 mb-6
                              flex items-center justify-center">
                <span className="font-serif italic text-sm text-bureau-dim">RIP</span>
              </div>

              <h1 className="font-serif text-3xl md:text-4xl text-bureau-text leading-tight mb-2">
                {project.title}
              </h1>
              <p className="font-sans text-sm text-bureau-dim mb-8">
                Filed by{' '}
                <Link
                  href={`/profile/${project.profiles?.username}`}
                  className="text-bureau-muted hover:text-bureau-text transition-colors"
                >
                  {project.profiles?.display_name ?? project.profiles?.username}
                </Link>
              </p>

              {/* Born / Died / Age */}
              <LifespanTag
                startedAt={project.started_at}
                diedAt={project.died_at}
                className="max-w-sm mx-auto mb-8"
              />

              {/* Causes of death */}
              <div>
                <p className="font-sans text-[10px] uppercase tracking-widest text-bureau-dim mb-3">
                  Causes of Death
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {project.causes_of_death.map((cause) => (
                    <CauseOfDeathBadge key={cause} cause={cause} size="md" />
                  ))}
                </div>
              </div>

              {/* Meta tags */}
              <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
                <span className="badge badge-muted badge-sm">{project.project_type}</span>
                <AdoptionTermsBadge
                  adoptionType={project.adoption_type}
                  adopted={project.is_adopted}
                  price={project.adoption_price}
                  size="sm"
                />
                {project.adoption_price && !project.is_adopted && (
                  <span className="badge badge-gold badge-sm">${project.adoption_price}</span>
                )}
              </div>
            </div>

            {/* Description */}
            {project.description && (
              <div className="card-void rounded-lg p-6">
                <h2 className="font-serif text-lg text-bureau-text mb-3">About this Project</h2>
                <p className="font-sans text-sm text-bureau-muted leading-relaxed">
                  {project.description}
                </p>
              </div>
            )}

            {/* Ghost Letter */}
            {project.ghost_letter && (
              <GhostLetterBlock
                text={project.ghost_letter}
                author={project.profiles?.display_name ?? project.profiles?.username}
              />
            )}

            {/* Files */}
            {project.project_files && project.project_files.length > 0 && (
              <div className="card-void rounded-lg p-6">
                <h2 className="font-serif text-lg text-bureau-text mb-4">
                  The Remains
                  <span className="font-sans text-sm text-bureau-dim ml-2">
                    ({project.project_files.length} file{project.project_files.length !== 1 ? 's' : ''})
                  </span>
                </h2>
                <div className="space-y-2">
                  {project.project_files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between glass rounded px-4 py-3"
                    >
                      <div>
                        <p className="font-sans text-sm text-bureau-text">{file.file_name}</p>
                        <p className="font-sans text-xs text-bureau-dim">
                          {file.file_size_bytes ? formatFileSize(file.file_size_bytes) : 'Unknown size'}
                          {file.file_type && <span className="ml-2">{file.file_type}</span>}
                        </p>
                      </div>
                      {signedUrls[file.id] ? (
                        <a
                          href={signedUrls[file.id]}
                          download={file.file_name}
                          className="btn-bureau-outline text-xs py-1.5 px-3"
                        >
                          Download
                        </a>
                      ) : (
                        <span className="font-sans text-xs text-bureau-dim">Unavailable</span>
                      )}
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

            <CuratorNotes
              projectId={project.id}
              notes={curatorNotes}
              isOwner={!!userId}
              currentUserId={userId}
            />
          </div>

          {/* ── Sticky sidebar ───────────────────────────────────────────── */}
          <aside className="space-y-5 lg:sticky lg:top-24">

            {/* Creator card */}
            <div className="glass grain rounded-lg p-5">
              <p className="font-sans text-[10px] uppercase tracking-widest text-bureau-dim mb-4">
                Filed by
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-bureau-gold/15 border border-bureau-gold/30
                                flex items-center justify-center flex-shrink-0">
                  <span className="font-serif text-sm text-bureau-gold">{creatorInitials}</span>
                </div>
                <div>
                  <p className="font-sans text-sm text-bureau-text font-medium">
                    {project.profiles?.display_name ?? project.profiles?.username}
                  </p>
                  {project.profiles?.username && (
                    <Link
                      href={`/profile/${project.profiles.username}`}
                      className="font-sans text-xs text-bureau-dim hover:text-bureau-gold transition-colors"
                    >
                      @{project.profiles.username}
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Adoption box */}
            {!project.is_adopted && !isOwner && userId && (
              <AdoptButton project={project} currentUserId={userId} />
            )}

            {project.is_adopted && (
              <div className="card-green rounded-lg p-5 text-center">
                <div className="text-bureau-green text-2xl mb-2">✦</div>
                <h3 className="font-serif text-lg text-bureau-green mb-1">
                  This project has been adopted.
                </h3>
                <p className="font-sans text-xs text-bureau-green/60">
                  Someone believed in it enough to carry it forward.
                </p>
              </div>
            )}

            {!userId && !project.is_adopted && (
              <div className="glass grain rounded-lg p-5 text-center">
                <p className="font-sans text-sm text-bureau-muted mb-4">
                  Sign in to adopt this project.
                </p>
                <Link href="/login" className="btn-bureau w-full text-center block">
                  Sign in to adopt
                </Link>
              </div>
            )}

            {/* Séance button */}
            {!project.is_adopted && (
              <div className="text-center">
                <p className="font-sans text-[10px] uppercase tracking-widest text-bureau-dim mb-2">
                  Want a 30-min handoff call?
                </p>
                <button
                  type="button"
                  className="btn-bureau-outline w-full text-xs py-2.5"
                  disabled
                  title="Contact the creator for a live walkthrough"
                >
                  Request a Séance
                </button>
              </div>
            )}
          </aside>

        </div>
      </div>
    </PageWrapper>
  )
}
