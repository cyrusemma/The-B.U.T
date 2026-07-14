import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatRelative } from '@/lib/utils/format'
import type { Project, Adoption } from '@/lib/types/database'
import PageWrapper from '@/components/bureau/PageWrapper'
import ResurrectionScore from '@/components/bureau/ResurrectionScore'
import CandleIndicator from '@/components/bureau/CandleIndicator'
import AdoptionTermsBadge from '@/components/bureau/AdoptionTermsBadge'
import type { CandleState } from '@/components/bureau/CandleIndicator'

async function getDashboardData(userId: string) {
  const supabase = createClient()
  const [
    { data: projects },
    { data: adoptionsAsAdopter },
    { data: adoptionsAsCreator },
    { data: profile },
  ] = await Promise.all([
    supabase.from('projects').select('*').eq('creator_id', userId).order('created_at', { ascending: false }),
    supabase.from('adoptions').select('*, projects(title, id)').eq('adopter_id', userId).order('created_at', { ascending: false }),
    supabase.from('adoptions').select('*, projects(title, id), profiles!adopter_id(username, display_name)').eq('creator_id', userId).order('created_at', { ascending: false }),
    supabase.from('profiles').select('*').eq('id', userId).single(),
  ])
  return { projects, adoptionsAsAdopter, adoptionsAsCreator, profile }
}

function candleStateForProject(project: Project): CandleState {
  if (project.is_adopted) return 'adopted'
  return 'waiting'
}

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { projects, adoptionsAsAdopter, adoptionsAsCreator, profile } =
    await getDashboardData(user.id)

  const adoptedCount   = (projects ?? []).filter((p: Project) => p.is_adopted).length
  const totalProjects  = (projects ?? []).length
  const adoptionRate   = totalProjects > 0 ? Math.round((adoptedCount / totalProjects) * 100) : 0
  const initials       = (profile?.display_name ?? profile?.username ?? '?').slice(0, 2).toUpperCase()

  return (
    <PageWrapper user={profile}>
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 py-12 space-y-10">

        {/* ── Profile header ──────────────────────────────────────────────── */}
        <div className="glass grain rounded-lg p-8">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex items-start gap-5">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-full bg-bureau-gold/15 border border-bureau-gold/30
                              flex items-center justify-center flex-shrink-0 overflow-hidden flex-shrink-0">
                {profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url}
                    alt={`${profile.display_name ?? profile.username}'s avatar`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <span className="font-serif text-xl text-bureau-gold">{initials}</span>
                )}
              </div>
              <div>
                <h1 className="font-serif text-3xl text-bureau-text leading-tight">
                  {profile?.display_name ?? profile?.username ?? 'Anonymous'}
                </h1>
                <p className="font-sans text-sm text-bureau-dim mt-0.5">@{profile?.username}</p>
                {profile?.bio && (
                  <p className="font-sans text-sm text-bureau-muted mt-3 max-w-md leading-relaxed">
                    {profile.bio}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-6">
              <ResurrectionScore score={profile?.resurrection_score ?? 0} size="md" />
              <Link
                href={`/profile/${profile?.username}`}
                className="btn-bureau-outline text-xs py-2 px-4"
              >
                View Profile
              </Link>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/10">
            {[
              { value: totalProjects,  label: 'Projects filed' },
              { value: adoptedCount,   label: 'Adopted out' },
              { value: adoptionRate,   label: 'Adoption rate', suffix: '%' },
            ].map(({ value, label, suffix }) => (
              <div key={label} className="text-center">
                <div className="font-serif text-2xl text-bureau-text">{value}{suffix}</div>
                <div className="font-sans text-xs text-bureau-dim mt-0.5 uppercase tracking-wide">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Candle Wall — mini graveyard ─────────────────────────────────── */}
        {projects && projects.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-serif text-xl text-bureau-text">The Graveyard</h2>
                <p className="font-sans text-xs text-bureau-dim mt-0.5">
                  Each candle burns for a project still waiting.
                </p>
              </div>
              <Link href="/submit" className="btn-bureau text-xs py-2 px-4">
                + New Corpse
              </Link>
            </div>

            <div className="glass grain rounded-lg p-6">
              <div className="flex flex-wrap gap-6 justify-center md:justify-start">
                {(projects as Project[]).slice(0, 12).map((project) => (
                  <Link
                    key={project.id}
                    href={`/morgue/${project.id}`}
                    className="group flex flex-col items-center gap-2 cursor-pointer"
                    title={project.title}
                  >
                    <CandleIndicator state={candleStateForProject(project)} size={32} />
                    {/* Mini tombstone */}
                    <div className="tombstone w-14 h-16 border border-white/10
                                    group-hover:border-bureau-gold/30 transition-colors
                                    bg-bureau-elevated flex items-center justify-center px-1">
                      <p className="font-sans text-[8px] text-bureau-dim text-center leading-tight
                                    group-hover:text-bureau-muted transition-colors line-clamp-3">
                        {project.title}
                      </p>
                    </div>
                    {project.is_adopted && (
                      <span className="font-sans text-[9px] uppercase tracking-widest text-bureau-green">
                        adopted
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── My Projects list ─────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl text-bureau-text">My Projects</h2>
            <Link href="/submit" className="font-sans text-xs text-bureau-gold hover:text-amber-400 transition-colors">
              + New
            </Link>
          </div>

          {!projects || projects.length === 0 ? (
            <div className="glass grain rounded-lg p-12 text-center border border-dashed border-white/10">
              <p className="font-serif text-bureau-dim text-lg mb-2">No corpses filed yet.</p>
              <p className="font-sans text-bureau-dim text-sm mb-5">
                You have a graveyard. Let&apos;s give it a proper headstone.
              </p>
              <Link href="/submit" className="btn-bureau">Submit your first corpse</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {(projects as Project[]).map((project) => (
                <Link
                  key={project.id}
                  href={`/morgue/${project.id}`}
                  className="group block card-void rounded-lg px-5 py-4
                             hover:border-bureau-gold/30 transition-all hover:-translate-y-px"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-serif text-bureau-text mb-0.5 truncate
                                     group-hover:text-amber-100 transition-colors">
                        {project.title}
                      </h3>
                      <div className="flex items-center gap-2 font-sans text-xs text-bureau-dim flex-wrap">
                        <span className="uppercase tracking-wide">{project.project_type}</span>
                        <span>·</span>
                        <span>Died {formatDate(project.died_at)}</span>
                        {project.causes_of_death.length > 0 && (
                          <>
                            <span>·</span>
                            <span>{project.causes_of_death[0]}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <AdoptionTermsBadge
                        adoptionType={project.adoption_type}
                        adopted={project.is_adopted}
                        price={project.adoption_price}
                      />
                      {!project.is_public && (
                        <span className="badge badge-muted badge-sm">Private</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ── Adoptions I Made ─────────────────────────────────────────────── */}
        {adoptionsAsAdopter && adoptionsAsAdopter.length > 0 && (
          <div>
            <h2 className="font-serif text-xl text-bureau-text mb-4">Projects I Adopted</h2>
            <div className="space-y-2">
              {(adoptionsAsAdopter as unknown as (Adoption & { projects: { title: string; id: string } })[]).map(
                (adoption) => (
                  <Link
                    key={adoption.id}
                    href={`/adoption/${adoption.id}`}
                    className="group block card-void rounded-lg px-5 py-4
                               hover:border-bureau-gold/30 transition-all hover:-translate-y-px"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="font-serif text-bureau-text mb-0.5 group-hover:text-amber-100 transition-colors">
                          {adoption.projects.title}
                        </h3>
                        <p className="font-sans text-xs text-bureau-dim">
                          {adoption.adoption_type.replace(/_/g, ' ')} · {formatRelative(adoption.created_at)}
                        </p>
                      </div>
                      {adoption.resurrected_at ? (
                        <span className="badge badge-green badge-sm">✓ Resurrected</span>
                      ) : (
                        <span className="badge badge-blue badge-sm">In progress</span>
                      )}
                    </div>
                  </Link>
                )
              )}
            </div>
          </div>
        )}

        {/* ── Someone Adopted My Projects ──────────────────────────────────── */}
        {adoptionsAsCreator && adoptionsAsCreator.length > 0 && (
          <div>
            <h2 className="font-serif text-xl text-bureau-text mb-4">Someone Adopted My Work</h2>
            <div className="space-y-2">
              {(adoptionsAsCreator as unknown as (Adoption & {
                projects: { title: string; id: string }
                profiles: { username: string; display_name: string | null }
              })[]).map((adoption) => (
                <Link
                  key={adoption.id}
                  href={`/adoption/${adoption.id}`}
                  className="group block card-void rounded-lg px-5 py-4
                             hover:border-bureau-gold/30 transition-all hover:-translate-y-px"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-serif text-bureau-text mb-0.5 group-hover:text-amber-100 transition-colors">
                        {adoption.projects.title}
                      </h3>
                      <p className="font-sans text-xs text-bureau-dim">
                        Adopted by{' '}
                        <span className="text-bureau-muted">
                          {adoption.profiles?.display_name ?? adoption.profiles?.username}
                        </span>
                        {' · '}{formatRelative(adoption.created_at)}
                      </p>
                    </div>
                    {adoption.resurrected_at ? (
                      <span className="badge badge-green badge-sm">✓ Resurrected</span>
                    ) : (
                      <span className="badge badge-gold badge-sm">In progress</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Sign out */}
        <div className="text-center pt-4 pb-8">
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="font-sans text-xs text-bureau-dim hover:text-bureau-muted transition-colors uppercase tracking-widest"
            >
              Sign out
            </button>
          </form>
        </div>

      </div>
    </PageWrapper>
  )
}
