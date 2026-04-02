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
          // Fondos (de más oscuro a más elevado)
          base:           '#080c14',   // fondo global
          surface:        '#0e1520',   // sidebar / header
          card:           '#141c2e',   // tarjetas
          elevated:       '#1b2438',   // inputs / elementos elevados

          // Bordes semitransparentes (rgba — no usan modificador de opacidad)
          border:         'rgba(255,255,255,0.07)',
          'border-strong': 'rgba(255,255,255,0.14)',

          // Tipografía
          primary:        '#e2e8f0',   // texto principal
          secondary:      '#94a3b8',   // texto secundario
          muted:          '#475569',   // texto muy atenuado

          // Energía eléctrica — cyan
          electric:       '#22d3ee',
          'electric-dim': 'rgba(34,211,238,0.12)',

          // Gasolina — ámbar/naranja
          fuel:           '#fb923c',
          'fuel-dim':     'rgba(251,146,60,0.12)',

          // Acciones UI
          accent:         '#3b82f6',   // azul acción
          success:        '#10b981',   // verde positivo
          danger:         '#f87171',   // rojo error/eliminar
        },
      },

      // ── Sombras con efecto glow ──────────────────────────────────────────
      boxShadow: {
        'j-card':     '0 1px 3px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
        'j-elevated': '0 4px 24px rgba(0,0,0,0.6)',
        'j-electric': '0 0 24px rgba(34,211,238,0.25), 0 2px 8px rgba(0,0,0,0.5)',
        'j-fuel':     '0 0 24px rgba(251,146,60,0.25),  0 2px 8px rgba(0,0,0,0.5)',
        'j-accent':   '0 0 24px rgba(59,130,246,0.3),   0 2px 8px rgba(0,0,0,0.5)',
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
