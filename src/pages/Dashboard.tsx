import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Zap, Fuel, Euro, Route, Leaf, TrendingUp, ChevronRight, Loader2, BatteryCharging, Gauge, PiggyBank, Shield, ShieldCheck, ShieldAlert, Phone, CalendarDays, Wrench, ClipboardList, AlertOctagon } from 'lucide-react'
import { useData } from '../context/DataContext'
import StatCard from '../components/StatCard'
import {
  calcElectricStats,
  calcFuelStats,
  calcCombinedStats,
  getRecentEfficiency,
  getRecentConsumption,
  formatDate,
  formatCurrency,
  formatNumber,
  BATTERY_CAPACITY_KWH,
  FUEL_TANK_LITERS,
  EL_MAX_RANGE_KM,
  FUEL_MAX_RANGE_KM,
} from '../utils/calculations'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { Insurance, Repair, MaintenanceService, AccidentReport } from '../types'
import { apiGetInsurance, apiGetRepairs, apiGetMaintenance, apiGetAccidents } from '../services/api'

const INSURANCE_TYPES: Record<string, { label: string; color: string; icon: typeof Shield }> = {
  third_party:          { label: 'Terceros',                    color: 'text-jaecoo-muted bg-jaecoo-elevated',          icon: Shield      },
  third_party_plus:     { label: 'Terceros ampliado',           color: 'text-jaecoo-electric bg-jaecoo-electric-dim',   icon: ShieldCheck },
  comprehensive_excess: { label: 'Todo riesgo c/ franquicia',   color: 'text-jaecoo-warning bg-jaecoo-warning-dim',     icon: ShieldAlert },
  comprehensive:        { label: 'Todo riesgo',                 color: 'text-jaecoo-success bg-jaecoo-success-dim',     icon: ShieldCheck },
}

function insExpiryBadge(dateStr?: string) {
  if (!dateStr) return null
  const days = Math.round((new Date(dateStr).getTime() - Date.now()) / 86400000)
  if (days < 0)   return { label: `Vencido hace ${Math.abs(days)} días`, color: 'text-jaecoo-danger bg-jaecoo-danger/10' }
  if (days <= 30) return { label: `Vence en ${days} días`,              color: 'text-jaecoo-fuel bg-jaecoo-fuel-dim' }
  if (days <= 90) return { label: `Vence en ${days} días`,              color: 'text-jaecoo-warning bg-jaecoo-warning-dim' }
  return            { label: `Vigente — ${days} días`,                  color: 'text-jaecoo-success bg-jaecoo-success-dim' }
}

const TOOLTIP_STYLE = {
  contentStyle: { background: 'var(--j-card)', border: '1px solid var(--j-border-strong)', borderRadius: '12px', color: 'var(--j-text-primary)', fontSize: 12 },
  itemStyle: { color: 'var(--j-text-secondary)' },
  cursor: { fill: 'rgba(128,128,128,0.06)' },
}

export default function Dashboard() {
  const { data, isLoading } = useData()
  const { electricCharges, fuelRefuels } = data
  const [insurance, setInsurance] = useState<Insurance | null | undefined>(undefined)
  const [repairs, setRepairs] = useState<Repair[] | undefined>(undefined)
  const [maintenance, setMaintenance] = useState<MaintenanceService[] | undefined>(undefined)
  const [accidents, setAccidents] = useState<AccidentReport[] | undefined>(undefined)

  useEffect(() => {
    apiGetInsurance().then(setInsurance).catch(() => setInsurance(null))
    apiGetRepairs().then(setRepairs).catch(() => setRepairs([]))
    apiGetMaintenance().then(setMaintenance).catch(() => setMaintenance([]))
    apiGetAccidents().then(setAccidents).catch(() => setAccidents([]))
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="grid sm:grid-cols-2 gap-4">
          {[0,1].map(i => (
            <div key={i} className="bg-jaecoo-card border border-jaecoo-border rounded-2xl p-5">
              <div className="h-3 bg-jaecoo-elevated rounded-full w-20 mb-4" />
              <div className="h-7 bg-jaecoo-elevated rounded-full w-1/2 mb-2" />
              <div className="h-3 bg-jaecoo-elevated rounded-full w-2/3" />
            </div>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0,1,2,3].map(i => (
            <div key={i} className="bg-jaecoo-card border border-jaecoo-border rounded-2xl p-4">
              <div className="h-3 bg-jaecoo-elevated rounded-full w-16 mb-3" />
              <div className="h-5 bg-jaecoo-elevated rounded-full w-3/4 mb-1.5" />
              <div className="h-3 bg-jaecoo-elevated rounded-full w-1/2" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[0,1,2,3,4,5].map(i => (
            <div key={i} className="bg-jaecoo-card border border-jaecoo-border rounded-2xl p-4">
              <div className="h-3 bg-jaecoo-elevated rounded-full w-12 mb-3" />
              <div className="h-6 bg-jaecoo-elevated rounded-full w-full" />
            </div>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {[0,1].map(i => (
            <div key={i} className="bg-jaecoo-card border border-jaecoo-border rounded-2xl p-5">
              <div className="h-3 bg-jaecoo-elevated rounded-full w-24 mb-4" />
              {[0,1,2,3].map(j => (
                <div key={j} className="flex gap-3 py-2.5 border-b border-jaecoo-border last:border-0">
                  <div className="h-3 bg-jaecoo-elevated rounded-full w-16" />
                  <div className="h-3 bg-jaecoo-elevated rounded-full flex-1" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const elStats = calcElectricStats(electricCharges)
  const fuStats = calcFuelStats(fuelRefuels)
  const combined = calcCombinedStats(electricCharges, fuelRefuels)

  const recentCharges = [...electricCharges].sort((a, b) => b.odometer - a.odometer).slice(0, 4)
  const recentRefuels = [...fuelRefuels].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4)
  const hasData = electricCharges.length > 0 || fuelRefuels.length > 0

  // Autonomy using last 5 records (real-world)
  const sortedCharges = [...electricCharges].sort((a, b) => a.odometer - b.odometer)
  const sortedRefuels = [...fuelRefuels].sort((a, b) => a.odometer - b.odometer)
  const lastCharge = sortedCharges[sortedCharges.length - 1] ?? null
  const lastRefuel = sortedRefuels[sortedRefuels.length - 1] ?? null
  const currentOdo = Math.max(lastCharge?.odometer ?? 0, lastRefuel?.odometer ?? 0)

  const recentElEff = getRecentEfficiency(electricCharges)
  const recentFuCons = getRecentConsumption(fuelRefuels)
  const elEff = recentElEff > 0 ? recentElEff : (elStats.avgEfficiency > 0 ? elStats.avgEfficiency : 15)
  const avgCons = recentFuCons > 0 ? recentFuCons : (fuStats.avgConsumption > 0 ? fuStats.avgConsumption : 7)

  const kmSinceCharge = lastCharge ? currentOdo - lastCharge.odometer : null
  const kWhAtLastCharge = lastCharge ? ((lastCharge.batteryPercent ?? 100) / 100) * BATTERY_CAPACITY_KWH : null
  const kWhUsedSinceCharge = kmSinceCharge != null ? (kmSinceCharge * elEff) / 100 : 0
  const kWhRemaining = kWhAtLastCharge != null ? Math.max(0, kWhAtLastCharge - kWhUsedSinceCharge) : null
  const elRangeKm = kWhRemaining != null ? Math.round((kWhRemaining / BATTERY_CAPACITY_KWH) * EL_MAX_RANGE_KM) : null

  const kmSinceRefuel = lastRefuel ? currentOdo - lastRefuel.odometer : null
  const litersUsedSince = kmSinceRefuel != null ? (kmSinceRefuel * avgCons) / 100 : 0
  const totalLitersAtRefuel = lastRefuel ? lastRefuel.liters + (lastRefuel.litersInTank ?? 0) : null
  const litersRemaining = totalLitersAtRefuel != null ? Math.max(0, totalLitersAtRefuel - litersUsedSince) : null
  const fuelRangeKm = litersRemaining != null
    ? Math.round((litersRemaining / FUEL_TANK_LITERS) * FUEL_MAX_RANGE_KM)
    : null

  const savedVsAllFuel = fuStats.avgCostPerKm > 0
    ? Math.max(0, (fuStats.avgCostPerKm - elStats.avgCostPerKm) * elStats.totalKm)
    : 0

  // Semáforo de Ahorro
  const hasBothData = elStats.totalKm > 0 && fuStats.totalKm > 0 && elStats.avgCostPerKm > 0 && fuStats.avgCostPerKm > 0
  const savingsRatio = hasBothData ? 1 - (elStats.avgCostPerKm / fuStats.avgCostPerKm) : null
  const SEMAFORO_STYLES = {
    success: { dot: 'bg-jaecoo-success', border: 'border-jaecoo-success/20', badge: 'bg-jaecoo-success-dim text-jaecoo-success', text: 'text-jaecoo-success' },
    warning: { dot: 'bg-jaecoo-warning', border: 'border-jaecoo-warning/20', badge: 'bg-jaecoo-warning-dim text-jaecoo-warning', text: 'text-jaecoo-warning' },
    fuel:    { dot: 'bg-jaecoo-fuel',    border: 'border-jaecoo-fuel/20',    badge: 'bg-jaecoo-fuel-dim text-jaecoo-fuel',        text: 'text-jaecoo-fuel' },
    danger:  { dot: 'bg-jaecoo-danger',  border: 'border-jaecoo-danger/20',  badge: 'bg-jaecoo-danger/10 text-jaecoo-danger',     text: 'text-jaecoo-danger' },
  } as const

  const semaforo = savingsRatio === null ? null
    : savingsRatio >= 0.5
      ? { key: 'success' as const, msg: `Ahorro excelente — el eléctrico te sale un ${Math.round(savingsRatio * 100)}% más barato que la gasolina`, detail: `${formatNumber(elStats.avgCostPerKm, 4)} vs ${formatNumber(fuStats.avgCostPerKm, 4)} €/km`, badge: '¡Muy eficiente!' }
      : savingsRatio >= 0.2
        ? { key: 'warning' as const, msg: `Buen ahorro — el eléctrico es un ${Math.round(savingsRatio * 100)}% más barato`, detail: `${formatNumber(elStats.avgCostPerKm, 4)} vs ${formatNumber(fuStats.avgCostPerKm, 4)} €/km`, badge: 'Buen ritmo' }
        : savingsRatio > 0
          ? { key: 'fuel' as const, msg: `Ahorro moderado — recarga más para maximizar`, detail: `${formatNumber(elStats.avgCostPerKm, 4)} vs ${formatNumber(fuStats.avgCostPerKm, 4)} €/km`, badge: 'Mejorable' }
          : { key: 'danger' as const, msg: `La gasolina sale más barata por km — revisa tarifas de carga`, detail: `${formatNumber(elStats.avgCostPerKm, 4)} vs ${formatNumber(fuStats.avgCostPerKm, 4)} €/km`, badge: 'Ojo' }

  const pieData = [
    { name: 'Eléctrico', value: combined.totalElectricCost, color: '#22d3ee' },
    { name: 'Gasolina', value: combined.totalFuelCost, color: '#fb923c' },
  ].filter(d => d.value > 0)

  return (
    <div className="space-y-6">

      {/* ── Estado actual del vehículo ── */}
      {hasData && (
        <div className="grid sm:grid-cols-3 gap-4">
          {/* Electric autonomy */}
          <Link to="/recargas" className="bg-jaecoo-electric-dim border border-jaecoo-electric/20 hover:border-jaecoo-electric/40 hover:shadow-j-electric rounded-2xl p-4 transition-all group">
            <div className="flex items-center gap-2 mb-2">
              <BatteryCharging size={16} className="text-jaecoo-electric" />
              <p className="text-xs text-jaecoo-electric font-bold uppercase tracking-wide">Autonomía eléctrica</p>
              <ChevronRight size={13} className="text-jaecoo-electric ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            {elRangeKm !== null ? (
              <>
                <p className="text-3xl font-bold text-jaecoo-electric">{elRangeKm.toLocaleString('es-ES')} <span className="text-lg font-normal text-jaecoo-electric">km</span></p>
                <p className="text-xs text-jaecoo-secondary mt-1">
                  {kWhRemaining != null ? `${formatNumber(kWhRemaining)} kWh restantes` : ''}
                  {lastCharge?.batteryPercent != null ? ` · última carga al ${lastCharge.batteryPercent}%` : ''}
                </p>
                {kmSinceCharge != null && kmSinceCharge > 0 && (
                  <p className="text-xs text-jaecoo-secondary">{kmSinceCharge.toLocaleString('es-ES')} km desde última recarga</p>
                )}
                <p className="text-[10px] text-jaecoo-muted mt-0.5">Máx. {EL_MAX_RANGE_KM} km al 100%</p>
              </>
            ) : (
              <p className="text-sm text-jaecoo-secondary mt-2">Sin datos de recarga</p>
            )}
          </Link>

          {/* Fuel autonomy */}
          <Link to="/repostajes" className="bg-jaecoo-fuel-dim border border-jaecoo-fuel/20 hover:border-jaecoo-fuel/40 hover:shadow-j-fuel rounded-2xl p-4 transition-all group">
            <div className="flex items-center gap-2 mb-2">
              <Gauge size={16} className="text-jaecoo-fuel" />
              <p className="text-xs text-jaecoo-fuel font-bold uppercase tracking-wide">Autonomía gasolina</p>
              <ChevronRight size={13} className="text-jaecoo-fuel ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            {fuelRangeKm !== null ? (
              <>
                <p className="text-3xl font-bold text-jaecoo-fuel">{fuelRangeKm.toLocaleString('es-ES')} <span className="text-lg font-normal text-jaecoo-fuel">km</span></p>
                <p className="text-xs text-jaecoo-secondary mt-1">
                  {lastRefuel ? `Último repostaje: ${formatDate(lastRefuel.date)}` : ''}
                </p>
                {kmSinceRefuel != null && kmSinceRefuel > 0 && (
                  <p className="text-xs text-jaecoo-secondary">{kmSinceRefuel.toLocaleString('es-ES')} km desde último repostaje</p>
                )}
                <p className="text-[10px] text-jaecoo-muted mt-0.5">Máx. {FUEL_MAX_RANGE_KM} km con depósito lleno</p>
              </>
            ) : (
              <p className="text-sm text-jaecoo-secondary mt-2">Sin datos de repostaje</p>
            )}
          </Link>

          {/* Savings */}
          <Link to="/estadisticas" className="bg-jaecoo-success-dim border border-jaecoo-success/20 hover:border-jaecoo-success/40 hover:shadow-[0_0_24px_rgba(16,185,129,0.2)] rounded-2xl p-4 transition-all group">
            <div className="flex items-center gap-2 mb-2">
              <PiggyBank size={16} className="text-jaecoo-success" />
              <p className="text-xs text-jaecoo-success font-bold uppercase tracking-wide">Ahorro eléctrico</p>
              <ChevronRight size={13} className="text-jaecoo-success ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            {savedVsAllFuel > 0 ? (
              <>
                <p className="text-3xl font-bold text-jaecoo-success">{formatCurrency(savedVsAllFuel)}</p>
                <p className="text-xs text-jaecoo-secondary mt-1">vs {formatNumber(elStats.totalKm, 0)} km en gasolina</p>
                <p className="text-xs text-jaecoo-muted">{formatNumber(elStats.avgCostPerKm, 3)} vs {formatNumber(fuStats.avgCostPerKm, 3)} €/km</p>
              </>
            ) : (
              <p className="text-sm text-jaecoo-secondary mt-2">Más datos para calcular ahorro</p>
            )}
          </Link>
        </div>
      )}

      {/* ── Semáforo de Ahorro ── */}
      {semaforo && (() => {
        const s = SEMAFORO_STYLES[semaforo.key]
        return (
          <div className={`bg-jaecoo-card border ${s.border} rounded-2xl p-4 flex items-center gap-4`}>
            {/* Traffic light dots */}
            <div className="shrink-0 flex flex-col items-center gap-1.5">
              {(['success', 'warning', 'fuel', 'danger'] as const).map(k => (
                <div key={k} className={`w-3 h-3 rounded-full transition-all ${semaforo.key === k ? SEMAFORO_STYLES[k].dot + ' shadow-lg' : 'bg-jaecoo-elevated'}`} />
              ))}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-semibold text-jaecoo-primary">Semáforo de Ahorro</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.badge}`}>
                  {semaforo.badge}
                </span>
              </div>
              <p className="text-xs text-jaecoo-secondary">{semaforo.msg}</p>
              <p className="text-[11px] text-jaecoo-muted mt-0.5">{semaforo.detail}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className={`text-2xl font-bold ${s.text}`}>{formatCurrency(savedVsAllFuel)}</p>
              <p className="text-[10px] text-jaecoo-muted">ahorrado</p>
            </div>
          </div>
        )
      })()}

      {/* ── Seguro / Averías / Mantenimientos / Partes ── */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Seguro */}
        {(() => {
          if (!insurance) return (
            <Link to="/seguro" className="block bg-jaecoo-success-dim border border-jaecoo-success/20 hover:border-jaecoo-success/40 rounded-2xl p-4 transition-all group">
              <div className="flex items-center gap-2 mb-1">
                <Shield size={15} className="text-jaecoo-success" />
                <p className="text-xs font-bold uppercase tracking-wide text-jaecoo-success">Seguro</p>
                <ChevronRight size={13} className="text-jaecoo-success ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-sm text-jaecoo-muted">Sin seguro registrado</p>
            </Link>
          )
          const typeInfo = INSURANCE_TYPES[insurance.type] ?? INSURANCE_TYPES.comprehensive
          const TypeIcon = typeInfo.icon
          const expiry = insExpiryBadge(insurance.endDate)
          return (
            <Link to="/seguro" className="block bg-jaecoo-success-dim border border-jaecoo-success/20 hover:border-jaecoo-success/40 rounded-2xl p-4 transition-all group">
              <div className="flex items-center gap-2 mb-2">
                <TypeIcon size={15} className="text-jaecoo-success" />
                <p className="text-xs font-bold uppercase tracking-wide text-jaecoo-success">Seguro</p>
                <ChevronRight size={13} className="text-jaecoo-success ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-base font-bold text-jaecoo-primary truncate">{insurance.company}</p>
              <div className="flex flex-wrap gap-1 mt-1 mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeInfo.color}`}>{typeInfo.label}</span>
                {expiry && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${expiry.color}`}>{expiry.label}</span>}
              </div>
              <div className="flex flex-col gap-1">
                {insurance.endDate && <div className="flex items-center gap-1.5"><CalendarDays size={11} className="text-jaecoo-muted" /><span className="text-[11px] text-jaecoo-secondary">Vence {insurance.endDate}</span></div>}
                {insurance.emergencyPhone && <div className="flex items-center gap-1.5"><Phone size={11} className="text-jaecoo-muted" /><span className="text-[11px] text-jaecoo-secondary">{insurance.emergencyPhone}</span></div>}
                {insurance.annualPrice != null && <div className="flex items-center gap-1.5"><Euro size={11} className="text-jaecoo-muted" /><span className="text-[11px] text-jaecoo-secondary">{formatCurrency(insurance.annualPrice)}/año</span></div>}
              </div>
            </Link>
          )
        })()}

        {/* Averías */}
        {(() => {
          const openRepairs = (repairs ?? []).filter(r => r.status === 'open' || r.status === 'in_repair')
          const last = [...(repairs ?? [])].sort((a, b) => b.date.localeCompare(a.date))[0]
          const STATUS: Record<string, { label: string; color: string }> = {
            open:      { label: 'Abierta',      color: 'text-jaecoo-danger bg-jaecoo-danger/10' },
            in_repair: { label: 'En taller',    color: 'text-jaecoo-fuel bg-jaecoo-fuel-dim' },
            resolved:  { label: 'Resuelta',     color: 'text-jaecoo-success bg-jaecoo-success-dim' },
            warranty:  { label: 'En garantía',  color: 'text-jaecoo-electric bg-jaecoo-electric-dim' },
          }
          const hasOpen = openRepairs.length > 0
          return (
            <Link to="/taller?tab=repairs" className={`block border rounded-2xl p-4 transition-all group ${hasOpen ? 'bg-jaecoo-danger/10 border-jaecoo-danger/20 hover:border-jaecoo-danger/40' : 'bg-jaecoo-card border-jaecoo-border hover:border-jaecoo-border-strong'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Wrench size={15} className={hasOpen ? 'text-jaecoo-danger' : 'text-jaecoo-muted'} />
                <p className={`text-xs font-bold uppercase tracking-wide ${hasOpen ? 'text-jaecoo-danger' : 'text-jaecoo-secondary'}`}>Averías</p>
                {hasOpen && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-jaecoo-danger bg-jaecoo-danger/10 ml-1">{openRepairs.length} abierta{openRepairs.length > 1 ? 's' : ''}</span>}
                <ChevronRight size={13} className={`ml-auto opacity-0 group-hover:opacity-100 transition-opacity ${hasOpen ? 'text-jaecoo-danger' : 'text-jaecoo-muted'}`} />
              </div>
              {!last ? (
                <p className="text-sm text-jaecoo-muted">Sin averías registradas</p>
              ) : (
                <>
                  <p className="text-sm font-semibold text-jaecoo-primary truncate">{last.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS[last.status]?.color ?? ''}`}>{STATUS[last.status]?.label}</span>
                    <span className="text-[11px] text-jaecoo-muted">{last.date}</span>
                  </div>
                  {(repairs ?? []).length > 1 && <p className="text-[11px] text-jaecoo-muted mt-1">{(repairs ?? []).length} averías en total</p>}
                </>
              )}
            </Link>
          )
        })()}

        {/* Mantenimientos */}
        {(() => {
          const sorted = [...(maintenance ?? [])].sort((a, b) => b.date.localeCompare(a.date))
          const last = sorted[0]
          const nextService = sorted.find(s => s.nextDate)
          const MAINT_TYPES: Record<string, string> = {
            annual: 'Revisión anual', oil: 'Cambio aceite', brakes: 'Frenos',
            tires: 'Neumáticos', battery: 'Batería', full: 'Revisión completa', other: 'Otro',
          }
          const daysToNext = nextService?.nextDate
            ? Math.round((new Date(nextService.nextDate).getTime() - Date.now()) / 86400000)
            : null
          const alert = daysToNext !== null && daysToNext <= 30
          return (
            <Link to="/taller?tab=maintenance" className={`block border rounded-2xl p-4 transition-all group ${alert ? 'bg-jaecoo-warning-dim border-jaecoo-warning/20 hover:border-jaecoo-warning/40' : 'bg-jaecoo-card border-jaecoo-border hover:border-jaecoo-border-strong'}`}>
              <div className="flex items-center gap-2 mb-2">
                <ClipboardList size={15} className={alert ? 'text-jaecoo-warning' : 'text-jaecoo-muted'} />
                <p className={`text-xs font-bold uppercase tracking-wide ${alert ? 'text-jaecoo-warning' : 'text-jaecoo-secondary'}`}>Revisiones</p>
                <ChevronRight size={13} className={`ml-auto opacity-0 group-hover:opacity-100 transition-opacity ${alert ? 'text-jaecoo-warning' : 'text-jaecoo-muted'}`} />
              </div>
              {!last ? (
                <p className="text-sm text-jaecoo-muted">Sin mantenimientos registrados</p>
              ) : (
                <>
                  <p className="text-sm font-semibold text-jaecoo-primary">{MAINT_TYPES[last.type] ?? last.type}</p>
                  <p className="text-[11px] text-jaecoo-muted mt-0.5">Último: {last.date}</p>
                  {nextService?.nextDate && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <CalendarDays size={11} className={alert ? 'text-jaecoo-warning' : 'text-jaecoo-muted'} />
                      <span className={`text-[11px] font-semibold ${alert ? 'text-jaecoo-warning' : 'text-jaecoo-secondary'}`}>
                        Próximo: {nextService.nextDate}{daysToNext !== null ? ` (${daysToNext < 0 ? 'hace ' + Math.abs(daysToNext) + ' días' : 'en ' + daysToNext + ' días'})` : ''}
                      </span>
                    </div>
                  )}
                  {(maintenance ?? []).length > 1 && <p className="text-[11px] text-jaecoo-muted mt-1">{(maintenance ?? []).length} servicios registrados</p>}
                </>
              )}
            </Link>
          )
        })()}

        {/* Partes de accidente */}
        {(() => {
          const list = accidents ?? []
          const open = list.filter(a => a.status !== 'resolved')
          const last = [...list].sort((a, b) => b.date.localeCompare(a.date))[0]
          const hasOpen = open.length > 0
          const STATUS: Record<string, { label: string; color: string }> = {
            open:        { label: 'Abierto',    color: 'text-jaecoo-danger bg-jaecoo-danger/10' },
            in_progress: { label: 'En gestión', color: 'text-jaecoo-warning bg-jaecoo-warning-dim' },
            resolved:    { label: 'Resuelto',   color: 'text-jaecoo-success bg-jaecoo-success-dim' },
          }
          return (
            <Link to="/taller?tab=accidents" className={`block border rounded-2xl p-4 transition-all group ${hasOpen ? 'bg-jaecoo-danger/10 border-jaecoo-danger/20 hover:border-jaecoo-danger/40' : 'bg-jaecoo-card border-jaecoo-border hover:border-jaecoo-border-strong'}`}>
              <div className="flex items-center gap-2 mb-2">
                <AlertOctagon size={15} className={hasOpen ? 'text-jaecoo-danger' : 'text-jaecoo-muted'} />
                <p className={`text-xs font-bold uppercase tracking-wide ${hasOpen ? 'text-jaecoo-danger' : 'text-jaecoo-secondary'}`}>Partes</p>
                {hasOpen && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-jaecoo-danger bg-jaecoo-danger/10 ml-1">{open.length} abierto{open.length > 1 ? 's' : ''}</span>}
                <ChevronRight size={13} className={`ml-auto opacity-0 group-hover:opacity-100 transition-opacity ${hasOpen ? 'text-jaecoo-danger' : 'text-jaecoo-muted'}`} />
              </div>
              {!last ? (
                <p className="text-sm text-jaecoo-muted">Sin partes registrados</p>
              ) : (
                <>
                  <p className="text-sm font-semibold text-jaecoo-primary truncate">{last.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS[last.status]?.color ?? ''}`}>{STATUS[last.status]?.label}</span>
                    <span className="text-[11px] text-jaecoo-muted">{last.date}</span>
                  </div>
                  {list.length > 1 && <p className="text-[11px] text-jaecoo-muted mt-1">{list.length} partes en total</p>}
                </>
              )}
            </Link>
          )
        })()}

      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="Km totales" value={`${formatNumber(combined.totalKm, 0)} km`} icon={Route} color="slate" />
        <StatCard title="Gasto total" value={formatCurrency(combined.totalCost)} icon={Euro} color="violet" />
        <StatCard title="Coste/km" value={`${formatNumber(combined.avgCostPerKm, 3)} €`} icon={TrendingUp} color="slate" />
        <StatCard title="Total eléctrico" value={formatCurrency(elStats.totalCost)} subtitle={`${formatNumber(elStats.totalKWh)} kWh`} icon={Zap} color="blue" />
        <StatCard title="Total gasolina" value={formatCurrency(fuStats.totalCost)} subtitle={`${formatNumber(fuStats.totalLiters)} L`} icon={Fuel} color="orange" />
        <StatCard title="CO₂ ahorrado" value={`${formatNumber(combined.estimatedCO2SavedKg, 0)} kg`} subtitle="vs solo gasolina" icon={Leaf} color="emerald" />
      </div>

      {/* Empty state */}
      {!hasData && (
        <div className="bg-jaecoo-card border border-jaecoo-border rounded-2xl p-8 text-center">
          <p className="text-jaecoo-muted text-sm mb-4">Aún no tienes datos. Añade tu primera recarga o repostaje.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link to="/recargas" className="inline-flex items-center gap-2 px-4 py-2 bg-jaecoo-electric text-jaecoo-base rounded-xl text-sm font-bold hover:brightness-110 transition-all">
              <Zap size={14} /> Nueva recarga
            </Link>
            <Link to="/repostajes" className="inline-flex items-center gap-2 px-4 py-2 bg-jaecoo-fuel text-white rounded-xl text-sm font-bold hover:brightness-110 transition-all">
              <Fuel size={14} /> Nuevo repostaje
            </Link>
          </div>
        </div>
      )}

      {/* ── Chart + recent lists ── */}
      {hasData && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Split pie chart */}
          <div className="bg-jaecoo-card border border-jaecoo-border rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-jaecoo-primary mb-4">Reparto del gasto</h2>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => formatCurrency(v)} />
                  <Legend formatter={(v) => <span className="text-xs text-jaecoo-secondary">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-jaecoo-muted text-center py-12">Sin datos</p>
            )}
            <div className="mt-3 grid grid-cols-2 gap-3 text-center">
              <div className="bg-jaecoo-electric-dim rounded-xl p-2 border border-jaecoo-electric/10">
                <p className="text-xs text-jaecoo-muted">Eléctrico</p>
                <p className="text-sm font-bold text-jaecoo-electric">{formatNumber(combined.electricKmPercent, 1)}%</p>
                <p className="text-xs text-jaecoo-muted">{formatNumber(elStats.totalKm, 0)} km</p>
              </div>
              <div className="bg-jaecoo-fuel-dim rounded-xl p-2 border border-jaecoo-fuel/10">
                <p className="text-xs text-jaecoo-muted">Gasolina</p>
                <p className="text-sm font-bold text-jaecoo-fuel">{formatNumber(combined.fuelKmPercent, 1)}%</p>
                <p className="text-xs text-jaecoo-muted">{formatNumber(fuStats.totalKm, 0)} km</p>
              </div>
            </div>
          </div>

          {/* Recent charges */}
          <div className="bg-jaecoo-card border border-jaecoo-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-jaecoo-primary">Últimas recargas</h2>
              <Link to="/recargas" className="text-xs text-jaecoo-electric hover:text-jaecoo-electric/80 flex items-center gap-0.5 transition-colors">Ver todas <ChevronRight size={12} /></Link>
            </div>
            {recentCharges.length === 0 ? (
              <p className="text-xs text-jaecoo-muted py-8 text-center">Sin recargas</p>
            ) : (
              <div className="space-y-2">
                {recentCharges.map(c => (
                  <div key={c.id} className="flex items-center gap-3 py-2 border-b border-jaecoo-border last:border-0">
                    <div className="bg-jaecoo-electric-dim text-jaecoo-electric rounded-lg p-1.5 shrink-0">
                      <Zap size={13} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-jaecoo-primary truncate">{c.stationName}</p>
                      <p className="text-[11px] text-jaecoo-muted">{formatDate(c.date)} · {c.kWh} kWh · {c.odometer.toLocaleString('es-ES')} km</p>
                    </div>
                    <p className="text-xs font-semibold text-jaecoo-electric shrink-0">{formatCurrency(c.totalPrice)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent refuels */}
          <div className="bg-jaecoo-card border border-jaecoo-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-jaecoo-primary">Últimos repostajes</h2>
              <Link to="/repostajes" className="text-xs text-jaecoo-fuel hover:text-jaecoo-fuel/80 flex items-center gap-0.5 transition-colors">Ver todos <ChevronRight size={12} /></Link>
            </div>
            {recentRefuels.length === 0 ? (
              <p className="text-xs text-jaecoo-muted py-8 text-center">Sin repostajes</p>
            ) : (
              <div className="space-y-2">
                {recentRefuels.map(r => (
                  <div key={r.id} className="flex items-center gap-3 py-2 border-b border-jaecoo-border last:border-0">
                    <div className="bg-jaecoo-fuel-dim text-jaecoo-fuel rounded-lg p-1.5 shrink-0">
                      <Fuel size={13} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-jaecoo-primary truncate">{r.stationName}</p>
                      <p className="text-[11px] text-jaecoo-muted">{formatDate(r.date)} · {r.liters} L · {formatNumber(r.pricePerLiter, 3)} €/L</p>
                    </div>
                    <p className="text-xs font-semibold text-jaecoo-fuel shrink-0">{formatCurrency(r.totalPrice)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
