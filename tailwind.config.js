/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // ─── JAECOO Design System ───────────────────────────────────────────
      colors: {
        // Legacy tokens (backward compat — se irán sustituyendo)
        electric: {
          50:  '#eff6ff',
          100: '#dbeafe',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        fuel: {
          50:  '#fff7ed',
          100: '#ffedd5',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
        },

        // ── JAECOO Palette — inspirada en la pantalla 14.8" del coche ──
        jaecoo: {
          // Fondos — usan CSS vars para soportar dark/light mode
          base:            'var(--j-base)',
          surface:         'var(--j-surface)',
          card:            'var(--j-card)',
          elevated:        'var(--j-elevated)',

          // Bordes — CSS vars (no usan modificador de opacidad)
          border:          'var(--j-border)',
          'border-strong': 'var(--j-border-strong)',

          // Tipografía — CSS vars
          primary:         'var(--j-text-primary)',
          secondary:       'var(--j-text-secondary)',
          muted:           'var(--j-text-muted)',

          // Dim backgrounds — CSS vars (rgba precalculados, sin modificador)
          'electric-dim':  'var(--j-electric-dim)',
          'fuel-dim':      'var(--j-fuel-dim)',

          // Acentos — hex fijos (se usan con modificadores de opacidad /20, /10…)
          electric:        '#22d3ee',
          fuel:            '#fb923c',
          accent:          '#3b82f6',
          success:         '#10b981',
          danger:          '#f87171',
        },
      },

      // ── Sombras con efecto glow ──────────────────────────────────────────
      boxShadow: {
        'j-card':     'var(--j-shadow-card)',
        'j-elevated': 'var(--j-shadow-elevated)',
        'j-electric': '0 0 24px rgba(34,211,238,0.25), 0 2px 8px rgba(0,0,0,0.4)',
        'j-fuel':     '0 0 24px rgba(251,146,60,0.25),  0 2px 8px rgba(0,0,0,0.4)',
        'j-accent':   '0 0 24px rgba(59,130,246,0.3),   0 2px 8px rgba(0,0,0,0.4)',
      },

      // ── Gradientes de fondo ──────────────────────────────────────────────
      backgroundImage: {
        'j-electric-card': 'linear-gradient(135deg, rgba(34,211,238,0.15) 0%, rgba(14,21,32,0) 60%)',
        'j-fuel-card':     'linear-gradient(135deg, rgba(251,146,60,0.15)  0%, rgba(14,21,32,0) 60%)',
        'j-emerald-card':  'linear-gradient(135deg, rgba(16,185,129,0.15)  0%, rgba(14,21,32,0) 60%)',
        'j-surface-fade':  'linear-gradient(180deg, #0e1520 0%, #080c14 100%)',
      },

      // ── Tipografía ───────────────────────────────────────────────────────
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
      },

      // ── Animaciones ──────────────────────────────────────────────────────
      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(34,211,238,0.3)' },
          '50%':       { boxShadow: '0 0 20px rgba(34,211,238,0.6)' },
        },
      },
      animation: {
        'fade-in':    'fade-in 0.2s ease-out',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
