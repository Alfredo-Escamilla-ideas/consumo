import { Link } from 'react-router-dom'
import { Zap, Fuel, Euro, Route, Leaf, TrendingUp, ChevronRight, Loader2 } from 'lucide-react'
import { useData } from '../context/DataContext'
import StatCard from '../components/StatCard'
import {
  calcElectricStats,
  calcFuelStats,
  calcCombinedStats,
  formatDate,
  formatCurrency,
  formatNumber,
} from '../utils/calculations'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function Dashboard() {
  const { data, isLoading } = useData()
  const { electricCharges, fuelRefuels } = data

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    )
  }

  const elStats = calcElectricStats(electricCharges)
  const fuStats = calcFuelStats(fuelRefuels)
  const combined = calcCombinedStats(electricCharges, fuelRefuels)

  const recentCharges = [...electricCharges].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4)
  const recentRefuels = [...fuelRefuels].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4)

  const hasData = electricCharges.length > 0 || fuelRefuels.length > 0

  const pieData = [
    { name: 'Eléctrico', value: combined.totalElectricCost, color: '#3b82f6' },
    { name: 'Gasolina', value: combined.totalFuelCost, color: '#f97316' },
  ].filter(d => d.value > 0)

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="Km totales" value={`${formatNumber(combined.totalKm, 0)} km`} icon={Route} color="slate" />
        <StatCard title="Gasto total" value={formatCurrency(combined.totalCost)} icon={Euro} color="violet" />
        <StatCard title="Coste/km" value={`${formatNumber(combined.avgCostPerKm, 3)} €`} icon={TrendingUp} color="slate" />
        <StatCard title="Total eléctrico" value={formatCurrency(elStats.totalCost)} subtitle={`${formatNumber(elStats.totalKWh)} kWh`} icon={Zap} color="blue" />
        <StatCard title="Total gasolina" value={formatCurrency(fuStats.totalCost)} subtitle={`${formatNumber(fuStats.totalLiters)} L`} icon={Fuel} color="orange" />
        <StatCard title="CO₂ ahorrado" value={`${formatNumber(combined.estimatedCO2SavedKg, 0)} kg`} subtitle="vs solo gasolina" icon={Leaf} color="emerald" />
      </div>

      {!hasData && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <p className="text-slate-500 text-sm mb-4">Aún no tienes datos. Añade tu primera recarga o repostaje.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link to="/recargas" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              <Zap size={14} /> Nueva recarga
            </Link>
            <Link to="/repostajes" className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">
              <Fuel size={14} /> Nuevo repostaje
            </Link>
          </div>
        </div>
      )}

      {hasData && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Split chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Reparto del gasto</h2>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend formatter={(v) => <span className="text-xs text-slate-600">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400 text-center py-12">Sin datos</p>
            )}
            <div className="mt-3 grid grid-cols-2 gap-3 text-center">
              <div className="bg-blue-50 rounded-xl p-2">
                <p className="text-xs text-slate-500">Eléctrico</p>
                <p className="text-sm font-bold text-blue-700">{formatNumber(combined.electricKmPercent, 1)}%</p>
                <p className="text-xs text-slate-500">{formatNumber(elStats.totalKm, 0)} km</p>
              </div>
              <div className="bg-orange-50 rounded-xl p-2">
                <p className="text-xs text-slate-500">Gasolina</p>
                <p className="text-sm font-bold text-orange-700">{formatNumber(combined.fuelKmPercent, 1)}%</p>
                <p className="text-xs text-slate-500">{formatNumber(fuStats.totalKm, 0)} km</p>
              </div>
            </div>
          </div>

          {/* Recent charges */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-700">Últimas recargas</h2>
              <Link to="/recargas" className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-0.5">Ver todas <ChevronRight size={12} /></Link>
            </div>
            {recentCharges.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">Sin recargas</p>
            ) : (
              <div className="space-y-2">
                {recentCharges.map(c => {
                  const km = c.odometerEnd - c.odometerStart
                  return (
                    <div key={c.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                      <div className="bg-blue-100 text-blue-600 rounded-lg p-1.5 shrink-0">
                        <Zap size={13} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-700 truncate">{c.stationName}</p>
                        <p className="text-[11px] text-slate-400">{formatDate(c.date)} · {c.kWh} kWh{km > 0 ? ` · ${km} km` : ''}</p>
                      </div>
                      <p className="text-xs font-semibold text-slate-600 shrink-0">{formatCurrency(c.totalPrice)}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Recent refuels */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-700">Últimos repostajes</h2>
              <Link to="/repostajes" className="text-xs text-orange-600 hover:text-orange-800 flex items-center gap-0.5">Ver todos <ChevronRight size={12} /></Link>
            </div>
            {recentRefuels.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">Sin repostajes</p>
            ) : (
              <div className="space-y-2">
                {recentRefuels.map(r => (
                  <div key={r.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                    <div className="bg-orange-100 text-orange-600 rounded-lg p-1.5 shrink-0">
                      <Fuel size={13} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate">{r.stationName}</p>
                      <p className="text-[11px] text-slate-400">{formatDate(r.date)} · {r.liters} L · {formatNumber(r.pricePerLiter, 3)} €/L</p>
                    </div>
                    <p className="text-xs font-semibold text-slate-600 shrink-0">{formatCurrency(r.totalPrice)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary stats row */}
      {hasData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-600 text-white rounded-2xl p-4">
            <p className="text-xs text-blue-200 uppercase tracking-wide">Eficiencia eléctrica</p>
            <p className="text-2xl font-bold mt-1">{formatNumber(elStats.avgEfficiency)}</p>
            <p className="text-xs text-blue-200">kWh / 100 km</p>
          </div>
          <div className="bg-orange-500 text-white rounded-2xl p-4">
            <p className="text-xs text-orange-200 uppercase tracking-wide">Consumo gasolina</p>
            <p className="text-2xl font-bold mt-1">{formatNumber(fuStats.avgConsumption)}</p>
            <p className="text-xs text-orange-200">L / 100 km</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Coste eléctrico/km</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">{formatNumber(elStats.avgCostPerKm, 3)}</p>
            <p className="text-xs text-slate-400">€ / km</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Coste gasolina/km</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">{formatNumber(fuStats.avgCostPerKm, 3)}</p>
            <p className="text-xs text-slate-400">€ / km</p>
          </div>
        </div>
      )}
    </div>
  )
}
