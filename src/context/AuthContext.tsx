import React, { createContext, useContext, useState } from 'react'
import { apiLogin, apiRegister } from '../services/api'

interface AuthState {
  token: string | null
  plate: string | null
  vehicleModel: string | null
  initialOdometer: number
  initialBatteryPct: number
  initialFuelLiters: number
  createdAt: string | null
}

interface AuthContextValue extends AuthState {
  isAuthenticated: boolean
  login: (plate: string, password: string) => Promise<void>
  register: (
    plate: string,
    password: string,
    model: string,
    initialOdometer: number,
    initialBatteryPct: number,
    initialFuelLiters: number,
  ) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadAuth(): AuthState {
  return {
    token: localStorage.getItem('consumo_token'),
    plate: localStorage.getItem('consumo_plate'),
    vehicleModel: localStorage.getItem('consumo_model'),
    initialOdometer: parseInt(localStorage.getItem('consumo_init_odometer') ?? '0', 10),
    initialBatteryPct: parseInt(localStorage.getItem('consumo_init_battery') ?? '100', 10),
    initialFuelLiters: parseFloat(localStorage.getItem('consumo_init_fuel') ?? '60'),
    createdAt: localStorage.getItem('consumo_created_at'),
  }
}

function saveAuth(state: AuthState) {
  if (state.token) localStorage.setItem('consumo_token', state.token)
  if (state.plate) localStorage.setItem('consumo_plate', state.plate)
  if (state.vehicleModel) localStorage.setItem('consumo_model', state.vehicleModel)
  localStorage.setItem('consumo_init_odometer', String(state.initialOdometer))
  localStorage.setItem('consumo_init_battery', String(state.initialBatteryPct))
  localStorage.setItem('consumo_init_fuel', String(state.initialFuelLiters))
  if (state.createdAt) localStorage.setItem('consumo_created_at', state.createdAt)
}

function clearAuth() {
  localStorage.removeItem('consumo_token')
  localStorage.removeItem('consumo_plate')
  localStorage.removeItem('consumo_model')
  localStorage.removeItem('consumo_init_odometer')
  localStorage.removeItem('consumo_init_battery')
  localStorage.removeItem('consumo_init_fuel')
  localStorage.removeItem('consumo_created_at')
  // Clear old keys
  localStorage.removeItem('consumo_data')
  localStorage.removeItem('consumo_sha')
  localStorage.removeItem('consumo_github_token')
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(loadAuth)

  const login = async (plate: string, password: string) => {
    const res = await apiLogin(plate, password)
    const state: AuthState = {
      token: res.token,
      plate: res.plate,
      vehicleModel: res.vehicle_model,
      initialOdometer: res.initial_odometer,
      initialBatteryPct: res.initial_battery_pct,
      initialFuelLiters: res.initial_fuel_liters,
      createdAt: res.created_at,
    }
    saveAuth(state)
    setAuth(state)
  }

  const register = async (
    plate: string,
    password: string,
    model: string,
    initialOdometer: number,
    initialBatteryPct: number,
    initialFuelLiters: number,
  ) => {
    const res = await apiRegister(plate, password, model, initialOdometer, initialBatteryPct, initialFuelLiters)
    const state: AuthState = {
      token: res.token,
      plate: res.plate,
      vehicleModel: res.vehicle_model,
      initialOdometer: res.initial_odometer,
      initialBatteryPct: res.initial_battery_pct,
      initialFuelLiters: res.initial_fuel_liters,
      createdAt: res.created_at,
    }
    saveAuth(state)
    setAuth(state)
  }

  const logout = () => {
    clearAuth()
    setAuth({
      token: null, plate: null, vehicleModel: null,
      initialOdometer: 0, initialBatteryPct: 100, initialFuelLiters: 60, createdAt: null,
    })
  }

  return (
    <AuthContext.Provider value={{ ...auth, isAuthenticated: !!auth.token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
