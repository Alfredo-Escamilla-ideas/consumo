import type { DrivingMode } from '../types'

const MODES: { value: DrivingMode; label: string; icon: string; desc: string }[] = [
  { value: 'city',    label: 'Ciudad',     icon: '🏙️', desc: 'Tráfico urbano, paradas frecuentes' },
  { value: 'highway', label: 'Carretera',  icon: '🛣️', desc: 'Vía rápida o autopista' },
  { value: 'mixed',   label: 'Mixto',      icon: '🔄', desc: 'Combinación de ciudad y carretera' },
]

interface Props {
  value: DrivingMode | ''
  onChange: (v: DrivingMode) => void
  error?: string
  context: 'charge' | 'refuel'
  accentColor?: 'blue' | 'orange'
}

export default function DrivingModeSelector({ value, onChange, error, context, accentColor = 'blue' }: Props) {
  const label = context === 'charge'
    ? '¿Cómo fue el trayecto desde la última recarga?'
    : '¿Cómo fue el trayecto desde el último repostaje?'

  const activeClasses = accentColor === 'orange'
    ? 'border-jaecoo-fuel bg-jaecoo-fuel-dim text-jaecoo-fuel ring-2 ring-jaecoo-fuel/30 ring-offset-1 ring-offset-jaecoo-card'
    : 'border-jaecoo-electric bg-jaecoo-electric-dim text-jaecoo-electric ring-2 ring-jaecoo-electric/30 ring-offset-1 ring-offset-jaecoo-card'

  const activeLabel = accentColor === 'orange' ? 'text-jaecoo-fuel' : 'text-jaecoo-electric'

  return (
    <div>
      <p className="text-xs font-semibold text-jaecoo-muted mb-2">
        {label}
        <span className="ml-1.5 text-jaecoo-danger font-bold" aria-hidden>*</span>
      </p>
      <div className={`grid grid-cols-3 gap-2 rounded-xl transition-all ${error ? 'p-1.5 -m-1.5 ring-1 ring-jaecoo-danger/40' : ''}`}>
        {MODES.map(m => (
          <button
            key={m.value}
            type="button"
            onClick={() => onChange(m.value)}
            className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-center transition-all
              ${value === m.value
                ? activeClasses
                : 'border-jaecoo-border bg-jaecoo-elevated hover:border-jaecoo-border-strong text-jaecoo-secondary'
              }`}
          >
            <span className="text-2xl leading-none">{m.icon}</span>
            <span className={`text-xs font-semibold ${value === m.value ? activeLabel : 'text-jaecoo-secondary'}`}>
              {m.label}
            </span>
            <span className="text-[10px] text-jaecoo-muted leading-tight hidden sm:block">{m.desc}</span>
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-jaecoo-danger mt-1">{error}</p>}
    </div>
  )
}

export function drivingModeLabel(mode?: DrivingMode | null): string {
  switch (mode) {
    case 'city':    return 'Ciudad'
    case 'highway': return 'Carretera'
    case 'mixed':   return 'Mixto'
    default:        return '—'
  }
}

export function drivingModeIcon(mode?: DrivingMode | null): string {
  switch (mode) {
    case 'city':    return '🏙️'
    case 'highway': return '🛣️'
    case 'mixed':   return '🔄'
    default:        return ''
  }
}
