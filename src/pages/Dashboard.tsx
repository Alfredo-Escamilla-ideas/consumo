import { Link } from 'react-router-dom'
import { Zap, Fuel, Euro, Route, Leaf, TrendingUp, ChevronRight, Loader2, BatteryCharging, Gauge, PiggyBank } from 'lucide-react'
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
  EL_MAX_RANGE_KM,
  FUEL_MAX_RANGE_KM,
} from '../utils/calculations'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const TOOLTIP_STYLE = {
  contentStyle: { background: '#141c2e', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '12px', color: '#e2e8f0', fontSize: 12 },
  itemStyle: { color: '#94a3b8' },
  cursor: { fill: 'rgba(255,255,255,0.04)' },
}

export default function Dashboard() {
  const { data, isLoading } = useData()
  const { electricCharges, fuelRefuels } = data

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-jaecoo-electric" size={32} />
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
  const fuelRangeKm = lastRefuel
    ? Math.round(Math.max(0, lastRefuel.liters - litersUsedSince) / (avgCons / 100))
    : null

  const savedVsAllFuel = fuStats.avgCostPerKm > 0
    ? Math.max(0, (fuStats.avgCostPerKm - elStats.avgCostPerKm) * elStats.totalKm)
    : 0

  // Semáforo de Ahorro
  const hasBothData = elStats.totalKm > 0 && fuStats.totalKm > 0 && elStats.avgCostPerKm > 0 && fuStats.avgCostPerKm > 0
  const savingsRatio = hasBothData ? 1 - (elStats.avgCostPerKm / fuStats.avgCostPerKm) : null
  const semaforo = savingsRatio === null ? null
    : savingsRatio >= 0.5
      ? { color: 'emerald', dot: 'bg-emerald-400', msg: `Ahorro excelente — el eléctrico te sale un ${Math.round(savingsRatio * 100)}% más barato que la gasolina`, detail: `${formatNumber(elStats.avgCostPerKm, 4)} vs ${formatNumber(fuStats.avgCostPerKm, 4)} €/km`, badge: '¡Muy eficiente!' }
      : savingsRatio >= 0.2
        ? { color: 'yellow', dot: 'bg-yellow-400', msg: `Buen ahorro — el eléctrico es un ${Math.round(savingsRatio * 100)}% más barato`, detail: `${formatNumber(elStats.avgCostPerKm, 4)} vs ${formatNumber(fuStats.avgCostPerKm, 4)} €/km`, badge: 'Buen ritmo' }
        : savingsRatio > 0
          ? { color: 'orange', dot: 'bg-orange-400', msg: `Ahorro moderado — recarga más para maximizar`, detail: `${formatNumber(elStats.avgCostPerKm, 4)} vs ${formatNumber(fuStats.avgCostPerKm, 4)} €/km`, badge: 'Mejorable' }
          : { color: 'rose', dot: 'bg-rose-400', msg: `La gasolina sale más barata por km — revisa tarifas de carga`, detail: `${formatNumber(elStats.avgCostPerKm, 4)} vs ${formatNumber(fuStats.avgCostPerKm, 4)} €/km`, badge: 'Ojo' }

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
          <Link to="/estadisticas" className="bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40 hover:shadow-[0_0_24px_rgba(16,185,129,0.2)] rounded-2xl p-4 transition-all group">
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
      {semaforo && (
        <div className={`bg-jaecoo-card border rounded-2xl p-4 flex items-center gap-4
          ${semaforo.color === 'emerald' ? 'border-emerald-500/20' : semaforo.color === 'yellow' ? 'border-yellow-400/20' : semaforo.color === 'orange' ? 'border-orange-400/20' : 'border-rose-400/20'}`}>
          {/* Traffic light dot */}
          <div className="shrink-0 flex flex-col items-center gap-1.5">
            {['emerald', 'yellow', 'orange', 'rose'].map(c => (
              <div key={c} className={`w-3 h-3 rounded-full transition-all ${semaforo.color === c ? semaforo.dot + ' shadow-lg' : 'bg-jaecoo-elevated'}`} />
            ))}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-sm font-semibold text-jaecoo-primary">Semáforo de Ahorro</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full
                ${semaforo.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' : semaforo.color === 'yellow' ? 'bg-yellow-400/20 text-yellow-400' : semaforo.color === 'orange' ? 'bg-orange-400/20 text-orange-400' : 'bg-rose-400/20 text-rose-400'}`}>
                {semaforo.badge}
              </span>
            </div>
            <p className="text-xs text-jaecoo-secondary">{semaforo.msg}</p>
            <p className="text-[11px] text-jaecoo-muted mt-0.5">{semaforo.detail}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className={`text-2xl font-bold ${semaforo.color === 'emerald' ? 'text-emerald-400' : semaforo.color === 'yellow' ? 'text-yellow-400' : semaforo.color === 'orange' ? 'text-orange-400' : 'text-rose-400'}`}>
              {formatCurrency(savedVsAllFuel)}
            </p>
            <p className="text-[10px] text-jaecoo-muted">ahorrado</p>
          </div>
        </div>
      )}

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
              <Link to="/recargas" className="text-xs text-jaecoo-electric hover:text-jaecoo-electric/80 flex items-center gap-0.5">Ver todas <ChevronRight size={12} /></Link>
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
              <Link to="/repostajes" className="text-xs text-jaecoo-fuel hover:text-jaecoo-fuel/80 flex items-center gap-0.5">Ver todos <ChevronRight size={12} /></Link>
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
