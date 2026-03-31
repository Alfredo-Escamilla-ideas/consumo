import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { AppData, ElectricCharge, FuelRefuel } from '../types'
import {
  apiGetCharges, apiAddCharge, apiUpdateCharge, apiDeleteCharge,
  apiGetRefuels, apiAddRefuel, apiUpdateRefuel, apiDeleteRefuel,
} from '../services/api'
import { useAuth } from './AuthContext'

interface DataContextValue {
  data: AppData
  isLoading: boolean
  error: string | null
  addCharge: (charge: ElectricCharge) => Promise<void>
  updateCharge: (charge: ElectricCharge) => Promise<void>
  deleteCharge: (id: string) => Promise<void>
  addRefuel: (refuel: FuelRefuel) => Promise<void>
  updateRefuel: (refuel: FuelRefuel) => Promise<void>
  deleteRefuel: (id: string) => Promise<void>
  reload: () => Promise<void>
}

const DataContext = createContext<DataContextValue | null>(null)

const EMPTY: AppData = { electricCharges: [], fuelRefuels: [] }

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [data, setData] = useState<AppData>(EMPTY)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!isAuthenticated) return
    setIsLoading(true)
    setError(null)
    try {
      const [charges, refuels] = await Promise.all([apiGetCharges(), apiGetRefuels()])
      setData({ electricCharges: charges, fuelRefuels: refuels })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando datos')
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => { load() }, [load])

  const addCharge = useCallback(async (charge: ElectricCharge) => {
    await apiAddCharge(charge)
    setData(d => ({ ...d, electricCharges: [charge, ...d.electricCharges] }))
  }, [])

  const updateCharge = useCallback(async (charge: ElectricCharge) => {
    await apiUpdateCharge(charge)
    setData(d => ({ ...d, electricCharges: d.electricCharges.map(c => c.id === charge.id ? charge : c) }))
  }, [])

  const deleteCharge = useCallback(async (id: string) => {
    await apiDeleteCharge(id)
    setData(d => ({ ...d, electricCharges: d.electricCharges.filter(c => c.id !== id) }))
  }, [])

  const addRefuel = useCallback(async (refuel: FuelRefuel) => {
    await apiAddRefuel(refuel)
    setData(d => ({ ...d, fuelRefuels: [refuel, ...d.fuelRefuels] }))
  }, [])

  const updateRefuel = useCallback(async (refuel: FuelRefuel) => {
    await apiUpdateRefuel(refuel)
    setData(d => ({ ...d, fuelRefuels: d.fuelRefuels.map(r => r.id === refuel.id ? refuel : r) }))
  }, [])

  const deleteRefuel = useCallback(async (id: string) => {
    await apiDeleteRefuel(id)
    setData(d => ({ ...d, fuelRefuels: d.fuelRefuels.filter(r => r.id !== id) }))
  }, [])

  return (
    <DataContext.Provider value={{ data, isLoading, error, addCharge, updateCharge, deleteCharge, addRefuel, updateRefuel, deleteRefuel, reload: load }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
