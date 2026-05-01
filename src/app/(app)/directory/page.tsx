import Link from 'next/link'
import PageWrapper from '@/components/bureau/PageWrapper'
import {
  Archive,
  ArrowRight,
  BarChart3,
  BookOpen,
  Heart,
  MapPin,
  ScrollText,
  Users,
} from 'lucide-react'

const sections = [
  {
    icon: BookOpen,
    title: 'Explore',
    description: 'Browse and discover abandoned projects',
    links: [
      { href: '/morgue', label: 'The Morgue', description: 'Main collection of all projects' },
      { href: '/morgue/archive', label: 'Historical Archive', description: 'Era-based filtering and search' },
      { href: '/adoption/registry', label: 'Adoption Registry', description: 'Track project resurrections' },
      { href: '/about', label: 'About the Bureau', description: 'Mission and philosophy' },
    ],
  },
  {
    icon: Heart,
    title: 'Contribute',
    description: 'Submit your own abandoned projects',
    links: [
      { href: '/submit', label: 'File a Corpse', description: 'Submit an abandoned project' },
      { href: '/dashboard', label: 'Your Dashboard', description: 'Manage your projects' },
      { href: '/dashboard', label: 'My Adoptions', description: 'Track projects you have adopted' },
    ],
  },
  {
    icon: Users,
    title: 'Community',
    description: 'Connect with curators and creators',
    links: [
      { href: '/adoption/registry', label: 'Success Stories', description: 'See what has been resurrected' },
      { href: '/morgue', label: 'Collaborate', description: 'Adopt and resurrect projects' },
      { href: '/about', label: 'The Manifesto', description: 'Understand the ritual and the rules' },
    ],
  },
  {
    icon: BarChart3,
    title: 'Insights',
    description: 'Statistics and analytics',
    links: [
      { href: '/', label: 'Live Stats', description: 'Real-time Bureau statistics' },
      { href: '/morgue/archive', label: 'Trends', description: 'Historical patterns and failure modes' },
      { href: '/adoption/registry', label: 'Adoption Trends', description: 'Popular project resurrections' },
    ],
  },
]

const legal = [
  { href: '/terms', label: 'Terms of Rebirth' },
  { href: '/terms#privacy', label: 'Privacy of the Departed' },
]

export default function DirectoryPage() {
  return (
    <PageWrapper>
      <div className="mx-auto max-w-[1280px] px-6 py-16 md:px-12">
        <header className="mb-16 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-bureau-gold/20 bg-bureau-gold/5 px-3 py-1">
            <MapPin className="h-3 w-3 text-bureau-gold" aria-hidden="true" />
            <span className="font-sans text-[0.68rem] font-bold uppercase tracking-[0.18em] text-bureau-gold">
              Directory
            </span>
          </div>
          <h1 className="mb-4 font-serif text-5xl text-bureau-text md:text-6xl">
            Navigate the Bureau
          </h1>
          <p className="mx-auto max-w-2xl font-sans text-lg leading-relaxed text-bureau-muted">
            A complete map of the rooms, ledgers, and rituals inside The Bureau of Unfinished Things.
          </p>
        </header>

        <div className="mb-16 grid gap-8 md:grid-cols-2">
          {sections.map((section) => {
            const Icon = section.icon
            return (
              <section
                key={section.title}
                className="overflow-hidden rounded-lg border border-white/10 bg-bureau-glass transition duration-300 hover:-translate-y-1 hover:border-bureau-gold/40"
              >
                <div className="border-b border-white/10 bg-bureau-card/60 px-6 py-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-bureau-gold/20 bg-bureau-gold/10">
                      <Icon className="h-5 w-5 text-bureau-gold" aria-hidden="true" />
                    </div>
                    <div>
                      <h2 className="font-serif text-xl text-bureau-text">{section.title}</h2>
                      <p className="mt-1 font-sans text-sm text-bureau-dim">{section.description}</p>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-white/10">
                  {section.links.map((link) => (
                    <Link
                      key={`${section.title}-${link.href}-${link.label}`}
                      href={link.href}
                      className="group flex items-start justify-between gap-4 px-6 py-4 transition-colors hover:bg-white/[0.03]"
                    >
                      <span className="min-w-0">
                        <span className="block font-serif text-bureau-text transition-colors group-hover:text-bureau-gold">
                          {link.label}
                        </span>
                        <span className="mt-1 block font-sans text-sm text-bureau-dim">
                          {link.description}
                        </span>
                      </span>
                      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-bureau-dim transition-colors group-hover:text-bureau-gold" />
                    </Link>
                  ))}
                </div>
              </section>
            )
          })}
        </div>

        <section className="mb-16 grid gap-4 sm:grid-cols-2">
          <Link href="/submit" className="btn-bureau justify-between px-6 py-4 text-left">
            Submit a Corpse
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <Link href="/morgue" className="btn-bureau-outline justify-between px-6 py-4 text-left">
            Browse the Morgue
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </section>

        <section className="mb-16 rounded-lg border border-white/10 bg-bureau-glass p-8">
          <h2 className="mb-6 font-serif text-2xl text-bureau-text">Getting Started</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Archive,
                title: 'For Creators',
                description: 'Give abandoned projects a proper funeral and a chance at another ending.',
              },
              {
                icon: Heart,
                title: 'For Adopters',
                description: 'Find projects worth resurrecting and coordinate with their original creators.',
              },
              {
                icon: ScrollText,
                title: 'For Curators',
                description: 'Add notes, diagnoses, and historical context that help others understand the work.',
              },
            ].map(({ icon: Icon, title, description }) => (
              <div key={title}>
                <Icon className="mb-3 h-5 w-5 text-bureau-gold" aria-hidden="true" />
                <h3 className="mb-2 font-serif text-lg text-bureau-text">{title}</h3>
                <p className="font-sans text-sm leading-relaxed text-bureau-muted">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="border-t border-white/10 pt-8 text-center">
          <h2 className="mb-3 font-serif text-lg text-bureau-text">Policies & Information</h2>
          <div className="mb-6 flex flex-wrap justify-center gap-4">
            {legal.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="font-sans text-sm text-bureau-dim transition-colors hover:text-bureau-gold"
              >
                {label}
              </Link>
            ))}
          </div>
          <p className="font-sans text-xs uppercase tracking-[0.16em] text-bureau-dim">
            All rights preserved in glass.
          </p>
        </footer>
      </div>
    </PageWrapper>
  )
}
