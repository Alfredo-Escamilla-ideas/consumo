import { useData } from '../context/DataContext'
import {
  calcElectricStats,
  calcFuelStats,
  calcCombinedStats,
  getMonthlyData,
  getFuelConsumptionPerRefuel,
  getElectricEfficiencyPerCharge,
  getChargingStationRanking,
  getFuelStationRanking,
  formatCurrency,
  formatNumber,
  formatDate,
} from '../utils/calculations'
import StatCard from '../components/StatCard'
import {
  Zap, Fuel, Euro, Route, Leaf, TrendingUp, BarChart3, Droplets, Battery, Trophy, MapPin
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts'

const COLORS_EL = '#3b82f6'
const COLORS_FU = '#f97316'
const COLORS_CO = '#8b5cf6'

export default function Statistics() {
  const { data } = useData()
  const { electricCharges, fuelRefuels } = data

  const elStats = calcElectricStats(electricCharges)
  const fuStats = calcFuelStats(fuelRefuels)
  const combined = calcCombinedStats(electricCharges, fuelRefuels)
  const monthly = getMonthlyData(electricCharges, fuelRefuels)
  const fuelConsPerRefuel = getFuelConsumptionPerRefuel(fuelRefuels)
  const elEffPerCharge = getElectricEfficiencyPerCharge(electricCharges)
  const chargingRanking = getChargingStationRanking(electricCharges)
  const fuelRanking = getFuelStationRanking(fuelRefuels)

  const hasData = electricCharges.length > 0 || fuelRefuels.length > 0

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400 text-sm">Añade datos para ver estadísticas</p>
      </div>
    )
  }

  const splitPie = [
    { name: 'Eléctrico', value: Math.round(combined.electricKmPercent), color: COLORS_EL },
    { name: 'Gasolina', value: Math.round(combined.fuelKmPercent), color: COLORS_FU },
  ].filter(d => d.value > 0)

  const costSplitPie = [
    { name: 'Electricidad', value: combined.totalElectricCost, color: COLORS_EL },
    { name: 'Gasolina', value: combined.totalFuelCost, color: COLORS_FU },
  ].filter(d => d.value > 0)

  // Wailet savings: difference between avg market price (~0.35€/kWh) and actual Wailet price
  const avgWailetPrice = electricCharges.length > 0
    ? electricCharges.reduce((s, c) => s + c.pricePerKWh, 0) / electricCharges.length
    : 0
  const marketPriceEstimate = 0.35
  const wailetSavings = electricCharges.reduce((s, c) => s + c.kWh * (marketPriceEstimate - c.pricePerKWh), 0)

  // Cumulative cost data
  const cumulativeData = monthly.reduce<{ label: string; total: number }[]>((acc, m) => {
    const prev = acc.length > 0 ? acc[acc.length - 1].total : 0
    acc.push({ label: m.label, total: Math.round((prev + m.totalCost) * 100) / 100 })
    return acc
  }, [])

  return (
    <div className="space-y-6">
      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard title="Km eléctricos" value={`${formatNumber(elStats.totalKm, 0)}`} subtitle="km" icon={Zap} color="blue" />
        <StatCard title="Km gasolina" value={`${formatNumber(fuStats.totalKm, 0)}`} subtitle="km" icon={Fuel} color="orange" />
        <StatCard title="kWh/100km" value={formatNumber(elStats.avgEfficiency)} icon={Battery} color="blue" />
        <StatCard title="L/100km" value={formatNumber(fuStats.avgConsumption)} icon={Droplets} color="orange" />
        <StatCard title="€/km eléctrico" value={formatNumber(elStats.avgCostPerKm, 3)} icon={Euro} color="violet" />
        <StatCard title="CO₂ ahorrado" value={`${formatNumber(combined.estimatedCO2SavedKg, 0)} kg`} icon={Leaf} color="emerald" />
      </div>

      {/* Monthly cost bar chart */}
      {monthly.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-slate-400" /> Coste mensual (€)
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthly} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `${v}€`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend formatter={v => <span className="text-xs">{v}</span>} />
              <Bar dataKey="electricCost" name="Electricidad" fill={COLORS_EL} radius={[4,4,0,0]} />
              <Bar dataKey="fuelCost" name="Gasolina" fill={COLORS_FU} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Fuel consumption trend */}
        {fuelConsPerRefuel.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Fuel size={16} className="text-orange-400" /> Consumo gasolina por repostaje (L/100km)
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={fuelConsPerRefuel}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => `${v}L`} />
                <Tooltip formatter={(v: number) => [`${v} L/100km`, 'Consumo']} />
                <Line type="monotone" dataKey="consumption" stroke={COLORS_FU} strokeWidth={2} dot={{ r: 4, fill: COLORS_FU }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Electric efficiency trend */}
        {elEffPerCharge.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Zap size={16} className="text-blue-400" /> Eficiencia eléctrica por recarga (kWh/100km)
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={elEffPerCharge}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => `${v}`} />
                <Tooltip formatter={(v: number) => [`${v} kWh/100km`, 'Eficiencia']} />
                <Line type="monotone" dataKey="efficiency" stroke={COLORS_EL} strokeWidth={2} dot={{ r: 4, fill: COLORS_EL }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Monthly km split */}
        {monthly.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Route size={16} className="text-slate-400" /> Kilómetros mensuales por fuente
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `${v}km`} />
                <Tooltip formatter={(v: number) => [`${v} km`]} />
                <Legend formatter={v => <span className="text-xs">{v}</span>} />
                <Area type="monotone" dataKey="electricKm" name="Eléctrico" stackId="1" stroke={COLORS_EL} fill="#bfdbfe" />
                <Area type="monotone" dataKey="fuelKm" name="Gasolina" stackId="1" stroke={COLORS_FU} fill="#fed7aa" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Cumulative cost */}
        {cumulativeData.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-violet-400" /> Gasto acumulado total (€)
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={cumulativeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `${v}€`} />
                <Tooltip formatter={(v: number) => [formatCurrency(v), 'Total acumulado']} />
                <Area type="monotone" dataKey="total" stroke={COLORS_CO} fill="#ede9fe" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Pie charts row */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Reparto km (eléctrico vs gasolina)</h2>
          {splitPie.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={splitPie} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}%`} labelLine={false}>
                  {splitPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-xs text-slate-400 text-center py-12">Sin datos</p>}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Reparto gasto (electricidad vs gasolina)</h2>
          {costSplitPie.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={costSplitPie} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${formatCurrency(value)}`} labelLine={false}>
                  {costSplitPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-xs text-slate-400 text-center py-12">Sin datos</p>}
        </div>
      </div>

      {/* Wailet summary */}
      {electricCharges.length > 0 && (
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white">
          <h2 className="text-sm font-semibold text-blue-100 mb-4 flex items-center gap-2">
            <Zap size={16} /> Resumen Wailet
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-blue-200">Total recargas</p>
              <p className="text-2xl font-bold">{electricCharges.length}</p>
            </div>
            <div>
              <p className="text-xs text-blue-200">Total kWh</p>
              <p className="text-2xl font-bold">{formatNumber(elStats.totalKWh)}</p>
            </div>
            <div>
              <p className="text-xs text-blue-200">€/kWh medio (Wailet)</p>
              <p className="text-2xl font-bold">{formatNumber(avgWailetPrice, 4)}</p>
            </div>
            <div>
              <p className="text-xs text-blue-200">Ahorro vs tarifa est. ({marketPriceEstimate}€/kWh)</p>
              <p className={`text-2xl font-bold ${wailetSavings >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                {wailetSavings >= 0 ? '+' : ''}{formatCurrency(wailetSavings)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Station rankings */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Charging station ranking */}
        {chargingRanking.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2">
              <Trophy size={15} className="text-blue-400" /> Ranking puntos de carga
            </h2>
            <p className="text-xs text-slate-400 mb-4">De más barato a más caro (€/kWh medio)</p>
            <div className="space-y-2">
              {chargingRanking.map((s, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${i === 0 ? 'bg-emerald-50 border-emerald-100' : i === chargingRanking.length - 1 && chargingRanking.length > 1 ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                  <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                    ${i === 0 ? 'bg-emerald-500 text-white' : i === chargingRanking.length - 1 && chargingRanking.length > 1 ? 'bg-red-400 text-white' : 'bg-slate-300 text-slate-700'}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{s.name}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 truncate"><MapPin size={10} />{s.address}</p>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">{formatNumber(s.avgPrice, 4)} €/kWh</span>
                      <span className="text-xs text-slate-500">{s.visits} visita{s.visits !== 1 ? 's' : ''}</span>
                      <span className="text-xs text-slate-500">{formatNumber(s.totalUnits)} kWh</span>
                      <span className="text-xs text-slate-500">{formatCurrency(s.totalSpent)}</span>
                      <span className="text-xs text-slate-400">Última: {formatDate(s.lastVisit)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fuel station ranking */}
        {fuelRanking.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2">
              <Trophy size={15} className="text-orange-400" /> Ranking gasolineras
            </h2>
            <p className="text-xs text-slate-400 mb-4">De más barata a más cara (€/litro medio)</p>
            <div className="space-y-2">
              {fuelRanking.map((s, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${i === 0 ? 'bg-emerald-50 border-emerald-100' : i === fuelRanking.length - 1 && fuelRanking.length > 1 ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                  <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                    ${i === 0 ? 'bg-emerald-500 text-white' : i === fuelRanking.length - 1 && fuelRanking.length > 1 ? 'bg-red-400 text-white' : 'bg-slate-300 text-slate-700'}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{s.name}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 truncate"><MapPin size={10} />{s.address}</p>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      <span className="text-xs font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full">{formatNumber(s.avgPrice, 3)} €/L</span>
                      <span className="text-xs text-slate-500">{s.visits} visita{s.visits !== 1 ? 's' : ''}</span>
                      <span className="text-xs text-slate-500">{formatNumber(s.totalUnits)} L</span>
                      <span className="text-xs text-slate-500">{formatCurrency(s.totalSpent)}</span>
                      <span className="text-xs text-slate-400">Última: {formatDate(s.lastVisit)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Detailed summary table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Resumen detallado</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Electric */}
          <div>
            <h3 className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Zap size={12} /> Electricidad
            </h3>
            <dl className="space-y-2">
              <Row label="Recargas totales" value={String(elStats.totalCharges)} />
              <Row label="kWh totales" value={`${formatNumber(elStats.totalKWh)} kWh`} />
              <Row label="Gasto total" value={formatCurrency(elStats.totalCost)} />
              <Row label="Media kWh por recarga" value={`${formatNumber(elStats.avgChargeKWh)} kWh`} />
              <Row label="% batería medio cargado" value={`${formatNumber(elStats.avgChargePercent)} %`} />
              <Row label="Km eléctricos totales" value={`${formatNumber(elStats.totalKm, 0)} km`} />
              <Row label="Km medios por recarga" value={`${formatNumber(elStats.avgKmPerCharge, 0)} km`} />
              <Row label="Eficiencia media" value={`${formatNumber(elStats.avgEfficiency)} kWh/100km`} />
              <Row label="Coste medio/km" value={`${formatNumber(elStats.avgCostPerKm, 4)} €/km`} />
            </dl>
          </div>
          {/* Fuel */}
          <div>
            <h3 className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Fuel size={12} /> Gasolina
            </h3>
            <dl className="space-y-2">
              <Row label="Repostajes totales" value={String(fuStats.totalRefuels)} />
              <Row label="Litros totales" value={`${formatNumber(fuStats.totalLiters)} L`} />
              <Row label="Gasto total" value={formatCurrency(fuStats.totalCost)} />
              <Row label="Litros medios por repostaje" value={`${formatNumber(fuStats.avgFillLiters)} L`} />
              <Row label="Precio medio/litro" value={`${formatNumber(fuStats.avgPricePerLiter, 3)} €/L`} />
              <Row label="Km gasolina totales" value={`${formatNumber(fuStats.totalKm, 0)} km`} />
              <Row label="Consumo medio" value={`${formatNumber(fuStats.avgConsumption)} L/100km`} />
              <Row label="Coste medio/km" value={`${formatNumber(fuStats.avgCostPerKm, 4)} €/km`} />
            </dl>
          </div>
        </div>
        <div className="mt-5 pt-5 border-t border-slate-100">
          <h3 className="text-xs font-semibold text-violet-600 uppercase tracking-wide mb-3">Combinado</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <Row label="Km totales" value={`${formatNumber(combined.totalKm, 0)} km`} />
            <Row label="Gasto total" value={formatCurrency(combined.totalCost)} />
            <Row label="Coste medio/km" value={`${formatNumber(combined.avgCostPerKm, 4)} €/km`} />
            <Row label="% km eléctrico" value={`${formatNumber(combined.electricKmPercent, 1)} %`} />
            <Row label="% km gasolina" value={`${formatNumber(combined.fuelKmPercent, 1)} %`} />
            <Row label="CO₂ ahorrado (est.)" value={`${formatNumber(combined.estimatedCO2SavedKg, 1)} kg`} />
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-slate-50 last:border-0">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="text-xs font-semibold text-slate-700">{value}</dd>
    </div>
  )
}
