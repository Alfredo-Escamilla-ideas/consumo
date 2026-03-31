import React, { createContext, useContext, useEffect, useReducer, useRef, useCallback } from 'react'
import type { AppData, ElectricCharge, FuelRefuel } from '../types'
import { githubLoadData, githubSaveData } from '../services/github'

const LS_DATA_KEY = 'consumo_data'
const LS_SHA_KEY = 'consumo_sha'
const LS_TOKEN_KEY = 'consumo_github_token'

interface State {
  data: AppData
  token: string
  sha: string | null
  isLoading: boolean
  isSyncing: boolean
  syncError: string | null
  lastSynced: Date | null
}

type Action =
  | { type: 'SET_TOKEN'; token: string }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_DATA'; data: AppData; sha: string | null }
  | { type: 'SET_SYNCING'; syncing: boolean }
  | { type: 'SET_SYNC_ERROR'; error: string | null }
  | { type: 'SET_SYNCED'; sha: string }
  | { type: 'ADD_CHARGE'; charge: ElectricCharge }
  | { type: 'UPDATE_CHARGE'; charge: ElectricCharge }
  | { type: 'DELETE_CHARGE'; id: string }
  | { type: 'ADD_REFUEL'; refuel: FuelRefuel }
  | { type: 'UPDATE_REFUEL'; refuel: FuelRefuel }
  | { type: 'DELETE_REFUEL'; id: string }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_TOKEN':
      return { ...state, token: action.token }
    case 'SET_LOADING':
      return { ...state, isLoading: action.loading }
    case 'SET_DATA':
      return { ...state, data: action.data, sha: action.sha, isLoading: false }
    case 'SET_SYNCING':
      return { ...state, isSyncing: action.syncing }
    case 'SET_SYNC_ERROR':
      return { ...state, syncError: action.error, isSyncing: false }
    case 'SET_SYNCED':
      return { ...state, sha: action.sha, isSyncing: false, syncError: null, lastSynced: new Date() }
    case 'ADD_CHARGE':
      return { ...state, data: { ...state.data, electricCharges: [...state.data.electricCharges, action.charge] } }
    case 'UPDATE_CHARGE':
      return { ...state, data: { ...state.data, electricCharges: state.data.electricCharges.map(c => c.id === action.charge.id ? action.charge : c) } }
    case 'DELETE_CHARGE':
      return { ...state, data: { ...state.data, electricCharges: state.data.electricCharges.filter(c => c.id !== action.id) } }
    case 'ADD_REFUEL':
      return { ...state, data: { ...state.data, fuelRefuels: [...state.data.fuelRefuels, action.refuel] } }
    case 'UPDATE_REFUEL':
      return { ...state, data: { ...state.data, fuelRefuels: state.data.fuelRefuels.map(r => r.id === action.refuel.id ? action.refuel : r) } }
    case 'DELETE_REFUEL':
      return { ...state, data: { ...state.data, fuelRefuels: state.data.fuelRefuels.filter(r => r.id !== action.id) } }
    default:
      return state
  }
}

interface DataContextValue extends State {
  setToken: (token: string) => void
  addCharge: (charge: ElectricCharge) => Promise<void>
  updateCharge: (charge: ElectricCharge) => Promise<void>
  deleteCharge: (id: string) => Promise<void>
  addRefuel: (refuel: FuelRefuel) => Promise<void>
  updateRefuel: (refuel: FuelRefuel) => Promise<void>
  deleteRefuel: (id: string) => Promise<void>
  syncNow: () => Promise<void>
}

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    data: { electricCharges: [], fuelRefuels: [] },
    token: localStorage.getItem(LS_TOKEN_KEY) || '',
    sha: localStorage.getItem(LS_SHA_KEY) || null,
    isLoading: true,
    isSyncing: false,
    syncError: null,
    lastSynced: null,
  })

  const stateRef = useRef(state)
  stateRef.current = state

  // Load cached data on mount
  useEffect(() => {
    const cached = localStorage.getItem(LS_DATA_KEY)
    if (cached) {
      try {
        const data = JSON.parse(cached) as AppData
        const sha = localStorage.getItem(LS_SHA_KEY)
        dispatch({ type: 'SET_DATA', data, sha })
      } catch {
        dispatch({ type: 'SET_LOADING', loading: false })
      }
    } else {
      dispatch({ type: 'SET_LOADING', loading: false })
    }
  }, [])

  // Sync from GitHub on mount (if token)
  useEffect(() => {
    const token = localStorage.getItem(LS_TOKEN_KEY) || ''
    if (token) fetchFromGitHub(token)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchFromGitHub(token: string) {
    dispatch({ type: 'SET_SYNCING', syncing: true })
    const result = await githubLoadData(token)
    if (result) {
      localStorage.setItem(LS_DATA_KEY, JSON.stringify(result.data))
      if (result.sha) localStorage.setItem(LS_SHA_KEY, result.sha)
      dispatch({ type: 'SET_DATA', data: result.data, sha: result.sha })
      if (result.sha) dispatch({ type: 'SET_SYNCED', sha: result.sha })
      else dispatch({ type: 'SET_SYNCING', syncing: false })
    } else {
      dispatch({ type: 'SET_SYNC_ERROR', error: 'No se pudo conectar con GitHub' })
    }
  }

  const persistAndSync = useCallback(async (newData: AppData) => {
    localStorage.setItem(LS_DATA_KEY, JSON.stringify(newData))
    const { token, sha } = stateRef.current
    if (!token) return
    dispatch({ type: 'SET_SYNCING', syncing: true })
    const result = await githubSaveData(token, newData, sha)
    if (result.success && result.sha) {
      localStorage.setItem(LS_SHA_KEY, result.sha)
      dispatch({ type: 'SET_SYNCED', sha: result.sha })
    } else {
      dispatch({ type: 'SET_SYNC_ERROR', error: 'Error al guardar en GitHub' })
    }
  }, [])

  function setToken(token: string) {
    localStorage.setItem(LS_TOKEN_KEY, token)
    dispatch({ type: 'SET_TOKEN', token })
    if (token) fetchFromGitHub(token)
  }

  const addCharge = useCallback(async (charge: ElectricCharge) => {
    dispatch({ type: 'ADD_CHARGE', charge })
    const newData = { ...stateRef.current.data, electricCharges: [...stateRef.current.data.electricCharges, charge] }
    await persistAndSync(newData)
  }, [persistAndSync])

  const updateCharge = useCallback(async (charge: ElectricCharge) => {
    dispatch({ type: 'UPDATE_CHARGE', charge })
    const newData = { ...stateRef.current.data, electricCharges: stateRef.current.data.electricCharges.map(c => c.id === charge.id ? charge : c) }
    await persistAndSync(newData)
  }, [persistAndSync])

  const deleteCharge = useCallback(async (id: string) => {
    dispatch({ type: 'DELETE_CHARGE', id })
    const newData = { ...stateRef.current.data, electricCharges: stateRef.current.data.electricCharges.filter(c => c.id !== id) }
    await persistAndSync(newData)
  }, [persistAndSync])

  const addRefuel = useCallback(async (refuel: FuelRefuel) => {
    dispatch({ type: 'ADD_REFUEL', refuel })
    const newData = { ...stateRef.current.data, fuelRefuels: [...stateRef.current.data.fuelRefuels, refuel] }
    await persistAndSync(newData)
  }, [persistAndSync])

  const updateRefuel = useCallback(async (refuel: FuelRefuel) => {
    dispatch({ type: 'UPDATE_REFUEL', refuel })
    const newData = { ...stateRef.current.data, fuelRefuels: stateRef.current.data.fuelRefuels.map(r => r.id === refuel.id ? refuel : r) }
    await persistAndSync(newData)
  }, [persistAndSync])

  const deleteRefuel = useCallback(async (id: string) => {
    dispatch({ type: 'DELETE_REFUEL', id })
    const newData = { ...stateRef.current.data, fuelRefuels: stateRef.current.data.fuelRefuels.filter(r => r.id !== id) }
    await persistAndSync(newData)
  }, [persistAndSync])

  const syncNow = useCallback(async () => {
    const { token } = stateRef.current
    if (token) await fetchFromGitHub(token)
  }, [])

  return (
    <DataContext.Provider value={{ ...state, setToken, addCharge, updateCharge, deleteCharge, addRefuel, updateRefuel, deleteRefuel, syncNow }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
