import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import PageWrapper from '@/components/bureau/PageWrapper'
import AdoptButton from '@/components/bureau/AdoptButton'
import CauseOfDeathBadge from '@/components/bureau/CauseOfDeathBadge'
import { formatDate } from '@/lib/utils/format'
import type { Profile } from '@/lib/types/database'

interface AdoptableProject {
  id: string
  title: string
  description: string | null
  ghost_letter: string | null
  causes_of_death: string[]
  project_type: string
  adoption_type: string
  adoption_price: number | null
  died_at: string
  is_adopted: boolean
  profiles: Pick<Profile, 'username' | 'display_name' | 'avatar_url'>
}

function AdoptionTypeBadge({ type, price }: { type: string; price: number | null }) {
  if (type === 'free') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[0.62rem] font-bold uppercase tracking-widest bg-bureau-green/10 border border-bureau-green/30 text-bureau-green">
        Free
      </span>
    )
  }
  if (type === 'resurrection_rights' && price) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[0.62rem] font-bold uppercase tracking-widest bg-bureau-gold/10 border border-bureau-gold/30 text-bureau-gold">
        ${price}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[0.62rem] font-bold uppercase tracking-widest bg-white/5 border border-white/10 text-bureau-dim">
      {type.replace(/_/g, ' ')}
    </span>
  )
}

function ProjectTypeIcon({ type }: { type: string }) {
  const icons: Record<string, string> = {
    'Web App': 'W', 'Mobile App': 'M', 'Game': 'G', 'Hardware': 'H',
    'Writing': 'Wr', 'Design': 'D', 'Music': 'Mu', 'Business': 'B',
    'Research': 'R', 'Other': '?',
  }
  return (
    <span className="text-[0.58rem] font-bold tracking-widest uppercase text-bureau-dim">
      {icons[type] ?? type.slice(0, 2).toUpperCase()}
    </span>
  )
}

export default async function AdoptionMarketplacePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile: Profile | null = null
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    profile = data
  }

  // Fetch adoptable projects
  const { data: projects } = await supabase
    .from('projects')
    .select('id, title, description, ghost_letter, causes_of_death, project_type, adoption_type, adoption_price, died_at, is_adopted, profiles!creator_id(username, display_name, avatar_url)')
    .eq('is_public', true)
    .eq('is_adopted', false)
    .order('created_at', { ascending: false })
    .limit(48)

  const adoptable = (projects ?? []) as unknown as AdoptableProject[]
  const free = adoptable.filter(p => p.adoption_type === 'free').length
  const paid = adoptable.filter(p => p.adoption_type !== 'free').length

  return (
    <PageWrapper user={profile}>
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 py-12">

        {/* Header */}
        <div className="mb-10 pb-8 border-b border-white/5">
          <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-bureau-gold mb-3">
            Adoption Registry
          </p>
          <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
            <div>
              <h1 className="font-serif text-5xl md:text-6xl text-bureau-text tracking-tight">
                Available Adoptions
              </h1>
              <p className="font-sans text-sm text-bureau-dim mt-2 max-w-xl">
                Every project here was once someone's dream. Browse, adopt, and resurrect the ones that speak to you.
              </p>
            </div>
            <Link href="/adoption/registry" className="btn-bureau-ghost text-xs px-4 py-2 shrink-0 mt-1">
              View Registry →
            </Link>
          </div>

          {/* Stats strip */}
          <div className="flex flex-wrap gap-6 mt-6">
            <div className="text-sm">
              <span className="text-bureau-text font-semibold tabular-nums">{adoptable.length}</span>
              <span className="text-bureau-dim ml-2">projects awaiting adoption</span>
            </div>
            <div className="hidden sm:block h-4 w-px bg-white/10 self-center" />
            <div className="text-sm">
              <span className="text-bureau-green font-semibold tabular-nums">{free}</span>
              <span className="text-bureau-dim ml-2">free to adopt</span>
            </div>
            <div className="hidden sm:block h-4 w-px bg-white/10 self-center" />
            <div className="text-sm">
              <span className="text-bureau-gold font-semibold tabular-nums">{paid}</span>
              <span className="text-bureau-dim ml-2">paid resurrections</span>
            </div>
          </div>
        </div>

        {/* Empty state */}
        {adoptable.length === 0 && (
          <div className="text-center py-24 border border-dashed border-white/10 rounded-lg">
            <p className="font-serif text-2xl text-bureau-dim mb-3">The archive is quiet.</p>
            <p className="font-sans text-sm text-bureau-dim mb-6">No projects available for adoption yet.</p>
            <Link href="/morgue" className="btn-bureau">Browse the Morgue</Link>
          </div>
        )}

        {/* Project grid */}
        {adoptable.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {adoptable.map((project, i) => {
              const preview = project.ghost_letter ?? project.description
              const creator = project.profiles?.display_name ?? project.profiles?.username ?? 'anonymous'
              const isOwn = user?.id ? false : false // server-side can't check without creator_id on profile

              return (
                <div
                  key={project.id}
                  className="group/card relative rounded-lg overflow-hidden ring-1 ring-white/10 hover:ring-0 transition-all duration-300 flex flex-col"
                >
                  {/* Rotating border on hover */}
                  <div
                    aria-hidden="true"
                    className="card-glow-spin absolute opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none"
                  />

                  <div className="relative m-[1px] rounded-[7px] bg-bureau-card overflow-hidden flex flex-col flex-1">
                    {/* Hover underglow */}
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-t from-bureau-gold/6 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none"
                    />

                    {/* Header */}
                    <div className="tombstone-header relative">
                      <div className="absolute top-3 left-4 text-[0.58rem] font-bold tracking-widest uppercase text-bureau-dim">
                        #{project.id.slice(0, 4).toUpperCase()}
                      </div>
                      <div className="absolute top-3 right-4">
                        <ProjectTypeIcon type={project.project_type} />
                      </div>

                      {/* Arch */}
                      <div className="arch-sm w-10 h-12 mx-auto border border-white/10 group-hover/card:border-bureau-gold/25 mb-3 flex items-center justify-center transition-colors duration-300">
                        <span className="font-serif italic text-[10px] text-bureau-dim group-hover/card:text-bureau-gold/50 transition-colors duration-300">RIP</span>
                      </div>

                      <h3 className="font-serif text-base leading-snug line-clamp-2 mb-1 text-bureau-text group-hover/card:text-amber-100 transition-colors duration-300">
                        {project.title}
                      </h3>
                      <p className="font-sans text-[0.68rem] text-bureau-dim">by {creator}</p>
                    </div>

                    {/* Body */}
                    <div className="px-5 py-4 flex-1 flex flex-col gap-3">
                      {preview && (
                        <p className={`text-xs leading-relaxed line-clamp-3 ${
                          project.ghost_letter
                            ? 'font-serif italic text-bureau-muted/80'
                            : 'font-sans text-bureau-muted'
                        }`}>
                          {project.ghost_letter ? `"${preview}"` : preview}
                        </p>
                      )}

                      {project.causes_of_death.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-auto">
                          {project.causes_of_death.slice(0, 2).map(c => (
                            <CauseOfDeathBadge key={c} cause={c} />
                          ))}
                          {project.causes_of_death.length > 2 && (
                            <span className="cause-tag">+{project.causes_of_death.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="tombstone-footer flex-col gap-3 items-stretch">
                      <div className="flex items-center justify-between w-full">
                        <p className="font-sans text-[0.65rem] text-bureau-dim">
                          {formatDate(project.died_at)}
                        </p>
                        <AdoptionTypeBadge type={project.adoption_type} price={project.adoption_price} />
                      </div>

                      {user ? (
                        <AdoptButton
                          projectId={project.id}
                          adoptionType={project.adoption_type}
                          price={project.adoption_price}
                        />
                      ) : (
                        <Link
                          href="/login"
                          className="btn-bureau w-full text-center text-xs py-2.5"
                        >
                          Sign in to Adopt
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
