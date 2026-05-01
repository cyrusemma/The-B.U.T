import Link from 'next/link'
import {
  ArrowRight,
  BookOpen,
  Boxes,
  FolderOpen,
  Globe2,
  HeartHandshake,
  History,
  Lightbulb,
  ScrollText,
  Sparkles,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { ProjectWithProfile } from '@/lib/types/database'
import PageWrapper from '@/components/bureau/PageWrapper'

async function getFeaturedProjects() {
  const supabase = createClient()
  const { data } = await supabase
    .from('projects')
    .select('*, profiles!creator_id(*), project_files(*), autopsies(*)')
    .eq('is_public', true)
    .eq('featured', true)
    .order('created_at', { ascending: false })
    .limit(6)

  return (data ?? []) as unknown as ProjectWithProfile[]
}

async function getRecentProjects() {
  const supabase = createClient()
  const { data } = await supabase
    .from('projects')
    .select('*, profiles!creator_id(*), project_files(*), autopsies(*)')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(6)

  return (data ?? []) as unknown as ProjectWithProfile[]
}

async function getStats() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/stats/daily`, { next: { revalidate: 60 } })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

async function getCurrentUser() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, display_name')
    .eq('id', user.id)
    .single()

  return profile
}

function archivalNumber(value?: number | null, fallback = '0') {
  if (typeof value !== 'number') return fallback
  return value.toLocaleString()
}

function AcquisitionCard({
  project,
  featured = false,
}: {
  project: ProjectWithProfile
  featured?: boolean
}) {
  const fileCount = project.project_files?.length ?? 0
  const cause = project.causes_of_death?.[0] ?? 'Unclassified'

  if (featured) {
    return (
      <Link
        href={`/morgue/${project.id}`}
        className="group relative col-span-1 flex min-h-[430px] overflow-hidden rounded-lg border border-white/10 bg-bureau-card p-7 transition duration-300 hover:border-bureau-gold/40 md:col-span-8"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(217,119,6,0.20),transparent_28%),linear-gradient(to_top,#04060A,rgba(8,12,20,0.72),transparent)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-25 mix-blend-overlay transition-transform duration-700 group-hover:scale-105"
          style={{
            backgroundImage:
              'linear-gradient(120deg, rgba(255,255,255,0.08) 0 1px, transparent 1px 16px), radial-gradient(circle at 70% 20%, rgba(255,255,255,0.12), transparent 22%)',
          }}
        />

        <div className="relative z-10 mt-auto max-w-2xl">
          <div className="mb-5 flex flex-wrap gap-2">
            <span className="rounded border border-white/10 bg-black/35 px-2 py-1 font-sans text-[0.65rem] font-bold uppercase tracking-[0.16em] text-bureau-blue backdrop-blur">
              File #{project.id.slice(0, 4).toUpperCase()}
            </span>
            <span className="rounded border border-bureau-gold/20 bg-bureau-gold/10 px-2 py-1 font-sans text-[0.65rem] font-bold uppercase tracking-[0.16em] text-bureau-gold backdrop-blur">
              {project.is_adopted ? 'Adopted' : 'Awaiting Adoption'}
            </span>
          </div>

          <h2 className="mb-3 font-serif text-4xl text-bureau-text md:text-5xl">
            {project.title}
          </h2>
          <p className="mb-7 max-w-xl font-sans text-sm leading-relaxed text-bureau-muted md:text-base">
            {project.description ??
              project.ghost_letter ??
              'A preserved fragment with enough shape to invite another pair of hands.'}
          </p>
          <span className="btn-bureau-ghost gap-2">
            Examine Fragment
            <ArrowRight size={14} aria-hidden="true" />
          </span>
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={`/morgue/${project.id}`}
      className="group relative col-span-1 flex min-h-[260px] flex-col overflow-hidden rounded-lg border border-white/10 bg-bureau-glass p-6 transition duration-300 hover:-translate-y-1 hover:border-bureau-gold/35 md:col-span-4"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-bureau-gold opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-[0.05]"
      />
      <div className="relative z-10 flex h-full flex-col">
        <div className="mb-6 flex items-center justify-between">
          <BookOpen size={28} className="text-bureau-gold" aria-hidden="true" />
          <span className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.16em] text-bureau-dim">
            {fileCount} {fileCount === 1 ? 'remain' : 'remains'}
          </span>
        </div>
        <h3 className="mb-3 font-serif text-2xl text-bureau-text transition-colors group-hover:text-bureau-gold">
          {project.title}
        </h3>
        <p className="line-clamp-4 flex-1 font-sans text-sm leading-relaxed text-bureau-muted">
          {project.description ?? project.ghost_letter ?? `Filed under ${cause}.`}
        </p>
        <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-bureau-muted transition-colors group-hover:text-bureau-gold">
          <span className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.16em]">
            {cause}
          </span>
          <ArrowRight size={16} aria-hidden="true" />
        </div>
      </div>
    </Link>
  )
}

export default async function HomePage() {
  const [featured, recent, stats, user] = await Promise.all([
    getFeaturedProjects(),
    getRecentProjects(),
    getStats(),
    getCurrentUser(),
  ])

  const projects = featured.length > 0 ? featured : recent
  const primaryProject = projects[0]
  const secondaryProjects = projects.slice(1, 4)

  return (
    <PageWrapper user={user}>
      <section className="relative mx-auto flex min-h-[720px] max-w-[1280px] flex-col items-center justify-center px-6 py-24 text-center md:px-12">
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-bureau-gold/30 to-transparent"
        />
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-bureau-gold/5 blur-3xl"
        />

        <div className="relative z-10 flex max-w-3xl flex-col items-center gap-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-bureau-gold/30 bg-bureau-gold/5 px-3 py-1 font-sans text-[0.68rem] font-bold uppercase tracking-[0.18em] text-bureau-gold">
            <span className="h-1.5 w-1.5 rounded-full bg-bureau-gold" />
            Now accepting partial manuscripts
          </div>

          <h1 className="font-serif text-5xl font-light leading-[1.05] text-bureau-text md:text-7xl">
            Resurrect the
            <br />
            <span className="italic text-bureau-gold">Almost Brilliant</span>
          </h1>

          <p className="max-w-2xl font-sans text-base leading-8 text-bureau-muted md:text-lg">
            An archival sanctuary for the incomplete, the abandoned, and the fragments of genius
            lost to time. We preserve the spark before the fade.
          </p>

          <div className="mt-2 flex flex-wrap justify-center gap-4">
            <Link href="/morgue" className="btn-bureau px-8 py-4">
              Enter the Archive
            </Link>
            <Link href="/about" className="btn-bureau-ghost px-8 py-4">
              View Manifest
            </Link>
          </div>
        </div>
      </section>

      <section className="w-full overflow-hidden border-y border-white/5 bg-bureau-surface/40 py-4">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-5 px-6 font-sans text-[0.68rem] font-bold uppercase tracking-[0.16em] text-bureau-muted sm:grid-cols-2 lg:grid-cols-4 md:px-12">
          {[
            {
              icon: FolderOpen,
              label: `${archivalNumber(stats?.allTime?.totalProjects, '0')} Fragments Archived`,
            },
            { icon: History, label: 'Est. 1924' },
            {
              icon: Lightbulb,
              label: `${archivalNumber(stats?.allTime?.totalAdoptions, '0')} Ideas Adopted`,
            },
            { icon: Globe2, label: 'Global Ledger' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center justify-center gap-2 lg:justify-start">
              <Icon size={16} className="text-bureau-gold" aria-hidden="true" />
              {label}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-6 py-20 md:px-12">
        <div className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 font-sans text-[0.68rem] font-bold uppercase tracking-[0.18em] text-bureau-gold">
              Live ledger
            </p>
            <h2 className="font-serif text-3xl text-bureau-text md:text-4xl">
              Recent Acquisitions
            </h2>
          </div>
          <Link
            href="/morgue"
            className="inline-flex items-center gap-2 font-sans text-[0.68rem] font-bold uppercase tracking-[0.16em] text-bureau-gold hover:underline hover:underline-offset-4"
          >
            View Complete Ledger
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/10 py-24 text-center">
            <p className="mb-3 font-serif text-2xl text-bureau-dim">The archive is waiting.</p>
            <p className="mb-6 font-sans text-sm text-bureau-muted">
              No projects have been filed yet. Be the first acquisition.
            </p>
            <Link href="/submit" className="btn-bureau">
              Deposit a Fragment
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
            {primaryProject && <AcquisitionCard project={primaryProject} featured />}
            {secondaryProjects.map((project) => (
              <AcquisitionCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto grid max-w-[1280px] grid-cols-1 gap-6 px-6 pb-24 md:grid-cols-2 md:px-12">
        {[
          {
            href: '/submit',
            icon: Boxes,
            title: 'Deposit a Fragment',
            body: 'Relinquish your stalled projects to the Bureau. Preservation is guaranteed.',
          },
          {
            href: '/adoption/registry',
            icon: HeartHandshake,
            title: 'Adopt an Idea',
            body: 'Browse the Morgue for inspiration. Breathe life into abandoned concepts.',
          },
          {
            href: '/morgue/archive',
            icon: ScrollText,
            title: 'Study the Archive',
            body: 'Filter by era, cause of death, and artifact type to find patterns in unfinished work.',
          },
          {
            href: '/directory',
            icon: Sparkles,
            title: 'Navigate the Bureau',
            body: 'Find the Registry, curator notes, policies, and the other rooms of the institution.',
          },
        ].map(({ href, icon: Icon, title, body }) => (
          <Link
            key={title}
            href={href}
            className="group flex items-start gap-4 rounded-lg border border-white/10 bg-bureau-glass p-6 transition duration-300 hover:-translate-y-1 hover:border-bureau-gold/35"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-bureau-elevated text-bureau-gold">
              <Icon size={22} aria-hidden="true" />
            </span>
            <span>
              <span className="mb-1 block font-serif text-xl text-bureau-text transition-colors group-hover:text-bureau-gold">
                {title}
              </span>
              <span className="block font-sans text-sm leading-relaxed text-bureau-muted">
                {body}
              </span>
            </span>
          </Link>
        ))}
      </section>
    </PageWrapper>
  )
}
