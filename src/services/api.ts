import type { ElectricCharge, FuelRefuel, Tire, Insurance } from '../types'

const BASE = '/jaecoo7/api'

function getToken() {
  return localStorage.getItem('consumo_token') ?? ''
}

const AUTH_ENDPOINTS = ['/login.php', '/register.php']

async function req<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  })
  const data = await res.json()
  if (!res.ok) {
    // Sesión expirada → forzar logout (solo en rutas autenticadas)
    if (res.status === 401 && !AUTH_ENDPOINTS.includes(path)) {
      localStorage.removeItem('consumo_token')
      localStorage.removeItem('consumo_plate')
      localStorage.removeItem('consumo_model')
      window.location.reload()
    }
    throw new Error(data.error ?? `Error ${res.status}`)
  }
  return data as T
}

// Auth
export interface VehicleInfo {
  token: string
  plate: string
  vehicle_model: string
  initial_odometer: number
  initial_battery_pct: number
  initial_fuel_liters: number
  created_at: string
}

export async function apiRegister(
  plate: string,
  password: string,
  vehicleModel: string,
  initialOdometer: number,
  initialBatteryPct: number,
  initialFuelLiters: number,
) {
  return req<VehicleInfo>('/register.php', {
    method: 'POST',
    body: JSON.stringify({
      plate,
      password,
      vehicle_model: vehicleModel,
      initial_odometer: initialOdometer,
      initial_battery_pct: initialBatteryPct,
      initial_fuel_liters: initialFuelLiters,
    }),
  })
}

export async function apiLogin(plate: string, password: string) {
  return req<VehicleInfo>('/login.php', {
    method: 'POST',
    body: JSON.stringify({ plate, password }),
  })
}

// Vehicle
export async function apiDeleteVehicle(): Promise<void> {
  await req('/vehicle.php', { method: 'DELETE' })
}

// Electric charges
export async function apiGetCharges(): Promise<ElectricCharge[]> {
  return req('/charges.php')
}

export async function apiAddCharge(charge: ElectricCharge): Promise<void> {
  await req('/charges.php', { method: 'POST', body: JSON.stringify(charge) })
}

export async function apiUpdateCharge(charge: ElectricCharge): Promise<void> {
  await req(`/charges.php?id=${charge.id}`, { method: 'PUT', body: JSON.stringify(charge) })
}

export async function apiDeleteCharge(id: string): Promise<void> {
  await req(`/charges.php?id=${id}`, { method: 'DELETE' })
}

// Fuel refuels
export async function apiGetRefuels(): Promise<FuelRefuel[]> {
  return req('/refuels.php')
}

export async function apiAddRefuel(refuel: FuelRefuel): Promise<void> {
  await req('/refuels.php', { method: 'POST', body: JSON.stringify(refuel) })
}

export async function apiUpdateRefuel(refuel: FuelRefuel): Promise<void> {
  await req(`/refuels.php?id=${refuel.id}`, { method: 'PUT', body: JSON.stringify(refuel) })
}

export async function apiDeleteRefuel(id: string): Promise<void> {
  await req(`/refuels.php?id=${id}`, { method: 'DELETE' })
}

// Tires
export async function apiGetTires(): Promise<Tire[]> {
  return req('/tires.php')
}
export async function apiAddTire(tire: Tire): Promise<void> {
  await req('/tires.php', { method: 'POST', body: JSON.stringify(tire) })
}
export async function apiUpdateTire(tire: Tire): Promise<void> {
  await req(`/tires.php?id=${tire.id}`, { method: 'PUT', body: JSON.stringify(tire) })
}
export async function apiDeleteTire(id: string): Promise<void> {
  await req(`/tires.php?id=${id}`, { method: 'DELETE' })
}

// Insurance
export async function apiGetInsurance(): Promise<Insurance | null> {
  return req('/insurance.php')
}
export async function apiSaveInsurance(ins: Insurance): Promise<void> {
  await req('/insurance.php', { method: 'POST', body: JSON.stringify(ins) })
}
