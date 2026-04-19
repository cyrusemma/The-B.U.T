import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatRelative } from '@/lib/utils/format'
import type { Project, Adoption } from '@/lib/types/database'

async function getDashboardData(userId: string) {
  const supabase = createClient()

  const [
    { data: projects },
    { data: adoptionsAsAdopter },
    { data: adoptionsAsCreator },
    { data: profile },
  ] = await Promise.all([
    supabase
      .from('projects')
      .select('*')
      .eq('creator_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('adoptions')
      .select('*, projects(title, id)')
      .eq('adopter_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('adoptions')
      .select('*, projects(title, id), profiles!adopter_id(username, display_name)')
      .eq('creator_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single(),
  ])

  return { projects, adoptionsAsAdopter, adoptionsAsCreator, profile }
}

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { projects, adoptionsAsAdopter, adoptionsAsCreator, profile } =
    await getDashboardData(user.id)

  const adoptedCount = (projects ?? []).filter((p: Project) => p.is_adopted).length
  const totalProjects = (projects ?? []).length
  const adoptionRate = totalProjects > 0 ? Math.round((adoptedCount / totalProjects) * 100) : 0

  return (
    <div className="min-h-screen px-4 py-10" style={{ background: '#0f172a' }}>
      {/* Nav */}
      <nav className="max-w-5xl mx-auto flex items-center justify-between mb-10">
        <Link href="/" className="font-serif text-slate-400 hover:text-amber-400 transition-colors text-sm">
          ← The Bureau
        </Link>
        <Link href="/submit" className="btn-bureau text-sm py-2 px-4">
          + Submit Corpse
        </Link>
      </nav>

      <div className="max-w-5xl mx-auto space-y-8">
        {/* Profile header */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-serif text-3xl text-slate-100">
                {profile?.display_name ?? profile?.username ?? 'Anonymous'}
              </h1>
              <p className="text-slate-500 text-sm mt-0.5">@{profile?.username}</p>
              {profile?.bio && (
                <p className="text-slate-400 text-sm mt-2">{profile.bio}</p>
              )}
            </div>
            <div className="text-right">
              <div className="text-3xl font-serif text-amber-500">{profile?.resurrection_score ?? 0}</div>
              <div className="text-xs text-slate-600 uppercase tracking-wide">Resurrection Score</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-slate-700/50">
            <div className="text-center">
              <div className="text-2xl font-serif text-slate-200">{totalProjects}</div>
              <div className="text-xs text-slate-600 mt-0.5">Projects filed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-serif text-slate-200">{adoptedCount}</div>
              <div className="text-xs text-slate-600 mt-0.5">Adopted out</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-serif text-slate-200">{adoptionRate}%</div>
              <div className="text-xs text-slate-600 mt-0.5">Adoption rate</div>
            </div>
          </div>
        </div>

        {/* My Projects */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl text-slate-200">My Projects</h2>
            <Link href="/submit" className="text-amber-600 hover:text-amber-500 text-sm transition-colors">
              + New
            </Link>
          </div>

          {!projects || projects.length === 0 ? (
            <div className="bg-slate-900 border border-dashed border-slate-700 rounded-xl p-10 text-center">
              <p className="font-serif text-slate-600 text-lg mb-2">No corpses filed yet.</p>
              <p className="text-slate-600 text-sm mb-5">
                You have a graveyard. Let&apos;s give it a proper headstone.
              </p>
              <Link href="/submit" className="btn-bureau">Submit your first corpse</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {(projects as Project[]).map((project) => (
                <Link
                  key={project.id}
                  href={`/morgue/${project.id}`}
                  className="block bg-slate-900 border border-slate-700 rounded-xl p-5
                             hover:border-amber-600/40 transition-all hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-serif text-slate-200 mb-0.5 truncate">{project.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-slate-600">
                        <span>{project.project_type}</span>
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
                      {project.is_adopted ? (
                        <span className="text-xs px-2 py-1 rounded bg-green-900/30 border border-green-800/50 text-green-400">
                          Adopted
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-500">
                          Available
                        </span>
                      )}
                      {!project.is_public && (
                        <span className="text-xs px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-600">
                          Private
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Adoptions I Made */}
        {adoptionsAsAdopter && adoptionsAsAdopter.length > 0 && (
          <div>
            <h2 className="font-serif text-xl text-slate-200 mb-4">Projects I Adopted</h2>
            <div className="space-y-3">
              {(adoptionsAsAdopter as (Adoption & { projects: { title: string; id: string } })[]).map(
                (adoption) => (
                  <Link
                    key={adoption.id}
                    href={`/adoption/${adoption.id}`}
                    className="block bg-slate-900 border border-slate-700 rounded-xl p-5
                               hover:border-amber-600/40 transition-all hover:-translate-y-0.5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-serif text-slate-200 mb-0.5">{adoption.projects.title}</h3>
                        <p className="text-xs text-slate-600">
                          {adoption.adoption_type.replace(/_/g, ' ')} ·{' '}
                          {formatRelative(adoption.created_at)}
                        </p>
                      </div>
                      <div>
                        {adoption.resurrected_at ? (
                          <span className="text-xs px-2 py-1 rounded bg-green-900/30 border border-green-800/50 text-green-400">
                            ✓ Resurrected
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 rounded bg-blue-900/30 border border-blue-800/50 text-blue-400">
                            In progress →
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              )}
            </div>
          </div>
        )}

        {/* Adoptions of My Projects */}
        {adoptionsAsCreator && adoptionsAsCreator.length > 0 && (
          <div>
            <h2 className="font-serif text-xl text-slate-200 mb-4">Someone Adopted My Work</h2>
            <div className="space-y-3">
              {(adoptionsAsCreator as (Adoption & {
                projects: { title: string; id: string }
                profiles: { username: string; display_name: string | null }
              })[]).map((adoption) => (
                <Link
                  key={adoption.id}
                  href={`/adoption/${adoption.id}`}
                  className="block bg-slate-900 border border-slate-700 rounded-xl p-5
                             hover:border-amber-600/40 transition-all hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-serif text-slate-200 mb-0.5">{adoption.projects.title}</h3>
                      <p className="text-xs text-slate-600">
                        Adopted by{' '}
                        <span className="text-slate-400">
                          {adoption.profiles?.display_name ?? adoption.profiles?.username}
                        </span>{' '}
                        · {formatRelative(adoption.created_at)}
                      </p>
                    </div>
                    {adoption.resurrected_at ? (
                      <span className="text-xs px-2 py-1 rounded bg-green-900/30 border border-green-800/50 text-green-400">
                        ✓ Resurrected
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded bg-amber-900/30 border border-amber-700/50 text-amber-400">
                        In progress
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Sign out */}
        <div className="text-center pt-4">
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="text-slate-600 hover:text-slate-400 text-sm transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
