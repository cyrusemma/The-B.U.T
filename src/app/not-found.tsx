import Link from 'next/link'

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#0f172a' }}
    >
      <div className="text-center">
        <div className="flex justify-center mb-8">
          <div
            className="w-20 h-24 border-2 border-slate-700 flex items-center justify-center"
            style={{ borderRadius: '50% 50% 0 0 / 40% 40% 0 0' }}
          >
            <span className="font-serif text-slate-600 text-lg italic">404</span>
          </div>
        </div>
        <h1 className="font-serif text-4xl text-slate-300 mb-3">This corpse has vanished.</h1>
        <p className="text-slate-500 text-sm mb-8 max-w-sm mx-auto">
          The page you&apos;re looking for doesn&apos;t exist—or perhaps it, too, was abandoned.
        </p>
        <div className="flex justify-center gap-4">
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
