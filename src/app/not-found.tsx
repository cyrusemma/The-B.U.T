import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-bureau-void">
      <div className="text-center">
        <div className="flex justify-center mb-8">
          <div className="arch-md w-20 h-24 border-2 border-bureau-gold/30 flex items-center justify-center">
            <span className="font-serif text-bureau-gold/70 text-lg italic">404</span>
          </div>
        </div>
        <h1 className="font-serif text-4xl text-bureau-text mb-3">This corpse has vanished.</h1>
        <p className="text-bureau-muted text-sm mb-8 max-w-sm mx-auto">
          The page you are looking for does not exist, or perhaps it too was abandoned.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/" className="btn-bureau">
            Return to the Bureau
          </Link>
          <Link href="/morgue" className="btn-bureau-outline">
            Browse the Morgue
          </Link>
        </div>
      </div>
    </div>
  )
}
