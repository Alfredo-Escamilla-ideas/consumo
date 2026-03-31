import type { ElectricCharge, FuelRefuel } from '../types'

const BASE = '/jaecoo7/api'

function getToken() {
  return localStorage.getItem('consumo_token') ?? ''
}

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
    // Expired session → force logout
    if (res.status === 401) {
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
export async function apiRegister(plate: string, password: string, vehicleModel: string) {
  return req<{ token: string; plate: string; vehicle_model: string }>('/register.php', {
    method: 'POST',
    body: JSON.stringify({ plate, password, vehicle_model: vehicleModel }),
  })
}

export async function apiLogin(plate: string, password: string) {
  return req<{ token: string; plate: string; vehicle_model: string }>('/login.php', {
    method: 'POST',
    body: JSON.stringify({ plate, password }),
  })
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
