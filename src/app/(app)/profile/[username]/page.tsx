import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  AppWindow,
  Brush,
  Code2,
  FileText,
  Flame,
  Grid3X3,
  Music,
  TerminalSquare,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils/format'
import type { Adoption, Profile, Project } from '@/lib/types/database'
import EditProfileForm from './edit-form'
import PageWrapper from '@/components/bureau/PageWrapper'
import type { ProjectWithProfile } from '@/lib/types/database'

type AdoptedProject = Pick<Project, 'id' | 'title' | 'project_type' | 'died_at' | 'description'> | null

type ProfileAdoption = Adoption & {
  projects?: AdoptedProject
}

async function getProfileData(username: string) {
  const supabase = createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (!profile) return null

  const [{ data: projects }, { data: adoptions }] = await Promise.all([
    supabase
      .from('projects')
      .select('*, profiles!creator_id(*), project_files(*), autopsies(*)')
      .eq('creator_id', profile.id)
      .eq('is_public', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('adoptions')
      .select('*, projects!project_id(id, title, project_type, died_at, description)')
      .eq('adopter_id', profile.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
  ])

  return {
    profile: profile as Profile,
    projects: (projects ?? []) as unknown as ProjectWithProfile[],
    adoptions: (adoptions ?? []) as unknown as ProfileAdoption[],
  }
}

async function getCurrentUserId() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id ?? null
}

function projectIcon(projectType?: string | null) {
  const normalized = projectType?.toLowerCase() ?? ''

  if (normalized.includes('design')) return Brush
  if (normalized.includes('music') || normalized.includes('audio')) return Music
  if (normalized.includes('code') || normalized.includes('web') || normalized.includes('app')) return Code2
  if (normalized.includes('business')) return AppWindow

  return FileText
}

function compactNumber(value: number) {
  return new Intl.NumberFormat('en', {
    notation: value >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(value)
}

function yearFromDate(date?: string | null) {
  if (!date) return 'Unknown'
  return new Date(date).getFullYear()
}

function ProfileAvatar({ profile, initials }: { profile: Profile; initials: string }) {
  return (
    <div className="relative z-10 mb-7 h-32 w-32 rounded-full border border-bureau-gold p-1 shadow-[0_0_40px_rgba(217,119,6,0.16)]">
      {profile.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.avatar_url}
          alt={`${profile.display_name ?? profile.username}'s avatar`}
          className="h-full w-full rounded-full object-cover grayscale transition duration-700 hover:grayscale-0"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-bureau-card text-4xl font-serif text-bureau-gold">
          {initials}
        </div>
      )}

      <div className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full border border-bureau-gold bg-bureau-void text-bureau-gold shadow-[0_0_18px_rgba(217,119,6,0.22)]">
        <Flame size={16} fill="currentColor" aria-hidden="true" />
      </div>
    </div>
  )
}

function StatBlock({
  value,
  label,
  highlight = false,
}: {
  value: string | number
  label: string
  highlight?: boolean
}) {
  return (
    <div className="text-center">
      <div
        className={`mb-2 font-serif text-5xl font-semibold leading-none md:text-6xl ${
          highlight ? 'text-bureau-gold glow-gold-sm' : 'text-bureau-text'
        }`}
      >
        {value}
      </div>
      <div className="font-sans text-[0.62rem] font-bold uppercase tracking-[0.18em] text-bureau-muted">
        {label}
      </div>
    </div>
  )
}

function GraveyardCard({ project }: { project: ProjectWithProfile }) {
  const Icon = projectIcon(project.project_type)
  const cause = project.causes_of_death[0] ?? 'Unknown'

  return (
    <Link href={`/morgue/${project.id}`} className="group block h-full cursor-pointer">
      <article className="relative flex h-full min-h-[210px] flex-col overflow-hidden rounded-lg border border-white/10 bg-bureau-card p-7 transition duration-300 hover:-translate-y-1 hover:border-bureau-gold/40 hover:shadow-[0_18px_45px_rgba(0,0,0,0.24)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bureau-gold/8 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        />

        <div className="relative z-10 mb-6 flex items-start justify-between gap-4">
          <Icon size={18} className="text-bureau-muted transition-colors group-hover:text-bureau-gold" aria-hidden="true" />
          <span className="font-sans text-[0.62rem] font-bold uppercase tracking-[0.18em] text-bureau-muted">
            Lost {yearFromDate(project.died_at)}
          </span>
        </div>

        <h3 className="relative z-10 mb-3 font-serif text-xl text-bureau-text transition-colors group-hover:text-bureau-gold">
          {project.title}
        </h3>
        <p className="relative z-10 line-clamp-3 flex-1 font-sans text-sm leading-relaxed text-bureau-muted">
          {project.description ?? project.ghost_letter ?? 'No epitaph was filed for this artifact.'}
        </p>

        <div className="relative z-10 mt-6 flex items-center justify-between gap-4 border-t border-white/10 pt-4">
          <span className="font-sans text-[0.62rem] font-bold uppercase tracking-[0.16em] text-bureau-muted">
            Cause of death:
          </span>
          <span className="max-w-[45%] truncate text-right font-sans text-[0.62rem] font-bold uppercase tracking-[0.14em] text-bureau-text">
            {cause}
          </span>
        </div>
      </article>
    </Link>
  )
}

function ResurrectedProjects({ adoptions }: { adoptions: ProfileAdoption[] }) {
  const resurrected = adoptions.filter((adoption) => adoption.projects)
  const [feature, ...secondary] = resurrected
  const featureProject = feature?.projects

  if (!featureProject) return null

  return (
    <section id="ledger" className="mb-28">
      <div className="mb-10">
        <h2 className="mb-3 font-serif text-3xl text-bureau-text md:text-4xl">
          Projects Brought Back from the Brink
        </h2>
        <p className="max-w-2xl font-sans text-sm leading-relaxed text-bureau-muted">
          Artifacts given a second life through this curator's care.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4 md:grid-rows-2 md:[grid-auto-rows:minmax(220px,1fr)]">
        <Link
          href={`/morgue/${featureProject.id}`}
          className="group relative min-h-[430px] overflow-hidden rounded-xl border border-white/10 bg-[#111827] p-8 transition duration-300 hover:border-bureau-gold/40 md:col-span-2 md:row-span-2"
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(217,119,6,0.16),transparent_32%),radial-gradient(circle_at_80%_80%,rgba(37,99,235,0.12),transparent_34%)] opacity-80 transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute right-6 top-6 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 font-sans text-[0.65rem] font-bold uppercase tracking-wider text-emerald-400">
            Active
          </div>
          <div className="relative z-10 flex h-full flex-col justify-end">
            <span className="mb-4 font-sans text-[0.65rem] font-bold uppercase tracking-[0.18em] text-bureau-gold">
              Resurrected: {feature.resurrected_at ? formatDate(feature.resurrected_at) : 'In progress'}
            </span>
            <h3 className="mb-4 font-serif text-3xl text-bureau-text transition-colors group-hover:text-bureau-gold">
              {featureProject.title}
            </h3>
            <p className="mb-8 max-w-md font-sans text-sm leading-relaxed text-bureau-muted">
              {featureProject.description ??
                'This artifact has left the archive and is being prepared for a second life.'}
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="rounded border border-white/10 px-2 py-1 font-sans text-[0.65rem] text-bureau-muted">
                {featureProject.project_type}
              </span>
              {feature.resurrection_url && (
                <span className="rounded border border-white/10 px-2 py-1 font-sans text-[0.65rem] text-bureau-muted">
                  Live artifact
                </span>
              )}
            </div>
          </div>
        </Link>

        {secondary.slice(0, 3).map((adoption, index) => {
          const project = adoption.projects
          if (!project) return null
          const Icon = index === 0 ? Code2 : index === 1 ? TerminalSquare : Grid3X3

          return (
            <Link
              key={adoption.id}
              href={`/morgue/${project.id}`}
              className={`group rounded-xl border border-white/10 bg-bureau-card p-6 transition duration-300 hover:border-bureau-gold/40 hover:bg-bureau-elevated ${
                index === 0 ? 'md:col-span-2' : ''
              }`}
            >
              <div className={index === 0 ? 'flex h-full flex-col justify-between gap-10' : 'flex h-full flex-col items-center justify-center text-center'}>
                <div className={index === 0 ? 'flex items-start justify-between gap-4' : 'mb-4'}>
                  <h4 className="font-serif text-xl text-bureau-text transition-colors group-hover:text-bureau-gold">
                    {project.title}
                  </h4>
                  <Icon size={20} className="text-bureau-gold" aria-hidden="true" />
                </div>
                <div>
                  {index === 0 && (
                    <p className="mb-4 line-clamp-3 font-sans text-sm leading-relaxed text-bureau-muted">
                      {project.description ?? 'A recovered artifact under active stewardship.'}
                    </p>
                  )}
                  <span className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.18em] text-bureau-muted">
                    Resurrected {adoption.resurrected_at ? yearFromDate(adoption.resurrected_at) : 'soon'}
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

export default async function ProfilePage({ params }: { params: { username: string } }) {
  const [result, currentUserId] = await Promise.all([
    getProfileData(params.username),
    getCurrentUserId(),
  ])

  if (!result) notFound()

  const { profile, projects, adoptions } = result
  const isOwn = currentUserId === profile.id
  const initials = (profile.display_name ?? profile.username ?? '?').slice(0, 2).toUpperCase()
  const resurrectedCount = adoptions.filter((adoption) => adoption.resurrected_at).length
  const preservedFiles = projects.reduce((total, project) => total + (project.project_files?.length ?? 0), 0)

  return (
    <PageWrapper>
      <div className="mx-auto w-full max-w-[1280px] px-5 pb-16 pt-16 md:px-8 lg:px-12">
        <section className="relative mb-24 flex min-h-[430px] flex-col items-center justify-center text-center">
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-bureau-gold/5 blur-3xl"
          />

          <ProfileAvatar profile={profile} initials={initials} />

          <h1 className="relative z-10 mb-3 font-serif text-4xl font-semibold text-bureau-text md:text-5xl">
            {profile.display_name ?? profile.username}
          </h1>

          <div className="relative z-10 mb-6 flex flex-wrap items-center justify-center gap-3">
            <span className="rounded-full border border-bureau-gold/20 bg-bureau-gold/5 px-3 py-1 font-sans text-[0.65rem] font-bold uppercase tracking-[0.18em] text-bureau-gold">
              {resurrectedCount > 0 ? 'Resurrectionist' : 'Curator'}
            </span>
            <span className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.18em] text-bureau-muted">
              @{profile.username}
            </span>
            <span className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.18em] text-bureau-muted">
              Joined {formatDate(profile.created_at)}
            </span>
          </div>

          <p className="ghost-text relative z-10 mx-auto mb-8 max-w-2xl text-lg">
            "{profile.bio ?? 'Seeking fragments of lost ambition. If it had a pulse once, it can beat again.'}"
          </p>

          <div className="relative z-10 flex flex-wrap items-center justify-center gap-3">
            <Link href={isOwn ? '/submit' : '#graveyard'} className="btn-bureau">
              {isOwn ? 'Offer Artifact' : 'View Artifacts'}
            </Link>
            <Link href="#ledger" className="btn-bureau-outline">
              View Ledger
            </Link>
            {isOwn && <EditProfileForm profile={profile} />}
          </div>
        </section>

        <section className="mb-24 grid grid-cols-1 gap-10 border-y border-white/10 py-12 md:grid-cols-3 md:gap-6">
          <StatBlock value={projects.length} label="Artifacts Relinquished" />
          <div className="md:border-x md:border-white/10">
            <StatBlock value={resurrectedCount} label="Successful Resurrections" highlight />
          </div>
          <StatBlock value={compactNumber(preservedFiles)} label="Files Preserved" />
        </section>

        <section id="graveyard" className="mb-28">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="mb-3 font-serif text-3xl text-bureau-text md:text-4xl">The Personal Graveyard</h2>
              <p className="font-sans text-sm leading-relaxed text-bureau-muted">
                Artifacts surrendered to the Bureau by {profile.display_name ?? profile.username}.
              </p>
            </div>
            {projects.length > 3 && (
              <Link
                href={`/profile/${profile.username}`}
                className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.18em] text-bureau-gold hover:underline hover:underline-offset-4"
              >
                View All
              </Link>
            )}
          </div>

          {projects.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {projects.slice(0, 6).map((project) => (
                <GraveyardCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-white/10 py-16 text-center">
              <p className="mb-5 font-serif text-2xl text-bureau-dim">
                {isOwn ? "You haven't filed any projects yet." : 'No projects filed yet.'}
              </p>
              {isOwn && (
                <Link href="/submit" className="btn-bureau">
                  File your first artifact
                </Link>
              )}
            </div>
          )}
        </section>

        <ResurrectedProjects adoptions={adoptions} />
      </div>
    </PageWrapper>
  )
}
