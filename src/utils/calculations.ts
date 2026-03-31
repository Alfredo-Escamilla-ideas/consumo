import type {
  ElectricCharge,
  FuelRefuel,
  ElectricStats,
  FuelStats,
  CombinedStats,
  MonthlyData,
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

const BATTERY_CAPACITY_KWH = 18.3
// CO2 gasoline: 2.31 kg/L; Spain grid CO2: ~0.18 kg/kWh (2024)
const CO2_PER_LITER = 2.31
const CO2_PER_KWH_GRID = 0.18

export function fmt2(n: number): number {
  return Math.round(n * 100) / 100
}

export function calcElectricStats(charges: ElectricCharge[]): ElectricStats {
  if (charges.length === 0) {
    return {
      totalKWh: 0,
      totalCost: 0,
      totalKm: 0,
      avgEfficiency: 0,
      avgCostPerKm: 0,
      avgChargeKWh: 0,
      avgKmPerCharge: 0,
      totalCharges: 0,
      batteryCapacity: BATTERY_CAPACITY_KWH,
      avgChargePercent: 0,
    }
  }

  const totalKWh = charges.reduce((s, c) => s + c.kWh, 0)
  const totalCost = charges.reduce((s, c) => s + c.totalPrice, 0)
  const totalKm = charges.reduce((s, c) => s + Math.max(0, c.odometerEnd - c.odometerStart), 0)
  const avgEfficiency = totalKm > 0 ? (totalKWh / totalKm) * 100 : 0
  const avgCostPerKm = totalKm > 0 ? totalCost / totalKm : 0
  const avgChargeKWh = totalKWh / charges.length
  const avgKmPerCharge = totalKm / charges.length
  const avgChargePercent = (avgChargeKWh / BATTERY_CAPACITY_KWH) * 100

  return {
    totalKWh: fmt2(totalKWh),
    totalCost: fmt2(totalCost),
    totalKm: fmt2(totalKm),
    avgEfficiency: fmt2(avgEfficiency),
    avgCostPerKm: fmt2(avgCostPerKm),
    avgChargeKWh: fmt2(avgChargeKWh),
    avgKmPerCharge: fmt2(avgKmPerCharge),
    totalCharges: charges.length,
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

  for (const c of charges) {
    const ym = c.date.substring(0, 7)
    const m = ensureMonth(ym)
    m.electricCost += c.totalPrice
    m.totalCost += c.totalPrice
    m.kWh += c.kWh
    m.electricKm += Math.max(0, c.odometerEnd - c.odometerStart)
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
  return charges
    .filter((c) => c.odometerEnd > c.odometerStart)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((c) => ({
      date: c.date,
      efficiency: fmt2((c.kWh / (c.odometerEnd - c.odometerStart)) * 100),
      label: c.date.substring(5),
    }))
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
