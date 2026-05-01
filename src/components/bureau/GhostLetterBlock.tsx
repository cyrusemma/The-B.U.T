'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

interface GhostLetterBlockProps {
  text: string
  /** ms per character — default 22 */
  speed?: number
  /** Author attribution */
  author?: string | null
}

export default function GhostLetterBlock({
  text,
  speed = 22,
  author,
}: GhostLetterBlockProps) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  const [started, setStarted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const indexRef = useRef(0)

  useEffect(() => {
    if (!inView || started) return
    setStarted(true)
    indexRef.current = 0
    setDisplayed('')
    setDone(false)

    const interval = setInterval(() => {
      const next = indexRef.current + 1
      if (next > text.length) {
        clearInterval(interval)
        setDone(true)
        return
      }
      indexRef.current = next
      setDisplayed(text.slice(0, next))
    }, speed)

    return () => clearInterval(interval)
  }, [inView, text, speed, started])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="ghost-letter-block"
    >
      {/* Candlelight corner glow */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 w-32 h-32 pointer-events-none ghost-letter-glow"
      />

      {/* Label */}
      <p className="ghost-letter-label">
        <span className="inline-block w-3 h-3 rounded-full border border-amber-600/40" />
        Ghost Letter
      </p>

      {/* Typewriter text */}
      <p className="ghost-letter-text">
        {displayed}
        {!done && (
          <span className="ghost-letter-cursor" />
        )}
      </p>

      {/* Attribution */}
      {author && done && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="font-sans text-xs mt-5 pt-4 text-bureau-dim border-t border-amber-600/15"
        >
          — {author}
        </motion.p>
      )}
    </motion.div>
  )
}
