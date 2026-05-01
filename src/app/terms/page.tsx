import Link from 'next/link'
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
    title: 'II. Adoption and Resurrection',
    body: `Adopters may request to resurrect your project under three terms:

Open Casket — Free use. The adopter may use, modify, distribute, and build upon the project without restriction. You receive credit but no compensation. Choose this if you want your work to live freely.

Organ Donor — Selective use. The adopter may extract parts of the project for use in other work. Full resurrection of the original is not implied. Attribution is expected.

Resurrection Rights — Paid transfer. A fee is agreed upon and processed through the Bureau. The creator receives 90% of the agreed amount. The Bureau retains 10% as a preservation fee. This constitutes an exclusive license to resurrect the project; a formal IP transfer agreement is required to complete the transaction.`,
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
    body: `We collect only the information necessary to operate the Bureau: your email address (for authentication), the project details you choose to submit, and usage data to improve the service.

We do not sell your data. We do not use your ghost letters for training AI models. What you write to your future adopter stays between you and them.

Your public profile and public projects are visible to anyone. Private projects are visible only to you.`,
  },
]

export default function TermsPage() {
  return (
    <PageWrapper>
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 py-16">

        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <p className="font-sans text-[11px] uppercase tracking-widest text-bureau-gold mb-4">
            Legal
          </p>
          <h1 className="font-serif text-4xl md:text-5xl text-bureau-text mb-4">
            Terms of Rebirth
          </h1>
          <p className="font-sans text-sm text-bureau-muted leading-relaxed">
            By submitting remains to the Bureau, you agree to these terms.
            Read them carefully — they are written to be understood, not obscured.
          </p>
          <p className="font-sans text-xs text-bureau-dim mt-3">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Table of contents */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="glass grain rounded-lg p-5">
            <p className="font-sans text-[10px] uppercase tracking-widest text-bureau-dim mb-3">
              Contents
            </p>
            <ol className="space-y-1">
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
        </div>

        {/* Sections */}
        <div className="max-w-2xl mx-auto space-y-12 mb-16">
          {SECTIONS.map(({ id, title, body }) => (
            <section key={id} id={id} className="scroll-mt-24">
              <h2 className="font-serif text-xl text-bureau-text mb-4">{title}</h2>
              <div className="section-divider mb-5" />
              {body.split('\n\n').map((para, i) => (
                <p key={i} className="font-sans text-sm text-bureau-muted leading-relaxed mb-4 last:mb-0">
                  {para}
                </p>
              ))}
            </section>
          ))}
        </div>

        {/* Footer note */}
        <div className="max-w-2xl mx-auto text-center">
          <div className="glass grain rounded-lg p-6">
            <p className="font-serif italic text-bureau-muted text-sm leading-relaxed">
              &ldquo;The Bureau exists to honor the things that were worked on.
              We ask only that you bring the same care to how you file them.&rdquo;
            </p>
            <div className="mt-4 flex justify-center gap-4">
              <Link
                href="/about"
                className="font-sans text-xs uppercase tracking-widest text-bureau-dim
                           hover:text-bureau-gold transition-colors"
              >
                Read the Manifesto
              </Link>
              <span className="text-bureau-dim">·</span>
              <Link
                href="/submit"
                className="font-sans text-xs uppercase tracking-widest text-bureau-dim
                           hover:text-bureau-gold transition-colors"
              >
                File a Corpse
              </Link>
            </div>
          </div>
        </div>

      </div>
    </PageWrapper>
  )
}
