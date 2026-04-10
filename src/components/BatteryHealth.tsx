import type { ElectricCharge } from '../types'
import { calcBatteryHealthSummary, formatDate } from '../utils/calculations'
import type { ChargeHealthRecord } from '../utils/calculations'

interface Props {
  charges: ElectricCharge[]
}

// ── Gauge SVG ────────────────────────────────────────────────────────────────
// Semiciclo que abre hacia arriba.
// cx=60, cy=65, r=50 → (10,65) izquierda · (110,65) derecha · (60,15) arriba
function GaugeArc({ score, color }: { score: number; color: string }) {
  const cx = 60, cy = 65, r = 50
  const strokeBg = 'var(--j-elevated)'

  // Arco completo de fondo
  const bgPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`

  // Arco de puntuación: ángulo va de 180° (izda) hasta 360° (dcha) pasando por arriba (270°)
  // α = 180 + (score/100)*180  → score 0 = 180°(izda), 100 = 360°(dcha)
  const arcPath = (() => {
    if (score <= 0) return ''
    if (score >= 100) return bgPath
    const αDeg = 180 + (score / 100) * 180
    const αRad = (αDeg * Math.PI) / 180
    const ex = cx + r * Math.cos(αRad)
    const ey = cy + r * Math.sin(αRad)
    return `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`
  })()

  return (
    <svg viewBox="0 0 120 72" className="w-full max-w-[220px]" aria-hidden>
      {/* Background arc */}
      <path d={bgPath} fill="none" stroke={strokeBg} strokeWidth="10" strokeLinecap="round" />
      {/* Score arc */}
      {arcPath && (
        <path d={arcPath} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" />
      )}
      {/* Score text */}
      <text x="60" y="57" textAnchor="middle" fontSize="26" fontWeight="700" fill="var(--j-text-primary)">
        {score}
      </text>
      <text x="60" y="70" textAnchor="middle" fontSize="10" fill="var(--j-text-muted)">
        / 100
      </text>
    </svg>
  )
}

// ── Color helpers ────────────────────────────────────────────────────────────
const COLOR_HEX: Record<string, string> = {
  emerald: '#10b981',
  blue:    '#22d3ee',
  orange:  '#fb923c',
  rose:    '#f87171',
}

const COLOR_CLASSES: Record<string, { bg: string; text: string; border: string; bar: string }> = {
  emerald: { bg: 'bg-jaecoo-success-dim', text: 'text-jaecoo-success', border: 'border-jaecoo-success/30', bar: 'bg-jaecoo-success' },
  blue:    { bg: 'bg-jaecoo-electric-dim', text: 'text-jaecoo-electric', border: 'border-jaecoo-electric/30', bar: 'bg-jaecoo-electric' },
  orange:  { bg: 'bg-jaecoo-fuel-dim', text: 'text-jaecoo-fuel', border: 'border-jaecoo-fuel/30', bar: 'bg-jaecoo-fuel' },
  rose:    { bg: 'bg-jaecoo-danger/10', text: 'text-jaecoo-danger', border: 'border-jaecoo-danger/30', bar: 'bg-jaecoo-danger' },
}

// ── Score bar ────────────────────────────────────────────────────────────────
function ScoreBar({ record }: { record: ChargeHealthRecord }) {
  const c = COLOR_CLASSES[record.color]
  const startOk = record.startPct >= 20
  const endOk   = record.endPct <= 80

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-jaecoo-border last:border-0">
      {/* Score badge */}
      <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${c.bg} ${c.text} border ${c.border}`}>
        {record.score}
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs font-medium text-jaecoo-secondary">{formatDate(record.date)}</span>
          <span className={`text-[10px] font-semibold ${c.text}`}>{record.label}</span>
          <span className="text-[10px] text-jaecoo-muted ml-auto">{record.kWh} kWh</span>
        </div>

        {/* Start → End bar */}
        <div className="relative h-4 bg-jaecoo-elevated rounded-full overflow-hidden">
          {/* Optimal zone (20%–80%) */}
          <div
            className="absolute top-0 h-full bg-jaecoo-success-dim border-x border-jaecoo-success/20"
            style={{ left: '20%', width: '60%' }}
          />
          {/* Charge range bar */}
          <div
            className={`absolute top-0.5 bottom-0.5 rounded-full ${c.bar} opacity-80`}
            style={{ left: `${record.startPct}%`, width: `${record.endPct - record.startPct}%` }}
          />
        </div>

        {/* Labels */}
        <div className="flex justify-between mt-1">
          <span className={`text-[10px] font-semibold ${startOk ? 'text-jaecoo-success' : 'text-jaecoo-danger'}`}>
            Inicio {record.startPct}%{!startOk && ' ⚠'}
          </span>
          <span className={`text-[10px] font-semibold ${endOk ? 'text-jaecoo-success' : 'text-jaecoo-danger'}`}>
            {!endOk && '⚠ '}Fin {record.endPct}%
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function BatteryHealth({ charges }: Props) {
  const summary = calcBatteryHealthSummary(charges)
  const c = COLOR_CLASSES[summary.color]
  const hex = COLOR_HEX[summary.color]

  if (summary.totalCount === 0) {
    return (
      <div className="bg-jaecoo-card border border-jaecoo-border rounded-2xl p-6 text-center">
        <p className="text-jaecoo-muted text-sm">Añade recargas para ver la salud de la batería</p>
      </div>
    )
  }

  return (
    <div className="bg-jaecoo-card border border-jaecoo-border rounded-2xl p-5">
      <div className="grid md:grid-cols-2 gap-6">

        {/* Left: gauge + summary */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-full max-w-[200px] mx-auto">
            <GaugeArc score={summary.overall} color={hex} />
          </div>

          <div className="text-center">
            <span className={`inline-block text-sm font-bold px-4 py-1.5 rounded-full border ${c.bg} ${c.text} ${c.border}`}>
              {summary.label}
            </span>
            <p className="text-xs text-jaecoo-muted mt-2">
              Basado en {summary.scoredCount} recarga{summary.scoredCount !== 1 ? 's' : ''} con datos de batería
              {summary.scoredCount < summary.totalCount && ` (${summary.totalCount - summary.scoredCount} sin datos)`}
            </p>
          </div>

          {/* Legend */}
          <div className="w-full bg-jaecoo-elevated rounded-xl p-3 space-y-2">
            <p className="text-[10px] font-semibold text-jaecoo-muted uppercase tracking-widest mb-2">Criterios de puntuación</p>
            {[
              { range: '80–100', label: 'Óptima',  desc: 'Inicio ≥20% · Fin ≤80%', color: 'text-jaecoo-success' },
              { range: '60–79',  label: 'Buena',   desc: 'Ligera desviación',       color: 'text-jaecoo-electric' },
              { range: '35–59',  label: 'Regular', desc: 'Fuera del rango ideal',   color: 'text-jaecoo-fuel' },
              { range: '0–34',   label: 'Baja',    desc: 'Inicio ≤0% o fin 100%',  color: 'text-jaecoo-danger' },
            ].map(r => (
              <div key={r.range} className="flex items-center gap-2">
                <span className={`text-[10px] font-bold w-12 shrink-0 ${r.color}`}>{r.range}</span>
                <span className={`text-[10px] font-semibold ${r.color}`}>{r.label}</span>
                <span className="text-[10px] text-jaecoo-muted ml-auto">{r.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: per-charge list */}
        <div>
          <p className="text-xs font-semibold text-jaecoo-muted uppercase tracking-widest mb-3">
            Últimas recargas puntuadas
          </p>
          {summary.records.length === 0 ? (
            <p className="text-xs text-jaecoo-muted text-center py-8">
              Registra el % de batería en las recargas para ver el análisis
            </p>
          ) : (
            <div className="max-h-80 overflow-y-auto pr-1 space-y-0">
              {summary.records.slice(0, 10).map(r => (
                <ScoreBar key={r.id} record={r} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
