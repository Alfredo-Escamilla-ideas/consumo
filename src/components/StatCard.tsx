import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  color: 'blue' | 'orange' | 'emerald' | 'violet' | 'slate' | 'rose'
  trend?: { value: string; positive: boolean }
}

const colorMap = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'bg-blue-500 text-white',
    text: 'text-blue-700',
    border: 'border-blue-100',
  },
  orange: {
    bg: 'bg-orange-50',
    icon: 'bg-orange-500 text-white',
    text: 'text-orange-700',
    border: 'border-orange-100',
  },
  emerald: {
    bg: 'bg-emerald-50',
    icon: 'bg-emerald-500 text-white',
    text: 'text-emerald-700',
    border: 'border-emerald-100',
  },
  violet: {
    bg: 'bg-violet-50',
    icon: 'bg-violet-500 text-white',
    text: 'text-violet-700',
    border: 'border-violet-100',
  },
  slate: {
    bg: 'bg-slate-50',
    icon: 'bg-slate-500 text-white',
    text: 'text-slate-700',
    border: 'border-slate-200',
  },
  rose: {
    bg: 'bg-rose-50',
    icon: 'bg-rose-500 text-white',
    text: 'text-rose-700',
    border: 'border-rose-100',
  },
}

export default function StatCard({ title, value, subtitle, icon: Icon, color, trend }: StatCardProps) {
  const c = colorMap[color]
  return (
    <div className={`rounded-2xl border ${c.border} ${c.bg} p-5 flex items-start gap-4`}>
      <div className={`rounded-xl p-2.5 ${c.icon} shrink-0`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">{title}</p>
        <p className={`text-2xl font-bold mt-0.5 ${c.text} leading-none`}>{value}</p>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        {trend && (
          <p className={`text-xs mt-1 font-medium ${trend.positive ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend.positive ? '↑' : '↓'} {trend.value}
          </p>
        )}
      </div>
    </div>
  )
}
