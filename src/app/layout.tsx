import type { Metadata } from 'next'
import { Newsreader, Manrope } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import './globals.css'
import { CursorGlow } from '@/components/common/CursorGlow'

const newsreader = Newsreader({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-newsreader',
  display: 'swap',
  adjustFontFallback: false,
})

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-manrope',
  display: 'swap',
})

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
    <html
      lang="en"
      className={`${newsreader.variable} ${manrope.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased bureau-scroll">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange={false}
        >
          <CursorGlow />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
