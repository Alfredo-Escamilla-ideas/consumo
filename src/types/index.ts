export type DrivingMode = 'city' | 'highway' | 'mixed'

export interface ElectricCharge {
  id: string
  date: string           // ISO date string YYYY-MM-DD
  kWh: number
  pricePerKWh: number    // tarifa €/kWh en el punto de carga
  totalPriceGross: number // coste bruto = kWh × tarifa
  totalPrice: number     // dinero real pagado (gross − saldo Waylet usado)
  wayletBefore?: number  // saldo Waylet antes de la recarga
  wayletAfter?: number   // saldo Waylet después de la recarga
  odometer: number       // km en el momento de la recarga
  stationName: string
  stationAddress: string
  batteryPercent?: number  // % batería al terminar la recarga
  drivingMode?: DrivingMode
  notes?: string
}

export interface FuelRefuel {
  id: string
  date: string // ISO date string YYYY-MM-DD
  liters: number
  totalPrice: number // € total pagado
  pricePerLiter: number // €/litro
  odometer: number // km en el momento del repostaje
  litersInTank?: number // litros que ya había en el depósito antes de repostar
  stationName: string
  stationAddress: string
  drivingMode?: DrivingMode // condiciones del trayecto consumido
  notes?: string
}

// ── Garage ──────────────────────────────────────────────────────────────────
export type RepairType   = 'mechanical' | 'electrical' | 'both' | 'bodywork' | 'other'
export type RepairStatus = 'open' | 'in_repair' | 'resolved' | 'warranty'

export interface Repair {
  id: string
  date: string
  odometer?: number
  type: RepairType
  status: RepairStatus
  description: string
  diagnosis?: string
  workshop?: string
  workshopPhone?: string
  partsAffected: string[]
  estimatePrice?: number
  finalPrice?: number
  repairDays?: number
  warrantyClaim: boolean
  invoiceNumber?: string
  notes?: string
}

export type MaintenanceType = 'annual' | 'oil' | 'brakes' | 'tires' | 'battery' | 'full' | 'other'
export type MaintenanceStatus = 'done' | 'pending'

export interface MaintenanceService {
  id: string
  date: string
  odometer?: number
  nextDate?: string
  nextOdometer?: number
  type: MaintenanceType
  workshop?: string
  workshopPhone?: string
  price?: number
  itemsChecked: string[]
  notes?: string
  status: MaintenanceStatus
}

export type InsuranceType = 'third_party' | 'third_party_plus' | 'comprehensive_excess' | 'comprehensive'

export interface Insurance {
  id: string
  company: string
  policyNumber: string
  type: InsuranceType
  annualPrice?: number
  excessAmount?: number
  startDate?: string
  endDate?: string
  autoRenewal: boolean
  agentName?: string
  agentPhone?: string
  agentEmail?: string
  emergencyPhone?: string
  coverages: string[]
  notes?: string
}

export type TirePosition = 'front_left' | 'front_right' | 'rear_left' | 'rear_right' | 'spare'
export type TireType = 'summer' | 'winter' | 'allseason'

export interface Tire {
  id: string
  brand: string
  model: string
  type: TireType
  size: string
  position: TirePosition
  purchaseDate: string
  purchasePrice?: number
  odometerAtInstall: number
  estimatedLifeKm: number
  treadDepthMm?: number
  estimatedChangeDate?: string
  dotCode?: string
  notes?: string
}

// ── Accidents ────────────────────────────────────────────────────────────────
export type AccidentStatus = 'open' | 'in_progress' | 'resolved'

export interface AccidentReport {
  id: string
  date: string
  time?: string
  location?: string
  odometer?: number
  description: string
  partsAffected: string[]
  damageDescription?: string
  hasThirdParty: boolean
  thirdPartyName?: string
  thirdPartyPlate?: string
  thirdPartyInsurance?: string
  thirdPartyPolicy?: string
  notifiedInsurance: boolean
  claimNumber?: string
  status: AccidentStatus
  repairCost?: number
  workshop?: string
  resolutionDate?: string
  notes?: string
}

export interface AppData {
  electricCharges: ElectricCharge[]
  fuelRefuels: FuelRefuel[]
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
