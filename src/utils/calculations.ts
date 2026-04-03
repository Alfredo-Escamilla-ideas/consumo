import type {
  ElectricCharge,
  FuelRefuel,
  ElectricStats,
  FuelStats,
  CombinedStats,
  MonthlyData,
  DrivingMode,
} from '../types'

export interface StationRank {
  name: string
  address: string
  avgPrice: number      // €/kWh o €/litro (media ponderada)
  visits: number
  totalSpent: number
  totalUnits: number    // kWh o litros
  lastVisit: string     // ISO date
}

export const BATTERY_CAPACITY_KWH = 18.3

// ── Autonomía máxima por tipo de propulsión (valores reales del Jaecoo 7 PHEV) ──
export const EL_MAX_RANGE_KM      = 105   // km eléctrico puro al 100% (con regen e inercia)
export const FUEL_MAX_RANGE_KM    = 700   // km en gasolina con depósito lleno
export const COMBINED_MAX_RANGE_KM = 1100  // km ciclo combinado eléctrico + gasolina

// CO2 gasoline: 2.31 kg/L; Spain grid CO2: ~0.18 kg/kWh (2024)
const CO2_PER_LITER = 2.31
const CO2_PER_KWH_GRID = 0.18

export function fmt2(n: number): number {
  return Math.round(n * 100) / 100
}

export function calcElectricStats(charges: ElectricCharge[]): ElectricStats {
  if (charges.length === 0) {
    return {
      totalKWh: 0, totalCost: 0, totalKm: 0, avgEfficiency: 0,
      avgCostPerKm: 0, avgChargeKWh: 0, avgKmPerCharge: 0,
      totalCharges: 0, batteryCapacity: BATTERY_CAPACITY_KWH, avgChargePercent: 0,
    }
  }

  // Sort by odometer ascending — consecutive diff method (like fuel full-tank)
  const sorted = [...charges].sort((a, b) => a.odometer - b.odometer)
  const totalKWh = sorted.reduce((s, c) => s + c.kWh, 0)
  const totalCost = sorted.reduce((s, c) => s + c.totalPrice, 0)
  const avgChargeKWh = totalKWh / sorted.length
  const avgChargePercent = (avgChargeKWh / BATTERY_CAPACITY_KWH) * 100

  // km and efficiency: calculated from consecutive pairs
  // efficiency[i] = sorted[i-1].kWh / km between i-1 and i
  let totalKm = 0
  let efficiencySum = 0
  let efficiencyCount = 0
  for (let i = 1; i < sorted.length; i++) {
    const km = sorted[i].odometer - sorted[i - 1].odometer
    if (km > 0) {
      totalKm += km
      efficiencySum += (sorted[i - 1].kWh / km) * 100
      efficiencyCount++
    }
  }

  const avgEfficiency = efficiencyCount > 0 ? efficiencySum / efficiencyCount : 0
  const avgCostPerKm = totalKm > 0 ? totalCost / totalKm : 0
  const avgKmPerCharge = efficiencyCount > 0 ? totalKm / efficiencyCount : 0

  return {
    totalKWh: fmt2(totalKWh),
    totalCost: fmt2(totalCost),
    totalKm: fmt2(totalKm),
    avgEfficiency: fmt2(avgEfficiency),
    avgCostPerKm: fmt2(avgCostPerKm),
    avgChargeKWh: fmt2(avgChargeKWh),
    avgKmPerCharge: fmt2(avgKmPerCharge),
    totalCharges: sorted.length,
    batteryCapacity: BATTERY_CAPACITY_KWH,
    avgChargePercent: fmt2(avgChargePercent),
  }
}

export function calcFuelStats(refuels: FuelRefuel[]): FuelStats {
  if (refuels.length === 0) {
    return {
      totalLiters: 0,
      totalCost: 0,
      totalKm: 0,
      avgConsumption: 0,
      avgCostPerKm: 0,
      avgFillLiters: 0,
      totalRefuels: 0,
      avgPricePerLiter: 0,
    }
  }

  const sorted = [...refuels].sort((a, b) => a.odometer - b.odometer)
  const totalLiters = sorted.reduce((s, r) => s + r.liters, 0)
  const totalCost = sorted.reduce((s, r) => s + r.totalPrice, 0)
  const avgPricePerLiter = totalLiters > 0 ? totalCost / totalLiters : 0

  // L/100km can only be calculated from 2nd fill onward (full tank method)
  let totalKm = 0
  let consumptionEntries = 0
  let consumptionSum = 0

  for (let i = 1; i < sorted.length; i++) {
    const km = sorted[i].odometer - sorted[i - 1].odometer
    if (km > 0) {
      totalKm += km
      consumptionSum += (sorted[i].liters / km) * 100
      consumptionEntries++
    }
  }

  const avgConsumption = consumptionEntries > 0 ? consumptionSum / consumptionEntries : 0
  const avgCostPerKm = totalKm > 0 ? totalCost / totalKm : 0
  const avgFillLiters = totalLiters / sorted.length

  return {
    totalLiters: fmt2(totalLiters),
    totalCost: fmt2(totalCost),
    totalKm: fmt2(totalKm),
    avgConsumption: fmt2(avgConsumption),
    avgCostPerKm: fmt2(avgCostPerKm),
    avgFillLiters: fmt2(avgFillLiters),
    totalRefuels: sorted.length,
    avgPricePerLiter: fmt2(avgPricePerLiter),
  }
}

export function calcCombinedStats(
  charges: ElectricCharge[],
  refuels: FuelRefuel[]
): CombinedStats {
  const elStats = calcElectricStats(charges)
  const fuStats = calcFuelStats(refuels)

  const totalElectricCost = elStats.totalCost
  const totalFuelCost = fuStats.totalCost
  const totalCost = totalElectricCost + totalFuelCost
  const totalKm = elStats.totalKm + fuStats.totalKm
  const avgCostPerKm = totalKm > 0 ? totalCost / totalKm : 0

  const electricKmPercent = totalKm > 0 ? (elStats.totalKm / totalKm) * 100 : 0
  const fuelKmPercent = totalKm > 0 ? (fuStats.totalKm / totalKm) * 100 : 0

  // CO2 saved: compare to doing all km on gasoline at avg consumption
  const avgFuelConsumption = fuStats.avgConsumption > 0 ? fuStats.avgConsumption : 7.0
  const co2IfAllGasoline = (elStats.totalKm / 100) * avgFuelConsumption * CO2_PER_LITER
  const co2FromElectric = elStats.totalKWh * CO2_PER_KWH_GRID
  const estimatedCO2SavedKg = Math.max(0, co2IfAllGasoline - co2FromElectric)

  return {
    totalKm: fmt2(totalKm),
    totalCost: fmt2(totalCost),
    avgCostPerKm: fmt2(avgCostPerKm),
    electricKmPercent: fmt2(electricKmPercent),
    fuelKmPercent: fmt2(fuelKmPercent),
    estimatedCO2SavedKg: fmt2(estimatedCO2SavedKg),
    totalElectricCost: fmt2(totalElectricCost),
    totalFuelCost: fmt2(totalFuelCost),
  }
}

export function getMonthlyData(
  charges: ElectricCharge[],
  refuels: FuelRefuel[]
): MonthlyData[] {
  const monthMap = new Map<string, MonthlyData>()

  const ensureMonth = (ym: string) => {
    if (!monthMap.has(ym)) {
      const [year, month] = ym.split('-')
      const date = new Date(parseInt(year), parseInt(month) - 1)
      const label = date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })
      monthMap.set(ym, {
        month: ym,
        label,
        electricCost: 0,
        fuelCost: 0,
        totalCost: 0,
        electricKm: 0,
        fuelKm: 0,
        kWh: 0,
        liters: 0,
      })
    }
    return monthMap.get(ym)!
  }

  const sortedCharges = [...charges].sort((a, b) => a.odometer - b.odometer)
  for (let i = 0; i < sortedCharges.length; i++) {
    const c = sortedCharges[i]
    const ym = c.date.substring(0, 7)
    const m = ensureMonth(ym)
    m.electricCost += c.totalPrice
    m.totalCost += c.totalPrice
    m.kWh += c.kWh
    if (i > 0) {
      const km = c.odometer - sortedCharges[i - 1].odometer
      if (km > 0) m.electricKm += km
    }
  }

  const sortedRefuels = [...refuels].sort((a, b) => a.odometer - b.odometer)
  for (let i = 0; i < sortedRefuels.length; i++) {
    const r = sortedRefuels[i]
    const ym = r.date.substring(0, 7)
    const m = ensureMonth(ym)
    m.fuelCost += r.totalPrice
    m.totalCost += r.totalPrice
    m.liters += r.liters
    if (i > 0) {
      m.fuelKm += Math.max(0, r.odometer - sortedRefuels[i - 1].odometer)
    }
  }

  return Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month))
}

export function getFuelConsumptionPerRefuel(
  refuels: FuelRefuel[]
): { date: string; consumption: number; label: string }[] {
  const sorted = [...refuels].sort((a, b) => a.odometer - b.odometer)
  const result: { date: string; consumption: number; label: string }[] = []
  for (let i = 1; i < sorted.length; i++) {
    const km = sorted[i].odometer - sorted[i - 1].odometer
    if (km > 0) {
      result.push({
        date: sorted[i].date,
        consumption: fmt2((sorted[i].liters / km) * 100),
        label: sorted[i].date.substring(5), // MM-DD
      })
    }
  }
  return result
}

export function getElectricEfficiencyPerCharge(
  charges: ElectricCharge[]
): { date: string; efficiency: number; label: string }[] {
  const sorted = [...charges].sort((a, b) => a.odometer - b.odometer)
  const result: { date: string; efficiency: number; label: string }[] = []
  for (let i = 1; i < sorted.length; i++) {
    const km = sorted[i].odometer - sorted[i - 1].odometer
    if (km > 0) {
      result.push({
        date: sorted[i].date,
        efficiency: fmt2((sorted[i - 1].kWh / km) * 100),
        label: sorted[i].date.substring(5),
      })
    }
  }
  return result
}

export function getChargingStationRanking(charges: ElectricCharge[]): StationRank[] {
  const map = new Map<string, { totalCost: number; totalKWh: number; visits: number; address: string; lastVisit: string }>()
  for (const c of charges) {
    const key = c.stationName.toLowerCase().trim()
    const prev = map.get(key)
    if (prev) {
      prev.totalCost += c.totalPrice
      prev.totalKWh += c.kWh
      prev.visits++
      if (c.date > prev.lastVisit) { prev.lastVisit = c.date; prev.address = c.stationAddress }
    } else {
      map.set(key, { totalCost: c.totalPrice, totalKWh: c.kWh, visits: 1, address: c.stationAddress, lastVisit: c.date })
    }
  }
  return Array.from(map.entries())
    .map(([name, d]) => ({
      name: charges.find(c => c.stationName.toLowerCase().trim() === name)?.stationName ?? name,
      address: d.address,
      avgPrice: d.totalKWh > 0 ? fmt2(d.totalCost / d.totalKWh) : 0,
      visits: d.visits,
      totalSpent: fmt2(d.totalCost),
      totalUnits: fmt2(d.totalKWh),
      lastVisit: d.lastVisit,
    }))
    .sort((a, b) => a.avgPrice - b.avgPrice)
}

export function getFuelStationRanking(refuels: FuelRefuel[]): StationRank[] {
  const map = new Map<string, { totalCost: number; totalLiters: number; visits: number; address: string; lastVisit: string }>()
  for (const r of refuels) {
    const key = r.stationName.toLowerCase().trim()
    const prev = map.get(key)
    if (prev) {
      prev.totalCost += r.totalPrice
      prev.totalLiters += r.liters
      prev.visits++
      if (r.date > prev.lastVisit) { prev.lastVisit = r.date; prev.address = r.stationAddress }
    } else {
      map.set(key, { totalCost: r.totalPrice, totalLiters: r.liters, visits: 1, address: r.stationAddress, lastVisit: r.date })
    }
  }
  return Array.from(map.entries())
    .map(([name, d]) => ({
      name: refuels.find(r => r.stationName.toLowerCase().trim() === name)?.stationName ?? name,
      address: d.address,
      avgPrice: d.totalLiters > 0 ? fmt2(d.totalCost / d.totalLiters) : 0,
      visits: d.visits,
      totalSpent: fmt2(d.totalCost),
      totalUnits: fmt2(d.totalLiters),
      lastVisit: d.lastVisit,
    }))
    .sort((a, b) => a.avgPrice - b.avgPrice)
}

export interface KnownStation { name: string; address: string }

export function getKnownChargingStations(charges: ElectricCharge[]): KnownStation[] {
  const seen = new Map<string, string>()
  for (const c of [...charges].sort((a, b) => b.date.localeCompare(a.date))) {
    const key = c.stationName.toLowerCase().trim()
    if (!seen.has(key)) seen.set(key, c.stationAddress)
  }
  return Array.from(seen.entries()).map(([, address], i) => ({
    name: charges.find(c => c.stationName.toLowerCase().trim() === Array.from(seen.keys())[i])?.stationName ?? '',
    address,
  }))
}

export function getKnownFuelStations(refuels: FuelRefuel[]): KnownStation[] {
  const seen = new Map<string, string>()
  for (const r of [...refuels].sort((a, b) => b.date.localeCompare(a.date))) {
    const key = r.stationName.toLowerCase().trim()
    if (!seen.has(key)) seen.set(key, r.stationAddress)
  }
  return Array.from(seen.entries()).map(([, address], i) => ({
    name: refuels.find(r => r.stationName.toLowerCase().trim() === Array.from(seen.keys())[i])?.stationName ?? '',
    address,
  }))
}

export interface DrivingModeStats {
  mode: DrivingMode
  label: string
  icon: string
  // Electric
  elCharges: number
  elKWh100km: number
  elCostPerKm: number
  elTotalKm: number
  // Fuel
  fuRefuels: number
  fuL100km: number
  fuCostPerKm: number
  fuTotalKm: number
  // Combined
  combinedCostPerKm: number
}

export function getStatsByDrivingMode(
  charges: ElectricCharge[],
  refuels: FuelRefuel[]
): DrivingModeStats[] {
  const MODES: { mode: DrivingMode; label: string; icon: string }[] = [
    { mode: 'city',    label: 'Ciudad',    icon: '🏙️' },
    { mode: 'highway', label: 'Carretera', icon: '🛣️' },
    { mode: 'mixed',   label: 'Mixto',     icon: '🔄' },
  ]

  const sortedRefuels = [...refuels].sort((a, b) => a.odometer - b.odometer)

  return MODES.map(({ mode, label, icon }) => {
    // Electric stats for this mode — consecutive diff method
    // A charge with drivingMode=X means the trip FROM the previous charge was mode X.
    // km for that trip = this.odometer - prev.odometer
    const allSortedCharges = [...charges].sort((a, b) => a.odometer - b.odometer)
    let elTotalKm = 0, elTotalKWh = 0, elTotalCost = 0, elChargeCount = 0
    for (let i = 0; i < allSortedCharges.length; i++) {
      const c = allSortedCharges[i]
      if (c.drivingMode !== mode) continue
      // km of this trip = distance from previous charge
      if (i > 0) {
        const km = c.odometer - allSortedCharges[i - 1].odometer
        if (km > 0) {
          elTotalKm += km
          elTotalKWh += allSortedCharges[i - 1].kWh // energy consumed on this trip
          elTotalCost += allSortedCharges[i - 1].totalPrice
        }
      }
      elChargeCount++
    }
    const elKWh100km = elTotalKm > 0 ? fmt2((elTotalKWh / elTotalKm) * 100) : 0
    const elCostPerKm = elTotalKm > 0 ? fmt2(elTotalCost / elTotalKm) : 0

    // Fuel stats for this mode
    const fuFiltered = refuels.filter(r => r.drivingMode === mode)
    let fuTotalKm = 0
    let fuTotalLiters = 0
    let fuTotalCost = 0
    for (const r of fuFiltered) {
      const idx = sortedRefuels.findIndex(x => x.id === r.id)
      if (idx > 0) {
        const km = r.odometer - sortedRefuels[idx - 1].odometer
        if (km > 0) fuTotalKm += km
      }
      fuTotalLiters += r.liters
      fuTotalCost += r.totalPrice
    }
    const fuL100km = fuTotalKm > 0 ? fmt2((fuTotalLiters / fuTotalKm) * 100) : 0
    const fuCostPerKm = fuTotalKm > 0 ? fmt2(fuTotalCost / fuTotalKm) : 0

    // Combined
    const totalKm = elTotalKm + fuTotalKm
    const totalCost = elTotalCost + fuTotalCost
    const combinedCostPerKm = totalKm > 0 ? fmt2(totalCost / totalKm) : 0

    return {
      mode, label, icon,
      elCharges: elChargeCount,
      elKWh100km, elCostPerKm, elTotalKm: fmt2(elTotalKm),
      fuRefuels: fuFiltered.length,
      fuL100km, fuCostPerKm, fuTotalKm: fmt2(fuTotalKm),
      combinedCostPerKm,
    }
  }).filter(s => s.elCharges > 0 || s.fuRefuels > 0)
}

/**
 * Eficiencia eléctrica real basada en los últimos N tramos.
 * Más precisa que el promedio global: refleja el estilo de conducción reciente.
 * Devuelve kWh/100km, o 0 si no hay datos suficientes.
 */
export function getRecentEfficiency(charges: ElectricCharge[], n = 5): number {
  const sorted = [...charges].sort((a, b) => a.odometer - b.odometer)
  // Necesitamos n+1 registros para tener n tramos
  const window = sorted.slice(-Math.min(n + 1, sorted.length))
  let totalKWh = 0
  let totalKm  = 0
  for (let i = 1; i < window.length; i++) {
    const km = window[i].odometer - window[i - 1].odometer
    if (km > 0) {
      totalKm  += km
      totalKWh += window[i - 1].kWh
    }
  }
  return totalKm > 0 ? (totalKWh / totalKm) * 100 : 0
}

/**
 * Consumo de gasolina real basado en los últimos N tramos.
 * Usa el método depósito lleno (consecutive diff).
 * Devuelve L/100km, o 0 si no hay datos suficientes.
 */
export function getRecentConsumption(refuels: FuelRefuel[], n = 5): number {
  const sorted = [...refuels].sort((a, b) => a.odometer - b.odometer)
  const window = sorted.slice(-Math.min(n + 1, sorted.length))
  let totalLiters = 0
  let totalKm     = 0
  for (let i = 1; i < window.length; i++) {
    const km = window[i].odometer - window[i - 1].odometer
    if (km > 0) {
      totalKm     += km
      totalLiters += window[i].liters
    }
  }
  return totalKm > 0 ? (totalLiters / totalKm) * 100 : 0
}

export function getWayletEffectivePriceHistory(
  charges: ElectricCharge[]
): { date: string; effective: number; tariff: number; label: string }[] {
  return charges
    .filter(c => c.wayletBefore != null)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(c => ({
      date: c.date,
      tariff: fmt2(c.pricePerKWh),
      effective: c.kWh > 0 ? fmt2(c.totalPrice / c.kWh) : fmt2(c.pricePerKWh),
      label: c.date.substring(5),
    }))
}

// ═══════════════════════════════════════════════════════════════
// SALUD DE LA BATERÍA
// Puntuación por recarga según el rango de carga utilizado.
// Óptimo: empezar ≥20% y terminar ≤80% → 100 pts
// Penalización lineal fuera de esos límites hasta 0% inicio / 100% fin → 0 pts
// ═══════════════════════════════════════════════════════════════

export interface ChargeHealthRecord {
  id: string
  date: string
  startPct: number   // % batería estimado al inicio de la recarga
  endPct: number     // % batería al terminar (batteryPercent registrado)
  kWh: number
  score: number      // 0-100
  label: 'Óptima' | 'Buena' | 'Regular' | 'Baja'
  color: 'emerald' | 'blue' | 'orange' | 'rose'
}

export interface BatteryHealthSummary {
  overall: number            // 0-100 score promedio
  label: 'Óptima' | 'Buena' | 'Regular' | 'Baja'
  color: 'emerald' | 'blue' | 'orange' | 'rose'
  records: ChargeHealthRecord[]
  scoredCount: number        // recargas con batteryPercent disponible
  totalCount: number
}

function scoreLabel(s: number): 'Óptima' | 'Buena' | 'Regular' | 'Baja' {
  if (s >= 80) return 'Óptima'
  if (s >= 60) return 'Buena'
  if (s >= 35) return 'Regular'
  return 'Baja'
}

function scoreColor(s: number): 'emerald' | 'blue' | 'orange' | 'rose' {
  if (s >= 80) return 'emerald'
  if (s >= 60) return 'blue'
  if (s >= 35) return 'orange'
  return 'rose'
}

export function calcChargeHealthScore(charge: ElectricCharge): ChargeHealthRecord | null {
  if (charge.batteryPercent == null) return null

  const endPct   = Math.min(100, Math.max(0, charge.batteryPercent))
  const chargedPct = (charge.kWh / BATTERY_CAPACITY_KWH) * 100
  const startPct = Math.min(100, Math.max(0, endPct - chargedPct))

  // Puntuación inicio (0-50): ≥20% → 50pts, <20% → proporcional
  const startScore = startPct >= 20 ? 50 : (startPct / 20) * 50

  // Puntuación fin (0-50): ≤80% → 50pts, >80% → decrece hasta 0 en 100%
  const endScore = endPct <= 80 ? 50 : Math.max(0, 50 * (1 - (endPct - 80) / 20))

  const score = Math.round(Math.max(0, startScore + endScore))

  return {
    id: charge.id,
    date: charge.date,
    startPct: Math.round(startPct),
    endPct,
    kWh: charge.kWh,
    score,
    label: scoreLabel(score),
    color: scoreColor(score),
  }
}

export function calcBatteryHealthSummary(charges: ElectricCharge[]): BatteryHealthSummary {
  const sorted = [...charges].sort((a, b) => b.date.localeCompare(a.date))
  const records = sorted
    .map(calcChargeHealthScore)
    .filter((r): r is ChargeHealthRecord => r !== null)

  const overall = records.length > 0
    ? Math.round(records.reduce((s, r) => s + r.score, 0) / records.length)
    : 0

  return {
    overall,
    label: scoreLabel(overall),
    color: scoreColor(overall),
    records,
    scoredCount: records.length,
    totalCount: charges.length,
  }
}

export function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

export function formatCurrency(n: number): string {
  return n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
}

export function formatNumber(n: number, decimals = 2): string {
  return n.toLocaleString('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}
