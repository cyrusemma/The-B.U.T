'use client'

import { Sun, Moon } from 'lucide-react'
import { useTheme } from './ThemeProvider'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      className="
        relative p-2 rounded-full
        text-bureau-muted hover:text-bureau-gold
        hover:bg-bureau-gold/10
        border border-transparent hover:border-bureau-gold/20
        transition-all duration-300 ease-out
        group
      "
    >
      {/* Sun icon — visible in dark mode */}
      <Sun
        size={16}
        className={`
          absolute inset-0 m-auto transition-all duration-300
          ${theme === 'dark'
            ? 'opacity-100 rotate-0 scale-100'
            : 'opacity-0 -rotate-90 scale-50'
          }
        `}
      />
      {/* Moon icon — visible in light mode */}
      <Moon
        size={16}
        className={`
          transition-all duration-300
          ${theme === 'light'
            ? 'opacity-100 rotate-0 scale-100'
            : 'opacity-0 rotate-90 scale-50'
          }
        `}
      />
    </button>
  )
}
