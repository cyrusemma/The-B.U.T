'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'
import BureauNavbar from './BureauNavbar'
import BureauFooter from './BureauFooter'
import CloudLayer from './CloudLayer'

interface NavUser {
  username?: string | null
  display_name?: string | null
  avatar_url?: string | null
}

interface PageWrapperProps {
  children: React.ReactNode
  user?: NavUser | null
  /** Hide footer — useful for full-screen pages like chat */
  noFooter?: boolean
  /** Hide navbar — useful for auth pages */
  noNav?: boolean
  /** Extra className on the main content area */
  className?: string
}

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  enter:   { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -4 },
}

export default function PageWrapper({
  children,
  user,
  noFooter = false,
  noNav = false,
  className = '',
}: PageWrapperProps) {
  return (
    <div className="min-h-screen flex flex-col bg-bureau-void">
      {!noNav && <BureauNavbar user={user} />}

      {/* Atmospheric cloud layer — full page, below all content */}
      <CloudLayer />

      {/* Grain overlay — covers the whole page */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[1] opacity-[0.035] page-grain"
      />

      <motion.main
        variants={pageVariants}
        initial="initial"
        animate="enter"
        exit="exit"
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className={cn(`relative z-[2] flex-1`, !noNav && 'pt-[72px]', className)}
      >
        {children}
      </motion.main>

      {!noFooter && <BureauFooter />}
    </div>
  )
}
