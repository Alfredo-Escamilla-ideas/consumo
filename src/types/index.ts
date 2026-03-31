export interface ElectricCharge {
  id: string
  date: string // ISO date string YYYY-MM-DD
  kWh: number
  totalPrice: number // € total pagado
  pricePerKWh: number // €/kWh según Wailet
  odometerStart: number // km al salir de la última carga (batería llena)
  odometerEnd: number // km al llegar a esta carga (batería baja)
  stationName: string
  stationAddress: string
  notes?: string
}

export interface FuelRefuel {
  id: string
  date: string // ISO date string YYYY-MM-DD
  liters: number
  totalPrice: number // € total pagado
  pricePerLiter: number // €/litro
  odometer: number // km en el momento del repostaje
  stationName: string
  stationAddress: string
  notes?: string
}

export interface AppData {
  electricCharges: ElectricCharge[]
  fuelRefuels: FuelRefuel[]
}

export interface GitHubState {
  sha: string | null
  lastSynced: Date | null
  isSyncing: boolean
  syncError: string | null
}

export interface ElectricStats {
  totalKWh: number
  totalCost: number
  totalKm: number
  avgEfficiency: number // kWh/100km
  avgCostPerKm: number
  avgChargeKWh: number
  avgKmPerCharge: number
  totalCharges: number
  batteryCapacity: number
  avgChargePercent: number
}

export interface FuelStats {
  totalLiters: number
  totalCost: number
  totalKm: number
  avgConsumption: number // L/100km
  avgCostPerKm: number
  avgFillLiters: number
  totalRefuels: number
  avgPricePerLiter: number
}

export interface CombinedStats {
  totalKm: number
  totalCost: number
  avgCostPerKm: number
  electricKmPercent: number
  fuelKmPercent: number
  estimatedCO2SavedKg: number
  totalElectricCost: number
  totalFuelCost: number
}

export interface MonthlyData {
  month: string // YYYY-MM
  label: string // "Ene 2025"
  electricCost: number
  fuelCost: number
  totalCost: number
  electricKm: number
  fuelKm: number
  kWh: number
  liters: number
}
