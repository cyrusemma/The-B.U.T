'use client'

import { motion, AnimatePresence } from 'framer-motion'

export type CandleState =
  | 'waiting'      // faint flicker — awaiting adoption
  | 'proposed'     // brighter flicker — someone proposed adoption
  | 'adopted'      // bright steady flame
  | 'resurrected'  // flame floats up and dissolves
  | 'failed'       // flame blows out

interface CandleIndicatorProps {
  state: CandleState
  size?: number
}

function FlameSVG({ state }: { state: CandleState }) {
  const intensity = {
    waiting:     { opacity: 0.55, scale: 0.85 },
    proposed:    { opacity: 0.90, scale: 1.10 },
    adopted:     { opacity: 1.00, scale: 1.00 },
    resurrected: { opacity: 0.00, scale: 1.40 },
    failed:      { opacity: 0.00, scale: 0.60 },
  }[state]

  return (
    <motion.svg
      viewBox="0 0 40 60"
      className="w-full h-full"
      animate={intensity}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <defs>
        <radialGradient id={`flame-${state}`} cx="50%" cy="80%">
          <stop offset="0%"   stopColor="#FCD34D" />
          <stop offset="40%"  stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#DC2626" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Shadow */}
      <ellipse cx="20" cy="48" rx="6" ry="4" fill="#1C1917" opacity="0.3" />
      {/* Wick */}
      <rect x="19" y="44" width="2" height="4" fill="#64748b" rx="1" />
      {/* Flame body */}
      <motion.path
        d="M20 8 C14 20 10 30 12 42 C14 50 26 50 28 42 C30 30 26 20 20 8Z"
        fill={`url(#flame-${state})`}
        animate={
          state === 'waiting'
            ? { scaleX: [1, 0.93, 1.05, 0.97, 1], scaleY: [1, 1.04, 0.96, 1.02, 1] }
            : state === 'proposed'
            ? { scaleX: [1, 0.88, 1.10, 0.92, 1], scaleY: [1, 1.06, 0.93, 1.04, 1] }
            : {}
        }
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '20px 48px' }}
      />
    </motion.svg>
  )
}

function SmokeParticle({ i }: { i: number }) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: 4 + i * 2,
        height: 4 + i * 2,
        background: 'rgba(148,163,184,0.3)',
        bottom: '50%',
        left: '50%',
        x: '-50%',
      }}
      initial={{ opacity: 0.6, y: 0, x: '-50%' }}
      animate={{ opacity: 0, y: -(20 + i * 10), x: `calc(-50% + ${(i % 2 === 0 ? 1 : -1) * (i * 3)}px)` }}
      transition={{ duration: 1.2, delay: i * 0.15, ease: 'easeOut' }}
    />
  )
}

export default function CandleIndicator({ state, size = 40 }: CandleIndicatorProps) {
  return (
    <div
      className="relative flex items-end justify-center"
      style={{ width: size, height: size * 1.5 }}
    >
      <AnimatePresence>
        {state !== 'failed' && state !== 'resurrected' && (
          <motion.div
            key="flame"
            className="absolute bottom-0 w-full h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
          >
            <FlameSVG state={state} />
          </motion.div>
        )}

        {/* Resurrection: flame floats up */}
        {state === 'resurrected' && (
          <motion.div
            key="resurrect"
            className="absolute bottom-0 w-full h-full"
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -size }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          >
            <FlameSVG state="adopted" />
          </motion.div>
        )}

        {/* Failed: smoke */}
        {state === 'failed' && (
          <div key="smoke" className="absolute bottom-1/2 w-full">
            {[0, 1, 2].map((i) => <SmokeParticle key={i} i={i} />)}
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
