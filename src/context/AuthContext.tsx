import React, { createContext, useContext, useState } from 'react'
import { apiLogin, apiRegister } from '../services/api'

interface AuthState {
  token: string | null
  plate: string | null
  vehicleModel: string | null
}

interface AuthContextValue extends AuthState {
  isAuthenticated: boolean
  login: (plate: string, password: string) => Promise<void>
  register: (plate: string, password: string, model: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadAuth(): AuthState {
  return {
    token: localStorage.getItem('consumo_token'),
    plate: localStorage.getItem('consumo_plate'),
    vehicleModel: localStorage.getItem('consumo_model'),
  }
}

function saveAuth(state: AuthState) {
  if (state.token) localStorage.setItem('consumo_token', state.token)
  if (state.plate) localStorage.setItem('consumo_plate', state.plate)
  if (state.vehicleModel) localStorage.setItem('consumo_model', state.vehicleModel)
}

function clearAuth() {
  localStorage.removeItem('consumo_token')
  localStorage.removeItem('consumo_plate')
  localStorage.removeItem('consumo_model')
  // Clear old GitHub keys too
  localStorage.removeItem('consumo_data')
  localStorage.removeItem('consumo_sha')
  localStorage.removeItem('consumo_github_token')
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(loadAuth)

  const login = async (plate: string, password: string) => {
    const res = await apiLogin(plate, password)
    const state = { token: res.token, plate: res.plate, vehicleModel: res.vehicle_model }
    saveAuth(state)
    setAuth(state)
  }

  const register = async (plate: string, password: string, model: string) => {
    const res = await apiRegister(plate, password, model)
    const state = { token: res.token, plate: res.plate, vehicleModel: res.vehicle_model }
    saveAuth(state)
    setAuth(state)
  }

  const logout = () => {
    clearAuth()
    setAuth({ token: null, plate: null, vehicleModel: null })
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
