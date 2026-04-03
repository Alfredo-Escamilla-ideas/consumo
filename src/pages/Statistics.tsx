import { useData } from '../context/DataContext'
import {
  calcElectricStats,
  calcFuelStats,
  calcCombinedStats,
  getMonthlyData,
  getFuelConsumptionPerRefuel,
  getElectricEfficiencyPerCharge,
  getWayletEffectivePriceHistory,
  getChargingStationRanking,
  getFuelStationRanking,
  getStatsByDrivingMode,
  formatCurrency,
  formatNumber,
  formatDate,
} from '../utils/calculations'
import StatCard from '../components/StatCard'
import { calcBatteryHealthSummary } from '../utils/calculations'
import {
  Zap, Fuel, Euro, Route, Leaf, TrendingUp, BarChart3, Droplets, Battery, Trophy, MapPin, Navigation
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts'

const COLORS_EL = '#22d3ee'
const COLORS_FU = '#fb923c'
const COLORS_CO = '#8b5cf6'
const GRID_COLOR = '#1b2438'
const TICK_COLOR = '#475569'

const TOOLTIP = {
  contentStyle: { background: '#141c2e', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '12px', color: '#e2e8f0', fontSize: 12 },
  itemStyle: { color: '#94a3b8' },
  cursor: { fill: 'rgba(255,255,255,0.04)' },
}

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
  const modeStats = getStatsByDrivingMode(electricCharges, fuelRefuels)
  const wayletPriceHistory = getWayletEffectivePriceHistory(electricCharges)

  const hasData = electricCharges.length > 0 || fuelRefuels.length > 0

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-jaecoo-muted text-sm">Añade datos para ver estadísticas</p>
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

  const cumulativeData = monthly.reduce<{ label: string; total: number }[]>((acc, m) => {
    const prev = acc.length > 0 ? acc[acc.length - 1].total : 0
    acc.push({ label: m.label, total: Math.round((prev + m.totalCost) * 100) / 100 })
    return acc
  }, [])

  const NAV_SECTIONS = [
    { href: '#mensual',    label: 'Mensual' },
    { href: '#eficiencia', label: 'Eficiencia' },
    { href: '#reparto',    label: 'Reparto' },
    { href: '#waylet',     label: 'Waylet' },
    { href: '#trayectos',  label: 'Trayectos' },
    { href: '#rankings',   label: 'Rankings' },
    { href: '#detalle',    label: 'Detalle' },
    { href: '#bateria',    label: 'Batería' },
  ]

  return (
    <div className="space-y-6">
      {/* Sticky section nav */}
      <nav className="sticky top-16 z-10 -mx-4 md:-mx-6 px-4 md:px-6 bg-jaecoo-surface backdrop-blur border-b border-jaecoo-border">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide py-2 max-w-6xl">
          {NAV_SECTIONS.map(s => (
            <a
              key={s.href}
              href={s.href}
              className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium text-jaecoo-muted hover:bg-jaecoo-elevated hover:text-jaecoo-secondary transition-colors"
            >
              {s.label}
            </a>
          ))}
        </div>
      </nav>

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
        <div id="mensual" className="bg-jaecoo-card border border-jaecoo-border rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-jaecoo-primary mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-jaecoo-muted" /> Coste mensual (€)
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthly} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: TICK_COLOR }} />
              <YAxis tick={{ fontSize: 11, fill: TICK_COLOR }} tickFormatter={v => `${v}€`} />
              <Tooltip {...TOOLTIP} formatter={(v: number) => formatCurrency(v)} />
              <Legend formatter={v => <span className="text-xs text-jaecoo-secondary">{v}</span>} />
              <Bar dataKey="electricCost" name="Electricidad" fill={COLORS_EL} radius={[4,4,0,0]} />
              <Bar dataKey="fuelCost" name="Gasolina" fill={COLORS_FU} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div id="eficiencia" className="grid lg:grid-cols-2 gap-6">
        {fuelConsPerRefuel.length > 0 && (
          <div className="bg-jaecoo-card border border-jaecoo-border rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-jaecoo-primary mb-4 flex items-center gap-2">
              <Fuel size={16} className="text-jaecoo-fuel" /> Consumo gasolina por repostaje (L/100km)
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={fuelConsPerRefuel}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: TICK_COLOR }} />
                <YAxis tick={{ fontSize: 10, fill: TICK_COLOR }} tickFormatter={v => `${v}L`} />
                <Tooltip {...TOOLTIP} formatter={(v: number) => [`${v} L/100km`, 'Consumo']} />
                <Line type="monotone" dataKey="consumption" stroke={COLORS_FU} strokeWidth={2} dot={{ r: 4, fill: COLORS_FU }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {elEffPerCharge.length > 0 && (
          <div className="bg-jaecoo-card border border-jaecoo-border rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-jaecoo-primary mb-4 flex items-center gap-2">
              <Zap size={16} className="text-jaecoo-electric" /> Eficiencia eléctrica por recarga (kWh/100km)
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={elEffPerCharge}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: TICK_COLOR }} />
                <YAxis tick={{ fontSize: 10, fill: TICK_COLOR }} />
                <Tooltip {...TOOLTIP} formatter={(v: number) => [`${v} kWh/100km`, 'Eficiencia']} />
                <Line type="monotone" dataKey="efficiency" stroke={COLORS_EL} strokeWidth={2} dot={{ r: 4, fill: COLORS_EL }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {monthly.length > 0 && (
          <div className="bg-jaecoo-card border border-jaecoo-border rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-jaecoo-primary mb-4 flex items-center gap-2">
              <Route size={16} className="text-jaecoo-muted" /> Kilómetros mensuales por fuente
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: TICK_COLOR }} />
                <YAxis tick={{ fontSize: 11, fill: TICK_COLOR }} tickFormatter={v => `${v}km`} />
                <Tooltip {...TOOLTIP} formatter={(v: number) => [`${v} km`]} />
                <Legend formatter={v => <span className="text-xs text-jaecoo-secondary">{v}</span>} />
                <Area type="monotone" dataKey="electricKm" name="Eléctrico" stackId="1" stroke={COLORS_EL} fill={`${COLORS_EL}22`} />
                <Area type="monotone" dataKey="fuelKm" name="Gasolina" stackId="1" stroke={COLORS_FU} fill={`${COLORS_FU}22`} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {cumulativeData.length > 0 && (
          <div className="bg-jaecoo-card border border-jaecoo-border rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-jaecoo-primary mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-violet-400" /> Gasto acumulado total (€)
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={cumulativeData}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: TICK_COLOR }} />
                <YAxis tick={{ fontSize: 11, fill: TICK_COLOR }} tickFormatter={v => `${v}€`} />
                <Tooltip {...TOOLTIP} formatter={(v: number) => [formatCurrency(v), 'Total acumulado']} />
                <Area type="monotone" dataKey="total" stroke={COLORS_CO} fill={`${COLORS_CO}22`} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Pie charts row */}
      <div id="reparto" className="grid md:grid-cols-2 gap-6">
        <div className="bg-jaecoo-card border border-jaecoo-border rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-jaecoo-primary mb-4">Reparto km (eléctrico vs gasolina)</h2>
          {splitPie.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={splitPie} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}%`} labelLine={false}>
                  {splitPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip {...TOOLTIP} formatter={(v: number) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-xs text-jaecoo-muted text-center py-12">Sin datos</p>}
        </div>

        <div className="bg-jaecoo-card border border-jaecoo-border rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-jaecoo-primary mb-4">Reparto gasto (electricidad vs gasolina)</h2>
          {costSplitPie.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={costSplitPie} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${formatCurrency(value)}`} labelLine={false}>
                  {costSplitPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip {...TOOLTIP} formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-xs text-jaecoo-muted text-center py-12">Sin datos</p>}
        </div>
      </div>

      {/* Waylet summary */}
      <div id="waylet" />
      {electricCharges.length > 0 && (() => {
        const withWaylet = electricCharges.filter(c => c.wayletBefore != null)
        const totalGross = electricCharges.reduce((s, c) => s + (c.totalPriceGross ?? c.totalPrice), 0)
        const totalCash  = electricCharges.reduce((s, c) => s + c.totalPrice, 0)
        const totalWayletUsed = totalGross - totalCash
        const totalWayletReturn = withWaylet.reduce((s, c) => {
          const gross = c.totalPriceGross ?? c.totalPrice
          return s + gross * 0.5
        }, 0)
        const avgEffectivePerKWh = elStats.totalKWh > 0 ? totalCash / elStats.totalKWh : 0
        const avgTariffPerKWh = electricCharges.reduce((s, c) => s + c.pricePerKWh, 0) / electricCharges.length

        return (
          <div className="bg-jaecoo-electric-dim border border-jaecoo-electric/20 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-jaecoo-electric mb-4 flex items-center gap-2">
              <Zap size={16} /> 💳 Resumen Waylet
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-jaecoo-electric/60">Total kWh recargados</p>
                <p className="text-2xl font-bold text-jaecoo-electric">{formatNumber(elStats.totalKWh)}</p>
              </div>
              <div>
                <p className="text-xs text-jaecoo-electric/60">Coste bruto total</p>
                <p className="text-2xl font-bold text-jaecoo-primary">{formatCurrency(totalGross)}</p>
              </div>
              <div>
                <p className="text-xs text-jaecoo-electric/60">Saldo Waylet utilizado</p>
                <p className="text-2xl font-bold text-jaecoo-fuel">{formatCurrency(totalWayletUsed)}</p>
              </div>
              <div>
                <p className="text-xs text-jaecoo-electric/60">Dinero real pagado</p>
                <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalCash)}</p>
              </div>
              {withWaylet.length > 0 && <>
                <div>
                  <p className="text-xs text-jaecoo-electric/60">Retorno Waylet acumulado</p>
                  <p className="text-2xl font-bold text-emerald-400">+{formatCurrency(totalWayletReturn)}</p>
                </div>
                <div>
                  <p className="text-xs text-jaecoo-electric/60">Tarifa media €/kWh</p>
                  <p className="text-2xl font-bold text-jaecoo-primary">{formatNumber(avgTariffPerKWh, 3)}</p>
                </div>
                <div>
                  <p className="text-xs text-jaecoo-electric/60">Precio efectivo €/kWh</p>
                  <p className="text-2xl font-bold text-emerald-400">{formatNumber(avgEffectivePerKWh, 4)}</p>
                </div>
                <div>
                  <p className="text-xs text-jaecoo-electric/60">Ahorro real Waylet</p>
                  <p className="text-2xl font-bold text-emerald-400">+{formatCurrency(totalWayletUsed)}</p>
                </div>
              </>}
            </div>
          </div>
        )
      })()}

      {wayletPriceHistory.length > 1 && (
        <div className="bg-jaecoo-card border border-jaecoo-border rounded-2xl p-5" id="waylet-chart">
          <h2 className="text-sm font-semibold text-jaecoo-primary mb-1 flex items-center gap-2">
            <Zap size={16} className="text-jaecoo-electric" /> 💳 Evolución precio efectivo Waylet (€/kWh)
          </h2>
          <p className="text-xs text-jaecoo-muted mb-4">Tarifa publicada vs precio real pagado tras descontar saldo Waylet</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={wayletPriceHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: TICK_COLOR }} />
              <YAxis tick={{ fontSize: 10, fill: TICK_COLOR }} tickFormatter={v => `${v}€`} domain={['auto', 'auto']} />
              <Tooltip {...TOOLTIP} formatter={(v: number, name: string) => [`${v.toFixed(4)} €/kWh`, name === 'effective' ? 'Precio efectivo' : 'Tarifa']} />
              <Legend formatter={v => <span className="text-xs text-jaecoo-secondary">{v === 'effective' ? 'Precio efectivo' : 'Tarifa'}</span>} />
              <Line type="monotone" dataKey="tariff" name="tariff" stroke={TICK_COLOR} strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
              <Line type="monotone" dataKey="effective" name="effective" stroke={COLORS_EL} strokeWidth={2} dot={{ r: 4, fill: COLORS_EL }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Driving mode stats */}
      <div id="trayectos" />
      {modeStats.length > 0 && (() => {
        const cheapest = [...modeStats].filter(s => s.combinedCostPerKm > 0).sort((a, b) => a.combinedCostPerKm - b.combinedCostPerKm)[0]
        return (
          <div className="bg-jaecoo-card border border-jaecoo-border rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-jaecoo-primary mb-1 flex items-center gap-2">
              <Navigation size={15} className="text-violet-400" /> Consumo por tipo de trayecto
            </h2>
            <p className="text-xs text-jaecoo-muted mb-4">Basado en las condiciones de conducción registradas</p>
            <div className="grid sm:grid-cols-3 gap-4">
              {modeStats.map(s => {
                const isCheapest = cheapest && s.mode === cheapest.mode && s.combinedCostPerKm > 0
                return (
                  <div key={s.mode} className={`rounded-xl border p-4 ${isCheapest ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-jaecoo-elevated border-jaecoo-border'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl leading-none">{s.icon}</span>
                        <span className="font-semibold text-jaecoo-primary text-sm">{s.label}</span>
                      </div>
                      {isCheapest && (
                        <span className="text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full">+ eficiente</span>
                      )}
                    </div>

                    {s.elCharges > 0 && (
                      <div className="mb-2">
                        <p className="text-[10px] text-jaecoo-electric font-semibold uppercase tracking-wide mb-1 flex items-center gap-1">
                          <Zap size={9} /> Eléctrico · {s.elCharges} recarga{s.elCharges !== 1 ? 's' : ''}
                        </p>
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-jaecoo-muted">Eficiencia</span>
                            <span className="font-semibold text-jaecoo-primary">{formatNumber(s.elKWh100km)} kWh/100km</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-jaecoo-muted">Coste/km</span>
                            <span className="font-semibold text-jaecoo-electric">{formatNumber(s.elCostPerKm, 4)} €/km</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-jaecoo-muted">Km totales</span>
                            <span className="font-semibold text-jaecoo-secondary">{formatNumber(s.elTotalKm, 0)} km</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {s.fuRefuels > 0 && (
                      <div className={s.elCharges > 0 ? 'pt-2 border-t border-jaecoo-border mt-2' : ''}>
                        <p className="text-[10px] text-jaecoo-fuel font-semibold uppercase tracking-wide mb-1 flex items-center gap-1">
                          <Fuel size={9} /> Gasolina · {s.fuRefuels} repostaje{s.fuRefuels !== 1 ? 's' : ''}
                        </p>
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-jaecoo-muted">Consumo</span>
                            <span className="font-semibold text-jaecoo-primary">{formatNumber(s.fuL100km)} L/100km</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-jaecoo-muted">Coste/km</span>
                            <span className="font-semibold text-jaecoo-fuel">{formatNumber(s.fuCostPerKm, 4)} €/km</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-jaecoo-muted">Km totales</span>
                            <span className="font-semibold text-jaecoo-secondary">{formatNumber(s.fuTotalKm, 0)} km</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {s.combinedCostPerKm > 0 && (
                      <div className="mt-3 pt-2 border-t border-jaecoo-border">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-jaecoo-muted font-medium">Coste combinado/km</span>
                          <span className={`text-sm font-bold ${isCheapest ? 'text-emerald-400' : 'text-jaecoo-primary'}`}>
                            {formatNumber(s.combinedCostPerKm, 4)} €
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* Station rankings */}
      <div id="rankings" className="grid md:grid-cols-2 gap-6">
        {chargingRanking.length > 0 && (
          <div className="bg-jaecoo-card border border-jaecoo-border rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-jaecoo-primary mb-1 flex items-center gap-2">
              <Trophy size={15} className="text-jaecoo-electric" /> Ranking puntos de carga
            </h2>
            <p className="text-xs text-jaecoo-muted mb-4">De más barato a más caro (€/kWh medio)</p>
            <div className="space-y-2">
              {chargingRanking.map((s, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border
                  ${i === 0 ? 'bg-emerald-500/10 border-emerald-500/30' : i === chargingRanking.length - 1 && chargingRanking.length > 1 ? 'bg-jaecoo-danger/10 border-jaecoo-danger/20' : 'bg-jaecoo-elevated border-jaecoo-border'}`}>
                  <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                    ${i === 0 ? 'bg-emerald-500 text-white' : i === chargingRanking.length - 1 && chargingRanking.length > 1 ? 'bg-jaecoo-danger text-white' : 'bg-jaecoo-border-strong text-jaecoo-secondary'}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-jaecoo-primary truncate">{s.name}</p>
                    <p className="text-xs text-jaecoo-muted flex items-center gap-1 truncate"><MapPin size={10} />{s.address}</p>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      <span className="text-xs font-bold text-jaecoo-electric bg-jaecoo-electric-dim px-2 py-0.5 rounded-full">{formatNumber(s.avgPrice, 4)} €/kWh</span>
                      <span className="text-xs text-jaecoo-muted">{s.visits} visita{s.visits !== 1 ? 's' : ''}</span>
                      <span className="text-xs text-jaecoo-muted">{formatNumber(s.totalUnits)} kWh</span>
                      <span className="text-xs text-jaecoo-muted">{formatCurrency(s.totalSpent)}</span>
                      <span className="text-xs text-jaecoo-muted">Última: {formatDate(s.lastVisit)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {fuelRanking.length > 0 && (
          <div className="bg-jaecoo-card border border-jaecoo-border rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-jaecoo-primary mb-1 flex items-center gap-2">
              <Trophy size={15} className="text-jaecoo-fuel" /> Ranking gasolineras
            </h2>
            <p className="text-xs text-jaecoo-muted mb-4">De más barata a más cara (€/litro medio)</p>
            <div className="space-y-2">
              {fuelRanking.map((s, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border
                  ${i === 0 ? 'bg-emerald-500/10 border-emerald-500/30' : i === fuelRanking.length - 1 && fuelRanking.length > 1 ? 'bg-jaecoo-danger/10 border-jaecoo-danger/20' : 'bg-jaecoo-elevated border-jaecoo-border'}`}>
                  <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                    ${i === 0 ? 'bg-emerald-500 text-white' : i === fuelRanking.length - 1 && fuelRanking.length > 1 ? 'bg-jaecoo-danger text-white' : 'bg-jaecoo-border-strong text-jaecoo-secondary'}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-jaecoo-primary truncate">{s.name}</p>
                    <p className="text-xs text-jaecoo-muted flex items-center gap-1 truncate"><MapPin size={10} />{s.address}</p>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      <span className="text-xs font-bold text-jaecoo-fuel bg-jaecoo-fuel-dim px-2 py-0.5 rounded-full">{formatNumber(s.avgPrice, 3)} €/L</span>
                      <span className="text-xs text-jaecoo-muted">{s.visits} visita{s.visits !== 1 ? 's' : ''}</span>
                      <span className="text-xs text-jaecoo-muted">{formatNumber(s.totalUnits)} L</span>
                      <span className="text-xs text-jaecoo-muted">{formatCurrency(s.totalSpent)}</span>
                      <span className="text-xs text-jaecoo-muted">Última: {formatDate(s.lastVisit)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Detailed summary */}
      <div id="detalle" className="bg-jaecoo-card border border-jaecoo-border rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-jaecoo-primary mb-4">Resumen detallado</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xs font-semibold text-jaecoo-electric uppercase tracking-wide mb-3 flex items-center gap-1.5">
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
          <div>
            <h3 className="text-xs font-semibold text-jaecoo-fuel uppercase tracking-wide mb-3 flex items-center gap-1.5">
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
        <div className="mt-5 pt-5 border-t border-jaecoo-border">
          <h3 className="text-xs font-semibold text-violet-400 uppercase tracking-wide mb-3">Combinado</h3>
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

      {/* Puntuación Recargas */}
      {electricCharges.length > 0 && <ChargeScoreCard charges={electricCharges} />}
    </div>
  )
}

function ChargeScoreCard({ charges }: { charges: import('../types').ElectricCharge[] }) {
  const summary = calcBatteryHealthSummary(charges)
  if (summary.scoredCount === 0) return null

  const tiers = [
    { label: 'Óptima',  color: 'text-emerald-400', bar: 'bg-emerald-500', count: summary.records.filter(r => r.label === 'Óptima').length },
    { label: 'Buena',   color: 'text-jaecoo-electric', bar: 'bg-jaecoo-electric', count: summary.records.filter(r => r.label === 'Buena').length },
    { label: 'Regular', color: 'text-jaecoo-fuel',     bar: 'bg-jaecoo-fuel',     count: summary.records.filter(r => r.label === 'Regular').length },
    { label: 'Baja',    color: 'text-rose-400',        bar: 'bg-rose-500',        count: summary.records.filter(r => r.label === 'Baja').length },
  ]
  const scoreColor = summary.overall >= 80 ? 'text-emerald-400' : summary.overall >= 60 ? 'text-jaecoo-electric' : summary.overall >= 35 ? 'text-jaecoo-fuel' : 'text-rose-400'

  return (
    <div id="bateria" className="scroll-mt-28 bg-jaecoo-card border border-jaecoo-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-jaecoo-primary flex items-center gap-2">
          <Battery size={16} className="text-jaecoo-electric" /> Puntuación Recargas
        </h2>
        <div className="text-right">
          <span className={`text-2xl font-bold ${scoreColor}`}>{summary.overall}</span>
          <span className="text-xs text-jaecoo-muted"> / 100</span>
          <p className={`text-xs font-semibold ${scoreColor}`}>{summary.label}</p>
        </div>
      </div>

      <div className="space-y-2.5">
        {tiers.map(t => (
          <div key={t.label} className="flex items-center gap-3">
            <span className={`w-14 text-xs font-semibold shrink-0 ${t.color}`}>{t.label}</span>
            <div className="flex-1 h-2.5 bg-jaecoo-elevated rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${t.bar} transition-all`}
                style={{ width: summary.scoredCount > 0 ? `${(t.count / summary.scoredCount) * 100}%` : '0%' }}
              />
            </div>
            <span className="w-6 text-right text-xs font-bold text-jaecoo-secondary shrink-0">{t.count}</span>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-jaecoo-muted mt-3">
        {summary.scoredCount} recargas puntuadas · rango óptimo 20–80%
        {summary.scoredCount < summary.totalCount && ` · ${summary.totalCount - summary.scoredCount} sin datos`}
      </p>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-jaecoo-border last:border-0">
      <dt className="text-xs text-jaecoo-muted">{label}</dt>
      <dd className="text-xs font-semibold text-jaecoo-primary">{value}</dd>
    </div>
  )
}
