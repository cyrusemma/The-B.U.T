import Link from 'next/link'
import { ArrowRight, BookOpen, HeartHandshake, Sparkles } from 'lucide-react'
import PageWrapper from '@/components/bureau/PageWrapper'

const PHILOSOPHY = [
  {
    roman: 'I',
    title: 'The Covenant of Artifacts',
    body: `In the vast expanse of the digital realm, countless endeavors are birthed with fervor, only to be quietly abandoned. The Bureau does not view these uncompleted works as failures. We see them as dormant artifacts, suspended in a state of indefinite pause — fragments of ambition, carrying the unique imprint of their creators, waiting for a profound stillness to honor their existence.

Our curation is a sacred act. We provide a final resting place for codebases that lost their momentum, for designs that never saw the light of deployment, and for narratives that ended mid-sentence. By cataloging these entities, we strip away the shame of incompletion and replace it with historical reverence.`,
  },
  {
    roman: 'II',
    title: 'On Catharsis',
    body: `There is something profoundly human about needing to put a thing to rest before you can move on. A funeral gives grief a container. Filing a corpse does the same.

When you submit a project to the Bureau, you are not admitting defeat — you are completing a ritual. You are saying: this existed. I worked on it. It mattered to me. Now it can matter to someone else.

Here, in the quiet halls of our archives, every abandoned project is treated with the dignity of a fallen monument.`,
  },
  {
    roman: 'III',
    title: 'The Alchemy of Second Chances',
    body: `The most interesting thing that happens in the Bureau is not the filing. It is the adoption.

Someone finds your dead project and sees not what it was, but what it could become. They carry it forward with fresh eyes and none of your original attachment. Often, the resurrection is better than what you had planned.

The Bureau is not merely a graveyard — it is an adoption registry. Through our Sacred Archives, other wanderers of the digital expanse may find inspiration in these resting artifacts. In this perpetual cycle of relinquishment and resurrection, we ensure that no creative spark is ever truly extinguished.`,
  },
]

const PRINCIPLES = [
  {
    icon: BookOpen,
    title: 'Not a graveyard of shame',
    body: 'Every project here is filed with care. We don\'t mock. We preserve with reverence.',
  },
  {
    icon: Sparkles,
    title: 'Not a code dump',
    body: 'Filing requires intention. A ghost letter. A cause of death. A moment of reflection.',
  },
  {
    icon: HeartHandshake,
    title: 'Not just for developers',
    body: 'We accept code, design, writing, research, business plans — anything worked on and left unfinished.',
  },
  {
    icon: ArrowRight,
    title: 'Not a replacement for finishing',
    body: 'Sometimes the right answer is to finish. This is for the times when it isn\'t.',
  },
]

export default function AboutPage() {
  return (
    <PageWrapper>
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 py-16">

        {/* ── Manifesto Hero ──────────────────────────────────────────────── */}
        <section className="max-w-3xl mx-auto text-center mb-24 relative">
          {/* Ambient glow */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-b from-bureau-gold/5 to-transparent pointer-events-none rounded-full blur-3xl -z-10"
          />

          <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-bureau-gold mb-6 block">
            The Manifesto
          </span>

          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl text-bureau-text leading-tight mb-6 candle-glow tracking-tight">
            Why the Bureau Exists
          </h1>

          <div className="w-24 h-px bg-bureau-gold/30 mx-auto mb-8" />

          <p className="font-sans text-lg text-bureau-muted leading-relaxed max-w-2xl mx-auto">
            We built a place for the projects that deserved better. For the ideas that ran out of
            time, money, energy, or simply ran into life. For the things that mattered enough to start.
          </p>
        </section>

        {/* ── Philosophy — Museum Plaque Style ───────────────────────────── */}
        <section className="max-w-3xl mx-auto mb-28">
          <div className="bg-bureau-card/50 border border-white/8 rounded-lg p-10 md:p-16 shadow-[0_10px_40px_rgba(0,0,0,0.4)] backdrop-blur-sm relative">
            {/* Museum plaque corner marks */}
            <div aria-hidden="true" className="absolute top-4 left-4 w-3 h-3 border-t border-l border-bureau-gold/35" />
            <div aria-hidden="true" className="absolute top-4 right-4 w-3 h-3 border-t border-r border-bureau-gold/35" />
            <div aria-hidden="true" className="absolute bottom-4 left-4 w-3 h-3 border-b border-l border-bureau-gold/35" />
            <div aria-hidden="true" className="absolute bottom-4 right-4 w-3 h-3 border-b border-r border-bureau-gold/35" />

            <div className="space-y-12">
              {PHILOSOPHY.map(({ roman, title, body }) => (
                <div key={roman} className="relative">
                  {/* Decorative vertical accent */}
                  <div
                    aria-hidden="true"
                    className="absolute -left-10 md:-left-16 top-0 bottom-0 w-px bg-bureau-gold/15 hidden md:block"
                  />

                  <div className="flex items-baseline gap-4 mb-4">
                    <span className="font-serif text-bureau-gold/30 text-3xl select-none">{roman}.</span>
                    <h2 className="font-serif text-xl md:text-2xl text-bureau-text">{title}</h2>
                  </div>

                  <div className="space-y-4">
                    {body.split('\n\n').map((para, i) => (
                      <p key={i} className="font-serif italic text-bureau-muted leading-[1.85] text-base">
                        {para}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Principles — "What We Are Not" ─────────────────────────────── */}
        <section className="max-w-3xl mx-auto mb-28">
          <div className="text-center mb-12">
            <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-bureau-gold mb-4 block">
              A Clarification
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-bureau-text">
              What We Are Not
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {PRINCIPLES.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="group glass grain rounded-lg p-6 border border-white/8
                           hover:border-bureau-gold/25 transition-all duration-300
                           hover:shadow-[0_0_20px_rgba(217,119,6,0.06)]"
              >
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-full bg-bureau-gold/8 border border-bureau-gold/20
                                  flex items-center justify-center shrink-0 mt-0.5
                                  group-hover:bg-bureau-gold/15 transition-colors">
                    <Icon size={16} className="text-bureau-gold" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-serif text-base text-bureau-text mb-1.5">{title}</h3>
                    <p className="font-sans text-xs text-bureau-muted leading-relaxed">{body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Curator Pillars — Tombstone arch cards ──────────────────────── */}
        <section className="max-w-4xl mx-auto mb-28">
          <div className="text-center mb-14">
            <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-bureau-gold mb-4 block">
              Sacred Roles
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-bureau-text">
              The Order of the Bureau
            </h2>
            <p className="font-sans text-sm text-bureau-dim mt-3 max-w-xl mx-auto">
              Every artifact that passes through these halls is handled by one of three sacred roles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                role: 'The Relinquisher',
                label: 'Creator',
                desc: 'They who built the thing, loved it, and let it go. The original architect of the intention.',
                offset: '',
              },
              {
                role: 'The Curator',
                label: 'Archivist',
                desc: 'The Bureau itself — steward of dormant works, keeper of the flame between lives.',
                offset: 'md:translate-y-8',
              },
              {
                role: 'The Resurrector',
                label: 'Adopter',
                desc: 'They who saw potential where others saw only dust. Bringer of the second breath.',
                offset: 'md:translate-y-16',
              },
            ].map(({ role, label, desc, offset }) => (
              <div
                key={role}
                className={`group bg-bureau-card border border-white/8 rounded-t-[80px] rounded-b-lg
                             p-8 flex flex-col items-center text-center relative
                             transition-all duration-500 hover:-translate-y-2
                             hover:border-bureau-gold/30 hover:shadow-[0_15px_40px_rgba(217,119,6,0.08)]
                             ${offset}`}
              >
                {/* Arch icon */}
                <div className="arch-sm w-16 h-20 border border-white/12 mb-6 flex items-end justify-center pb-3
                                group-hover:border-bureau-gold/30 transition-colors duration-500">
                  <div className="w-0.5 h-6 bg-bureau-gold/40 rounded-full group-hover:bg-bureau-gold/70 transition-colors duration-500" />
                </div>

                <span className="font-sans text-[0.6rem] uppercase tracking-[0.2em] text-bureau-gold mb-2">
                  {label}
                </span>
                <h3 className="font-serif text-xl text-bureau-text mb-4 group-hover:text-amber-100 transition-colors duration-300">
                  {role}
                </h3>
                <p className="font-sans text-xs text-bureau-muted leading-relaxed">
                  {desc}
                </p>

                {/* Bottom accent */}
                <div
                  aria-hidden="true"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-px
                             bg-gradient-to-r from-transparent via-bureau-gold/30 to-transparent
                             opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                />
              </div>
            ))}
          </div>
        </section>

        {/* ── Manifesto quote ─────────────────────────────────────────────── */}
        <div className="max-w-2xl mx-auto mb-28">
          <blockquote className="border-l-2 border-bureau-gold/40 pl-8 py-3">
            <p className="font-serif italic text-xl text-bureau-text/80 leading-[1.8]">
              &ldquo;What is remembered, lives. What is forgotten, returns to the void. The Bureau remembers.&rdquo;
            </p>
          </blockquote>
        </div>

        {/* ── CTA ─────────────────────────────────────────────────────────── */}
        <section className="max-w-2xl mx-auto text-center py-16 relative">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(217,119,6,0.08)_0%,transparent_70%)] pointer-events-none"
          />
          <h2 className="font-serif text-3xl md:text-4xl text-bureau-text mb-4">
            Ready to unburden yourself?
          </h2>
          <p className="font-sans text-sm text-bureau-muted mb-10 leading-relaxed max-w-md mx-auto">
            Allow your unfinished endeavors to find peace within our archives.
            We await your submission with solemn respect.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/submit" className="btn-bureau px-8 py-3 text-xs">
              Submit a Corpse
            </Link>
            <Link href="/morgue" className="btn-bureau-ghost px-8 py-3 text-xs">
              Browse the Morgue
            </Link>
          </div>
        </section>

      </div>
    </PageWrapper>
  )
}
