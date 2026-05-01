import Link from 'next/link'

const FOOTER_LINKS = [
  { href: '/morgue',  label: 'The Morgue' },
  { href: '/submit',  label: 'Submit a Corpse' },
  { href: '/about',   label: 'The Manifesto' },
  { href: '/terms',   label: 'Terms of Rebirth' },
]

export default function BureauFooter() {
  return (
    <footer className="w-full border-t border-white/5 bg-bureau-abyss pt-16 pb-8">
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 flex flex-col items-center gap-8 text-center">

        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <div className="arch-sm w-6 h-7 border border-amber-800/40 mx-auto" />
          <p className="font-serif italic text-amber-700/50 text-sm uppercase tracking-widest">
            The Bureau of Unfinished Things
          </p>
        </div>

        {/* Tagline */}
        <p className="font-serif italic text-bureau-dim text-sm max-w-sm leading-relaxed">
          &ldquo;Every unfinished thing deserves a name, a diagnosis, and a second chance.&rdquo;
        </p>

        {/* Links */}
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          {FOOTER_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="font-sans text-xs uppercase tracking-widest text-slate-600
                         hover:text-amber-500 transition-colors duration-200"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Copyright */}
        <p className="font-sans text-xs uppercase tracking-widest text-slate-700">
          &copy; {new Date().getFullYear()} The Bureau of Unfinished Things.
          All rights preserved in glass.
        </p>
      </div>
    </footer>
  )
}
