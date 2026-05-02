import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      // ─── Shadcn/Radix CSS-var tokens (kept intact) ───────────────────────
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },

        // ─── Bureau design tokens ─────────────────────────────────────────
        bureau: {
          // Dark mode surfaces
          void:     '#080C14',
          surface:  '#0F1623',
          card:     '#141C2A',
          elevated: '#1C2535',
          // Text
          text:     '#F1F5F9',
          muted:    '#94A3B8',
          dim:      '#475569',
          // Accent
          gold:     '#D97706',
          amber:    '#B45309',
          'gold-dim': 'rgba(217,119,6,0.15)',
          // State
          green:    '#10B981',
          'green-dim': 'rgba(16,185,129,0.15)',
          blue:     '#bcc7de',
          // Ultra-dark
          abyss:    '#04060A',
          // Glass surface tokens (dark-mode values; light mode overridden via CSS)
          'glass-bg':     'rgba(255,255,255,0.03)',
          'glass-border': 'rgba(255,255,255,0.10)',
        },
      },

      // ─── Fonts ────────────────────────────────────────────────────────────
      fontFamily: {
        serif:   ['var(--font-newsreader)', 'Georgia', 'serif'],
        sans:    ['var(--font-manrope)', 'system-ui', 'sans-serif'],
        // Legacy aliases kept for backwards compat
        display: ['var(--font-newsreader)', 'Georgia', 'serif'],
        label:   ['var(--font-manrope)', 'system-ui', 'sans-serif'],
      },

      // ─── Border radius ────────────────────────────────────────────────────
      borderRadius: {
        lg:    'var(--radius)',
        md:    'calc(var(--radius) - 2px)',
        sm:    'calc(var(--radius) - 4px)',
        // Tombstone arch — organic top rounding
        arch:  '6rem 6rem 0 0',
      },

      // ─── Keyframes ────────────────────────────────────────────────────────
      keyframes: {
        // Radix accordion
        'accordion-down': {
          from: { height: '0' },
          to:   { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to:   { height: '0' },
        },

        // 1. Heartbeat — lub-dub gold pulse on cards
        heartbeat: {
          '0%, 100%': { boxShadow: '0 0 0px rgba(217,119,6,0)' },
          '14%':      { boxShadow: '0 0 10px rgba(217,119,6,0.45)' },
          '28%':      { boxShadow: '0 0 4px rgba(217,119,6,0.18)' },
          '42%':      { boxShadow: '0 0 10px rgba(217,119,6,0.45)' },
          '70%':      { boxShadow: '0 0 0px rgba(217,119,6,0)' },
        },

        // 2. Resurrection — rise from below with golden glow (used in hero)
        resurrection: {
          '0%':   { opacity: '0', transform: 'translateY(40px)', filter: 'brightness(0.4)' },
          '60%':  { opacity: '1', transform: 'translateY(-6px)', filter: 'brightness(1.3)' },
          '100%': { opacity: '1', transform: 'translateY(0)',    filter: 'brightness(1)' },
        },

        // 3. Candle flicker — for flame SVG
        'candle-flicker': {
          '0%, 100%': { opacity: '1',    transform: 'scaleX(1)   scaleY(1)' },
          '25%':      { opacity: '0.85', transform: 'scaleX(0.95) scaleY(1.04)' },
          '50%':      { opacity: '0.92', transform: 'scaleX(1.04) scaleY(0.97)' },
          '75%':      { opacity: '0.88', transform: 'scaleX(0.97) scaleY(1.02)' },
        },

        // 4. Typewriter cursor blink
        'cursor-blink': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0' },
        },

        // 5. Tombstone rise — card lifts from ground
        'tombstone-rise': {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },

        // 6. Page fade in from slightly below
        'page-enter': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },

        // 7. Fade in (generic)
        'fade-in': {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },

        // 8. Marquee ticker scroll
        'marquee-scroll': {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },

        // 9. Float bob — subtle hover for hero element
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },

        // 10. Tombstone crack — for hero animation
        'crack-left': {
          '0%':   { transform: 'rotate(0deg) translateX(0)' },
          '100%': { transform: 'rotate(-4deg) translateX(-6px)' },
        },
        'crack-right': {
          '0%':   { transform: 'rotate(0deg) translateX(0)' },
          '100%': { transform: 'rotate(4deg) translateX(6px)' },
        },

        // 11. Glow pulse — for resurrection beam
        'glow-pulse': {
          '0%, 100%': { opacity: '0.15' },
          '50%':      { opacity: '0.35' },
        },

        // 12. Shimmer — for skeleton loaders
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },

        // 13. Scale shake — tombstone vibrate before crack
        shake: {
          '0%, 100%': { transform: 'translateX(0) rotate(0deg)' },
          '20%':      { transform: 'translateX(-3px) rotate(-0.5deg)' },
          '40%':      { transform: 'translateX(3px) rotate(0.5deg)' },
          '60%':      { transform: 'translateX(-2px) rotate(-0.3deg)' },
          '80%':      { transform: 'translateX(2px) rotate(0.3deg)' },
        },
      },

      // ─── Animation utilities ──────────────────────────────────────────────
      animation: {
        'accordion-down':  'accordion-down 0.2s ease-out',
        'accordion-up':    'accordion-up 0.2s ease-out',
        'heartbeat':       'heartbeat 2.4s ease-in-out infinite',
        'resurrection':    'resurrection 0.8s cubic-bezier(0.22,1,0.36,1) forwards',
        'candle-flicker':  'candle-flicker 3s ease-in-out infinite',
        'cursor-blink':    'cursor-blink 1s step-end infinite',
        'tombstone-rise':  'tombstone-rise 0.5s cubic-bezier(0.22,1,0.36,1) forwards',
        'page-enter':      'page-enter 0.35s ease-out forwards',
        'fade-in':         'fade-in 0.5s ease-out forwards',
        'marquee-scroll':  'marquee-scroll 28s linear infinite',
        'float':           'float 4s ease-in-out infinite',
        'crack-left':      'crack-left 0.4s ease-out forwards',
        'crack-right':     'crack-right 0.4s ease-out forwards',
        'glow-pulse':      'glow-pulse 3s ease-in-out infinite',
        'shimmer':         'shimmer 1.8s linear infinite',
        'shake':           'shake 0.5s ease-in-out',
      },

      // ─── Box shadows ──────────────────────────────────────────────────────
      boxShadow: {
        'gold-sm':  '0 0 12px rgba(217,119,6,0.20)',
        'gold-md':  '0 0 24px rgba(217,119,6,0.25)',
        'gold-lg':  '0 0 40px rgba(217,119,6,0.30)',
        'gold-glow':'0 0 60px rgba(217,119,6,0.40)',
        'green-glow':'0 0 20px rgba(16,185,129,0.30)',
        'card':     '0 4px 24px rgba(0,0,0,0.40)',
        'card-hover':'0 8px 40px rgba(0,0,0,0.60)',
        'glass':    'inset 0 1px 0 rgba(255,255,255,0.10)',
      },

      // ─── Background images ────────────────────────────────────────────────
      backgroundImage: {
        'resurrection-beam':
          'radial-gradient(ellipse 60% 80% at 50% 100%, rgba(217,119,6,0.25) 0%, rgba(217,119,6,0.08) 40%, transparent 70%)',
        'gold-gradient':
          'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
        'dark-vignette':
          'radial-gradient(ellipse at center, transparent 40%, rgba(8,12,20,0.70) 100%)',
      },

      // ─── Backdrop blur ────────────────────────────────────────────────────
      backdropBlur: {
        xs:  '4px',
        sm:  '8px',
        md:  '16px',
        lg:  '24px',
        xl:  '40px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
