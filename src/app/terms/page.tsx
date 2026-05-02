import Link from 'next/link'
import { Key, ScrollText, Mail, ShieldCheck } from 'lucide-react'
import PageWrapper from '@/components/bureau/PageWrapper'

const SECTIONS = [
  {
    id: 'remains',
    title: 'I. Submission of Remains',
    body: `By submitting a project to the Bureau, you attest that the work is yours to submit — either as the original creator, or as an authorized representative of the project's intellectual estate. You may submit work you collaborated on, provided you have the right to offer it for adoption.

Submission does not constitute transfer of copyright or intellectual property. Your remains are preserved under your original license unless an explicit adoption agreement specifying otherwise is signed between you and an adopter.`,
  },
  {
    id: 'adoption',
    title: 'II. The Rite of Adoption',
    body: `Artifacts within The Bureau may be adopted. This is a solemn act of resurrection. The adopting party agrees to honor the spirit of the original creator while forging a new path for the artifact.`,
    items: [
      'The original creator shall be noted as the "Architect of the First Iteration."',
      'The adopting party shall be known as the "Curator of the Second Breath."',
      'Open Casket — Free use. The adopter may use, modify, distribute, and build upon the project without restriction. Attribution is expected.',
      'Resurrection Rights — Paid transfer. A fee is agreed upon and processed through the Bureau. The creator receives 90% of the agreed amount. The Bureau retains 10% as a preservation fee.',
      'The Bureau facilitates this transition but holds no liability for the artifact\'s subsequent behavior in the wild.',
    ],
  },
  {
    id: 'conduct',
    title: 'III. Conduct of the Departed',
    body: `The Bureau is a place of dignity. Submissions must be made in good faith. You may not submit:

— Work that belongs to a third party without authorization
— Content intended to defame, harass, or harm any individual
— Projects that contain unlicensed third-party assets
— Anything that violates applicable law

The Bureau reserves the right to remove any submission that violates these terms without notice.`,
  },
  {
    id: 'fees',
    title: 'IV. Preservation Fees',
    body: `The Bureau charges no fee to file a corpse. Storage of project files is provided without cost for public listings.

For paid resurrections (Resurrection Rights tier), the Bureau retains 10% of the agreed adoption fee as a preservation and facilitation fee. This fee is non-refundable once a transaction is completed.

The Bureau uses Stripe to process payments. By engaging in a paid adoption, you agree to Stripe's terms of service in addition to ours.`,
  },
  {
    id: 'liability',
    title: 'V. Limitation of Liability',
    body: `The Bureau provides a platform for connecting project creators with potential adopters. We do not guarantee that any project will be adopted, resurrected, or used in any particular way.

Creators are responsible for the accuracy of the information provided about their projects. The Bureau is not liable for any disputes arising between creators and adopters regarding the nature, quality, or condition of submitted projects.

We are preservationists, not guarantors.`,
  },
  {
    id: 'privacy',
    title: 'VI. Privacy of the Departed',
    body: `We guard the secrets of the dead. The Bureau collects only what is necessary to maintain the Archives and facilitate the Rite of Adoption.

We do not sell your data. We do not use your ghost letters for training AI models. What you write to your future adopter stays between you and them.

Your public profile and public projects are visible to anyone. Private projects are visible only to you.`,
    hasDataBox: true,
  },
  {
    id: 'oblivion',
    title: 'VII. Final Resting Place',
    body: `Should you wish to completely expunge an artifact from The Bureau, you must submit a formal request. Once granted, the artifact will be removed, its data scattered to the digital winds, never to be reassembled.`,
    hasQuote: true,
  },
]

const COLLECTED_DATA = [
  {
    icon: Key,
    label: 'Curator Credentials',
    desc: 'Information required to verify your identity as an original creator or adopting curator.',
  },
  {
    icon: ScrollText,
    label: 'Artifact Metadata',
    desc: 'The descriptions, tags, and "Cause of Death" you provide upon relinquishment.',
  },
  {
    icon: Mail,
    label: 'Sacred Correspondence',
    desc: 'Communication between creators and adopters facilitated by The Bureau.',
  },
  {
    icon: ShieldCheck,
    label: 'Usage Data',
    desc: 'Anonymous analytics to improve the service. No cross-site tracking. No third-party ad networks.',
  },
]

export default function TermsPage() {
  return (
    <PageWrapper>
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 py-16">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header className="max-w-2xl mx-auto text-center mb-16">
          <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-bureau-gold mb-5 block">
            The Archives · Legal
          </p>
          <h1 className="font-serif text-4xl md:text-5xl text-bureau-text mb-5 tracking-tight">
            Terms of Rebirth &amp;<br className="hidden sm:block" /> Privacy of the Departed
          </h1>
          <div className="w-24 h-px bg-bureau-gold/30 mx-auto mb-6" />
          <p className="font-sans text-sm text-bureau-muted leading-relaxed">
            By submitting remains to the Bureau, you agree to these terms.
            They are written to be understood, not obscured.
          </p>
          <p className="font-sans text-xs text-bureau-dim mt-3">
            Last updated: May 2026
          </p>
        </header>

        <div className="flex gap-12 items-start">

          {/* ── Sticky TOC sidebar (desktop) ────────────────────────────── */}
          <aside className="hidden lg:block w-52 shrink-0 sticky top-24">
            <p className="font-sans text-[10px] uppercase tracking-widest text-bureau-dim mb-4">
              Contents
            </p>
            <nav className="space-y-1">
              {SECTIONS.map(({ id, title }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className="block font-sans text-xs text-bureau-dim hover:text-bureau-gold
                             transition-colors py-1 border-l border-transparent
                             hover:border-bureau-gold/40 pl-3 -ml-3"
                >
                  {title}
                </a>
              ))}
            </nav>
          </aside>

          {/* ── Main content ────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Mobile TOC */}
            <div className="lg:hidden mb-10 glass grain rounded-lg p-5">
              <p className="font-sans text-[10px] uppercase tracking-widest text-bureau-dim mb-3">
                Contents
              </p>
              <ol className="space-y-1.5">
                {SECTIONS.map(({ id, title }) => (
                  <li key={id}>
                    <a
                      href={`#${id}`}
                      className="font-sans text-sm text-bureau-muted hover:text-bureau-gold transition-colors"
                    >
                      {title}
                    </a>
                  </li>
                ))}
              </ol>
            </div>

            {/* Sections */}
            <div className="space-y-14 mb-16">
              {SECTIONS.map(({ id, title, body, items, hasDataBox, hasQuote }) => (
                <section
                  key={id}
                  id={id}
                  className="scroll-mt-24 relative"
                >
                  {/* Decorative left accent */}
                  <div
                    aria-hidden="true"
                    className="absolute -left-6 top-0 bottom-0 w-px bg-bureau-gold/15 hidden lg:block"
                  />

                  <h2 className="font-serif text-xl md:text-2xl text-bureau-text mb-2">
                    {title}
                  </h2>
                  <div className="w-full h-px bg-white/5 mb-5" />

                  <div className="space-y-4">
                    {body.split('\n\n').map((para, i) => (
                      <p key={i} className="font-sans text-sm text-bureau-muted leading-[1.8]">
                        {para}
                      </p>
                    ))}
                  </div>

                  {/* Bullet items */}
                  {items && (
                    <ul className="mt-5 space-y-2.5 ml-1">
                      {items.map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="w-1 h-1 rounded-full bg-bureau-gold/50 mt-2.5 shrink-0" />
                          <span className="font-sans text-sm text-bureau-muted leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Privacy data collection box */}
                  {hasDataBox && (
                    <div className="mt-6 bg-bureau-card/60 border border-white/8 rounded-lg p-6">
                      <p className="font-sans text-[10px] uppercase tracking-widest text-bureau-dim mb-5">
                        What we collect
                      </p>
                      <ul className="space-y-4">
                        {COLLECTED_DATA.map(({ icon: Icon, label, desc }) => (
                          <li key={label} className="flex items-start gap-3">
                            <div className="w-7 h-7 rounded-full bg-white/5 border border-white/8 flex items-center justify-center shrink-0 mt-0.5">
                              <Icon size={13} className="text-bureau-dim" aria-hidden="true" />
                            </div>
                            <div>
                              <p className="font-sans text-xs font-semibold text-bureau-text mb-0.5">{label}</p>
                              <p className="font-sans text-xs text-bureau-muted leading-relaxed">{desc}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Quote block */}
                  {hasQuote && (
                    <blockquote className="mt-8 border-l-2 border-bureau-gold/40 pl-6 py-2">
                      <p className="font-serif italic text-base text-bureau-text/75 leading-[1.8]">
                        &ldquo;What is remembered, lives. What is forgotten, returns to the void.&rdquo;
                      </p>
                    </blockquote>
                  )}
                </section>
              ))}
            </div>

            {/* Footer note */}
            <div className="glass grain rounded-lg p-7 text-center border border-white/8">
              <p className="font-serif italic text-bureau-muted text-sm leading-relaxed mb-5">
                &ldquo;The Bureau exists to honor the things that were worked on.
                We ask only that you bring the same care to how you file them.&rdquo;
              </p>
              <div className="flex justify-center gap-6 flex-wrap">
                <Link
                  href="/about"
                  className="font-sans text-xs uppercase tracking-widest text-bureau-dim
                             hover:text-bureau-gold transition-colors"
                >
                  Read the Manifesto
                </Link>
                <span className="text-bureau-dim" aria-hidden="true">·</span>
                <Link
                  href="/submit"
                  className="font-sans text-xs uppercase tracking-widest text-bureau-dim
                             hover:text-bureau-gold transition-colors"
                >
                  File a Corpse
                </Link>
                <span className="text-bureau-dim" aria-hidden="true">·</span>
                <Link
                  href="/morgue"
                  className="font-sans text-xs uppercase tracking-widest text-bureau-dim
                             hover:text-bureau-gold transition-colors"
                >
                  Browse the Archive
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
