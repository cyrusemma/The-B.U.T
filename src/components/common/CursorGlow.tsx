'use client'

import { useEffect, useRef } from 'react'

export function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = glowRef.current
    if (!el) return

    const onMove = (e: MouseEvent) => {
      el.style.left = `${e.clientX}px`
      el.style.top  = `${e.clientY}px`
    }
    const onLeave  = () => { el.style.opacity = '0' }
    const onEnter  = () => { el.style.opacity = '1' }

    window.addEventListener('mousemove', onMove, { passive: true })
    document.documentElement.addEventListener('mouseleave', onLeave)
    document.documentElement.addEventListener('mouseenter', onEnter)

    return () => {
      window.removeEventListener('mousemove', onMove)
      document.documentElement.removeEventListener('mouseleave', onLeave)
      document.documentElement.removeEventListener('mouseenter', onEnter)
    }
  }, [])

  return <div ref={glowRef} className="cursor-glow" aria-hidden="true" />
}
