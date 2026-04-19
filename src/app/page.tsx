import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils/format'
import type { ProjectWithProfile } from '@/lib/types/database'

async function getFeaturedProjects() {
  const supabase = createClient()
  const { data } = await supabase
    .from('projects')
    .select('*, profiles(*), project_files(*), autopsies(*)')
    .eq('is_public', true)
    .eq('featured', true)
    .order('created_at', { ascending: false })
    .limit(3)
  return (data ?? []) as unknown as ProjectWithProfile[]
}

async function getStats() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/stats/daily`,
      { next: { revalidate: 60 } }
    )
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

async function getRecentProjects() {
  const supabase = createClient()
  const { data } = await supabase
    .from('projects')
    .select('*, profiles(*), project_files(*), autopsies(*)')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(6)
  return (data ?? []) as unknown as ProjectWithProfile[]
}

const CAUSE_COLORS: Record<string, string> = {
  'Perfectionism': 'text-purple-400',
  'Ran out of money': 'text-red-400',
  'Scope creep': 'text-blue-400',
  'Lost interest': 'text-yellow-400',
  'Life got in the way': 'text-green-400',
  'Team breakup': 'text-pink-400',
  'Technology became obsolete': 'text-cyan-400',
  'Market vanished': 'text-orange-400',
}

function TombstoneCard({ project }: { project: ProjectWithProfile }) {
  const primaryCause = project.causes_of_death[0]
  return (
    <Link href={`/morgue/${project.id}`} className="group block">
      <div className="bg-slate-900 border border-slate-700/60 rounded-lg p-5 hover:border-amber-600/40
                      transition-all duration-300 hover:shadow-[0_0_20px_rgba(217,119,6,0.08)]
                      hover:-translate-y-0.5">
        {/* Tombstone arch */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-20 border border-slate-600/60 group-hover:border-amber-600/30
                          transition-colors flex items-center justify-center"
               style={{ borderRadius: '50% 50% 0 0 / 30% 30% 0 0' }}>
            <span className="text-slate-600 text-xs font-serif italic">RIP</span>
          </div>
        </div>

        <h3 className="font-serif text-lg text-slate-100 text-center leading-tight mb-1 group-hover:text-amber-100 transition-colors">
          {project.title}
        </h3>
        <p className="text-slate-600 text-xs text-center font-sans mb-3">
          {project.profiles?.username ?? 'unknown'}
        </p>

        <div className="border-t border-slate-700/50 pt-3 space-y-1">
          <p className="text-slate-500 text-xs text-center">
            {formatDate(project.died_at)}
          </p>
          {primaryCause && (
            <p className={`text-xs text-center ${CAUSE_COLORS[primaryCause] ?? 'text-slate-400'}`}>
              {primaryCause}
            </p>
          )}
        </div>

        <div className="mt-3 flex justify-center">
          {project.is_adopted ? (
            <span className="text-xs px-2 py-0.5 rounded border border-green-700/50 bg-green-900/20 text-green-400">
              Adopted
            </span>
          ) : (
            <span className="text-xs px-2 py-0.5 rounded border border-slate-700 text-slate-500">
              {project.adoption_type === 'open_casket' ? 'Open Casket' :
               project.adoption_type === 'organ_donor' ? 'Organ Donor' : 'For Sale'}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

export default async function HomePage() {
  const [featured, stats, recent] = await Promise.all([
    getFeaturedProjects(),
    getStats(),
    getRecentProjects(),
  ])

  return (
    <div className="min-h-screen" style={{ background: '#0f172a' }}>
      {/* Nav */}
      <nav className="border-b border-slate-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-7 h-9 border border-amber-600/50 group-hover:border-amber-600 transition-colors"
                 style={{ borderRadius: '50% 50% 0 0 / 40% 40% 0 0' }} />
            <div>
              <span className="font-serif text-slate-100 text-sm leading-none block">The Bureau</span>
              <span className="text-slate-600 text-xs leading-none">of Unfinished Things</span>
            </div>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/morgue" className="text-slate-400 hover:text-slate-200 text-sm transition-colors">
              Browse Morgue
            </Link>
            <Link href="/submit" className="btn-bureau text-sm py-2 px-4">
              Submit a Corpse
            </Link>
            <Link href="/login" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-block mb-6">
          <span className="text-xs text-amber-600 uppercase tracking-widest font-sans">
            Established in grief, operating in hope
          </span>
        </div>

        <h1 className="font-serif text-6xl md:text-7xl text-slate-100 leading-tight mb-6 candle-glow">
          The Bureau of<br />
          <span className="text-amber-500">Unfinished Things</span>
        </h1>

        <p className="text-slate-400 text-xl leading-relaxed max-w-2xl mx-auto mb-4 font-sans">
          Everyone has a graveyard of projects. We archive yours, diagnose them, and
          let the world adopt what you couldn&apos;t finish.
        </p>
        <p className="text-slate-600 text-sm mb-10">
          Part marketplace. Part therapy. Part archive. The most honest place on the internet.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/submit" className="btn-bureau">
            Submit a Corpse
          </Link>
          <Link href="/morgue" className="btn-bureau-outline">
            Browse the Morgue
          </Link>
        </div>
      </section>

      {/* Live Stats Ticker */}
      {stats && (
        <section className="border-y border-slate-800 bg-slate-900/50">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <p className="text-center text-xs text-slate-600 uppercase tracking-widest mb-4 font-sans">
              Live from the Bureau
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-3xl font-serif text-amber-500 mb-1">
                  {stats.allTime.totalProjects.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500 uppercase tracking-wide">Projects filed</div>
              </div>
              <div>
                <div className="text-3xl font-serif text-green-400 mb-1">
                  {stats.allTime.totalResurrections.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500 uppercase tracking-wide">Resurrected</div>
              </div>
              <div>
                <div className="text-3xl font-serif text-blue-400 mb-1">
                  {stats.allTime.totalAdoptions.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500 uppercase tracking-wide">Adoptions</div>
              </div>
              {stats.topCause && (
                <div>
                  <div className="text-xl font-serif text-purple-400 mb-1 leading-tight">
                    {stats.topCause.name}
                  </div>
                  <div className="text-xs text-slate-500 uppercase tracking-wide">
                    Top killer ({stats.topCause.count})
                  </div>
                </div>
              )}
            </div>

            {stats.today.newProjects > 0 && (
              <p className="text-center text-slate-500 text-sm mt-4">
                Today: {stats.today.newProjects} project{stats.today.newProjects !== 1 ? 's' : ''} died.
                {stats.topCause && (
                  <> Top cause: <span className="text-purple-400">{stats.topCause.name}</span>.</>
                )}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Featured / Recent Projects */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-serif text-2xl text-slate-200">
            {featured.length > 0 ? 'Featured Corpses' : 'Recent Arrivals'}
          </h2>
          <Link href="/morgue" className="text-amber-600 hover:text-amber-500 text-sm transition-colors">
            View all →
          </Link>
        </div>

        {(featured.length > 0 ? featured : recent).length === 0 ? (
          <div className="text-center py-20 border border-dashed border-slate-800 rounded-xl">
            <p className="font-serif text-2xl text-slate-600 mb-3">The morgue is quiet.</p>
            <p className="text-slate-500 text-sm mb-6">No projects have been filed yet. Be the first.</p>
            <Link href="/submit" className="btn-bureau">Submit a Corpse</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-5">
            {(featured.length > 0 ? featured : recent).map((project) => (
              <TombstoneCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="border-t border-slate-800 bg-slate-900/30">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="font-serif text-3xl text-center text-slate-200 mb-12">
            How the Bureau Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'File the Corpse',
                body: 'Upload your abandoned project. Pick its causes of death. Write a ghost letter if you\'d like. The Bureau receives it with dignity.',
              },
              {
                step: '02',
                title: 'The Autopsy',
                body: 'Our AI Pathologist reads the file and delivers a diagnosis—why it really died, what it needed, and whether it can be saved.',
              },
              {
                step: '03',
                title: 'The Adoption',
                body: 'Someone finds your project in the morgue. They adopt it, resurrect it, and give it the ending it deserved.',
              },
            ].map(({ step, title, body }) => (
              <div key={step} className="text-center">
                <div className="text-amber-600/40 font-serif text-5xl mb-3">{step}</div>
                <h3 className="font-serif text-lg text-slate-200 mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed font-sans">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-2xl mx-auto px-6 py-20 text-center">
        <h2 className="font-serif text-4xl text-slate-100 mb-4">
          What&apos;s sitting in your graveyard?
        </h2>
        <p className="text-slate-500 mb-8 font-sans">
          Every abandoned project deserves a proper funeral. File yours today.
        </p>
        <Link href="/submit" className="btn-bureau text-base px-8 py-3">
          Submit a Corpse
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-serif text-slate-600 text-sm italic">
            &ldquo;Every unfinished thing deserves a name.&rdquo;
          </p>
          <div className="flex gap-6 text-xs text-slate-600">
            <Link href="/morgue" className="hover:text-slate-400 transition-colors">Browse Morgue</Link>
            <Link href="/submit" className="hover:text-slate-400 transition-colors">Submit</Link>
            <Link href="/dashboard" className="hover:text-slate-400 transition-colors">Dashboard</Link>
          </div>
          <p className="text-slate-700 text-xs">&copy; {new Date().getFullYear()} The Bureau of Unfinished Things</p>
        </div>
      </footer>
    </div>
  )
}
