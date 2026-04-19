import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'The Bureau of Unfinished Things',
  description:
    'A marketplace and postmortem platform for dead projects. Submit your abandoned work, get a diagnosis, and let someone else bring it back to life.',
  keywords: ['projects', 'abandoned', 'marketplace', 'resurrection', 'dead projects'],
  openGraph: {
    title: 'The Bureau of Unfinished Things',
    description: 'Where abandoned projects go to find new life.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  )
}
