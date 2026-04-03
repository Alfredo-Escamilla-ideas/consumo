import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  color: 'blue' | 'orange' | 'emerald' | 'violet' | 'slate' | 'rose'
  trend?: { value: string; positive: boolean }
}

// Mapa de colores — paleta JAECOO dark
const colorMap = {
  blue: {
    card:  'border-jaecoo-electric/20 hover:border-jaecoo-electric/40 hover:shadow-j-electric',
    icon:  'bg-jaecoo-electric-dim text-jaecoo-electric',
    value: 'text-jaecoo-electric',
  },
  orange: {
    card:  'border-jaecoo-fuel/20 hover:border-jaecoo-fuel/40 hover:shadow-j-fuel',
    icon:  'bg-jaecoo-fuel-dim text-jaecoo-fuel',
    value: 'text-jaecoo-fuel',
  },
  emerald: {
    card:  'border-emerald-500/20 hover:border-emerald-500/40 hover:shadow-[0_0_24px_rgba(16,185,129,0.2)]',
    icon:  'bg-emerald-500/10 text-emerald-400',
    value: 'text-emerald-400',
  },
  violet: {
    card:  'border-violet-500/20 hover:border-violet-500/40 hover:shadow-[0_0_24px_rgba(139,92,246,0.2)]',
    icon:  'bg-violet-500/10 text-violet-400',
    value: 'text-violet-400',
  },
  slate: {
    card:  'border-jaecoo-border hover:border-jaecoo-border-strong',
    icon:  'bg-jaecoo-elevated text-jaecoo-secondary',
    value: 'text-jaecoo-primary',
  },
  rose: {
    card:  'border-rose-500/20 hover:border-rose-500/40 hover:shadow-[0_0_24px_rgba(244,63,94,0.2)]',
    icon:  'bg-rose-500/10 text-rose-400',
    value: 'text-rose-400',
  },
}

export default function StatCard({ title, value, subtitle, icon: Icon, color, trend }: StatCardProps) {
  const c = colorMap[color]
  return (
    <div className={`
      bg-jaecoo-card rounded-2xl border p-5
      flex items-start gap-4
      shadow-j-card transition-all duration-200
      ${c.card}
    `}>
      {/* Icono */}
      <div className={`rounded-xl p-2.5 ${c.icon} shrink-0`}>
        <Icon size={20} />
      </div>

      {/* Contenido */}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold text-jaecoo-muted uppercase tracking-widest truncate">
          {title}
        </p>
        <p className={`text-xl font-bold mt-0.5 leading-tight break-words min-w-0 ${c.value}`}>
          {value}
        </p>
        {subtitle && (
          <p className="text-xs text-jaecoo-muted mt-1">{subtitle}</p>
        )}
        {trend && (
          <p className={`text-xs mt-1 font-semibold ${trend.positive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trend.positive ? '↑' : '↓'} {trend.value}
          </p>
        )}
      </div>
    </div>
  )
}
