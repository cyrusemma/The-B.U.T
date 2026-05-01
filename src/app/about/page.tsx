import Link from 'next/link'
import PageWrapper from '@/components/bureau/PageWrapper'

const PHILOSOPHY = [
  {
    title: 'On Failure',
    body: `Every abandoned project is a failure that deserves a name. Not the kind of failure that defines you — the kind that says you tried. You had an idea that mattered enough to start. The fact that you didn't finish doesn't diminish the fact that you began.

The Bureau exists because the graveyard of started things is far more interesting than the museum of finished ones.`,
  },
  {
    title: 'On Catharsis',
    body: `There is something profoundly human about needing to put a thing to rest before you can move on. A funeral gives grief a container. Filing a corpse does the same.

When you submit a project to the Bureau, you are not admitting defeat — you are completing a ritual. You are saying: this existed. I worked on it. It mattered to me. Now it can matter to someone else.`,
  },
  {
    title: 'On Second Chances',
    body: `The most interesting thing that happens in the Bureau is not the filing. It is the adoption.

Someone finds your dead project and sees not what it was, but what it could become. They carry it forward with fresh eyes and none of your original attachment. Often, the resurrection is better than what you had planned.

That is not irony. That is how creativity actually works.`,
  },
]

export default function AboutPage() {
  return (
    <PageWrapper>
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 py-16">

        {/* Hero */}
        <div className="max-w-3xl mx-auto text-center mb-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full
                          border border-bureau-gold/20 bg-bureau-gold/5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-bureau-gold" />
            <span className="font-sans text-[11px] uppercase tracking-widest text-bureau-gold">
              The Manifesto
            </span>
          </div>

          <h1 className="font-serif text-5xl md:text-6xl text-bureau-text leading-tight mb-6 candle-glow">
            Why the Bureau Exists
          </h1>

          <p className="font-sans text-lg text-bureau-muted leading-relaxed max-w-2xl mx-auto">
            We built a place for the projects that deserved better. For the ideas that ran out of
            time, money, energy, or simply ran into life. For the things that mattered enough to start.
          </p>
        </div>

        {/* Philosophy sections */}
        <div className="max-w-2xl mx-auto space-y-16 mb-24">
          {PHILOSOPHY.map(({ title, body }, i) => (
            <div key={title} className="relative">
              {/* Section number */}
              <span className="font-serif text-7xl text-bureau-gold/8 absolute -left-4 -top-4 select-none">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="relative">
                <h2 className="font-serif text-2xl text-bureau-text mb-5">{title}</h2>
                {body.split('\n\n').map((para, j) => (
                  <p key={j} className="font-sans text-bureau-muted leading-relaxed mb-4 last:mb-0">
                    {para}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="section-divider max-w-2xl mx-auto mb-24" />

        {/* What we are not */}
        <div className="max-w-2xl mx-auto mb-24">
          <h2 className="font-serif text-2xl text-bureau-text mb-8 text-center">
            What We Are Not
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              ['Not a graveyard of shame', 'Every project here is filed with care. We don\'t mock. We preserve.'],
              ['Not a code dump', 'Filing requires intention. A ghost letter. A cause of death. A moment of reflection.'],
              ['Not just for developers', 'We accept code, design, writing, research, business plans — anything that was worked on and left unfinished.'],
              ['Not a replacement for finishing', 'Sometimes the right answer is to finish. This is for the times when it isn\'t.'],
            ].map(([title, body]) => (
              <div key={title as string} className="glass grain rounded-lg p-5">
                <h3 className="font-serif text-base text-bureau-text mb-2">{title}</h3>
                <p className="font-sans text-xs text-bureau-muted leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center py-12 max-w-lg mx-auto">
          <h2 className="font-serif text-3xl text-bureau-text mb-4">
            Ready to file a corpse?
          </h2>
          <p className="font-sans text-sm text-bureau-muted mb-8 leading-relaxed">
            The Bureau is open. Your project is waiting for its headstone.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/submit" className="btn-bureau">Submit a Corpse</Link>
            <Link href="/morgue" className="btn-bureau-ghost">Browse the Morgue</Link>
          </div>
        </div>

      </div>
    </PageWrapper>
  )
}
