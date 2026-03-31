import { useState, useEffect } from 'react'
import type { FuelRefuel } from '../../types'
import StationInput from '../StationInput'
import { useData } from '../../context/DataContext'
import { getKnownFuelStations } from '../../utils/calculations'

interface FuelFormProps {
  initial?: FuelRefuel
  onSubmit: (data: Omit<FuelRefuel, 'id'>) => void
  onCancel: () => void
  isSubmitting?: boolean
}

const EMPTY = {
  date: new Date().toISOString().substring(0, 10),
  liters: '',
  totalPrice: '',
  pricePerLiter: '',
  odometer: '',
  stationName: '',
  stationAddress: '',
  notes: '',
}

export default function FuelForm({ initial, onSubmit, onCancel, isSubmitting }: FuelFormProps) {
  const { data } = useData()
  const knownStations = getKnownFuelStations(data.fuelRefuels)

  const [f, setF] = useState(
    initial
      ? {
          date: initial.date,
          liters: String(initial.liters),
          totalPrice: String(initial.totalPrice),
          pricePerLiter: String(initial.pricePerLiter),
          odometer: String(initial.odometer),
          stationName: initial.stationName,
          stationAddress: initial.stationAddress,
          notes: initial.notes ?? '',
        }
      : EMPTY
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [lastChanged, setLastChanged] = useState<'total' | 'perLiter' | null>(null)

  useEffect(() => {
    const liters = parseFloat(f.liters)
    const total = parseFloat(f.totalPrice)
    const perLiter = parseFloat(f.pricePerLiter)
    if (liters > 0) {
      if (lastChanged === 'total' && total > 0) {
        setF(prev => ({ ...prev, pricePerLiter: (total / liters).toFixed(3) }))
      } else if (lastChanged === 'perLiter' && perLiter > 0) {
        setF(prev => ({ ...prev, totalPrice: (perLiter * liters).toFixed(2) }))
      }
    }
  }, [f.liters, f.totalPrice, f.pricePerLiter, lastChanged])

  const set = (k: keyof typeof EMPTY, v: string) => {
    setF(prev => ({ ...prev, [k]: v }))
    setErrors(prev => { const n = { ...prev }; delete n[k]; return n })
    if (k === 'totalPrice') setLastChanged('total')
    if (k === 'pricePerLiter') setLastChanged('perLiter')
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!f.date) e.date = 'Requerido'
    if (!f.liters || parseFloat(f.liters) <= 0) e.liters = 'Introduce los litros'
    if (!f.totalPrice || parseFloat(f.totalPrice) <= 0) e.totalPrice = 'Introduce el precio total'
    if (!f.pricePerLiter || parseFloat(f.pricePerLiter) <= 0) e.pricePerLiter = 'Introduce el €/litro'
    if (!f.odometer) e.odometer = 'Requerido'
    if (!f.stationName) e.stationName = 'Requerido'
    if (!f.stationAddress) e.stationAddress = 'Requerido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    onSubmit({
      date: f.date,
      liters: parseFloat(f.liters),
      totalPrice: parseFloat(f.totalPrice),
      pricePerLiter: parseFloat(f.pricePerLiter),
      odometer: parseFloat(f.odometer),
      stationName: f.stationName,
      stationAddress: f.stationAddress,
      notes: f.notes || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Fecha" error={errors.date}>
          <input type="date" value={f.date} onChange={e => set('date', e.target.value)} className={inp(errors.date, 'orange')} />
        </Field>
        <Field label="Litros echados" error={errors.liters}>
          <input type="number" step="0.01" min="0" placeholder="e.g. 35.5" value={f.liters} onChange={e => set('liters', e.target.value)} className={inp(errors.liters, 'orange')} />
        </Field>
        <Field label="Precio total (€)" error={errors.totalPrice}>
          <input type="number" step="0.01" min="0" placeholder="e.g. 58.40" value={f.totalPrice} onChange={e => set('totalPrice', e.target.value)} className={inp(errors.totalPrice, 'orange')} />
        </Field>
        <Field label="€/litro" error={errors.pricePerLiter}>
          <input type="number" step="0.001" min="0" placeholder="e.g. 1.645" value={f.pricePerLiter} onChange={e => set('pricePerLiter', e.target.value)} className={inp(errors.pricePerLiter, 'orange')} />
        </Field>
      </div>

      <Field label="Odómetro (km en el momento del repostaje)" error={errors.odometer}>
        <input type="number" min="0" placeholder="e.g. 5420" value={f.odometer} onChange={e => set('odometer', e.target.value)} className={inp(errors.odometer, 'orange')} />
      </Field>

      <StationInput
        nameValue={f.stationName}
        addressValue={f.stationAddress}
        onChangeName={v => set('stationName', v)}
        onChangeAddress={v => set('stationAddress', v)}
        known={knownStations}
        nameError={errors.stationName}
        addressError={errors.stationAddress}
        accentColor="orange"
      />

      <Field label="Notas (opcional)">
        <input type="text" placeholder="Observaciones…" value={f.notes} onChange={e => set('notes', e.target.value)} className={inp(undefined, 'orange')} />
      </Field>

      <div className="flex gap-3 pt-2 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting} className="px-5 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-60 rounded-lg transition-colors">
          {isSubmitting ? 'Guardando…' : initial ? 'Actualizar' : 'Guardar repostaje'}
        </button>
      </div>
    </form>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-600">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

function inp(error?: string, color: 'blue' | 'orange' = 'blue') {
  const focus = color === 'orange' ? 'focus:border-orange-400' : 'focus:border-blue-400'
  return `w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors
    ${error ? 'border-red-300 focus:border-red-400 bg-red-50' : `border-slate-200 ${focus} bg-white`}
    placeholder:text-slate-400`
}
