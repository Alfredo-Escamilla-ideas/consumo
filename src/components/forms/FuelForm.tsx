import { useState, useEffect } from 'react'
import type { FuelRefuel, DrivingMode } from '../../types'
import StationInput from '../StationInput'
import DrivingModeSelector from '../DrivingModeSelector'
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
  const [drivingMode, setDrivingMode] = useState<DrivingMode | ''>(initial?.drivingMode ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [lastChanged, setLastChanged] = useState<'total' | 'perLiter' | null>(null)

  const otherRefuels = data.fuelRefuels.filter(r => r.id !== initial?.id)
  const isFirstEntry = otherRefuels.length === 0

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
    if (!isFirstEntry && !drivingMode) e.drivingMode = 'Selecciona el tipo de trayecto'
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
      drivingMode: drivingMode as DrivingMode,
      notes: f.notes || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* First entry info OR driving mode selector */}
      {isFirstEntry ? (
        <div className="bg-jaecoo-fuel-dim border border-jaecoo-fuel/20 rounded-xl px-4 py-3 flex items-start gap-2">
          <span className="text-lg leading-none mt-0.5">📌</span>
          <div>
            <p className="font-semibold text-sm text-jaecoo-fuel">Primer registro — punto de referencia</p>
            <p className="text-xs text-jaecoo-fuel/70 mt-0.5">
              Este registro servirá como punto de partida. A partir del siguiente repostaje podrás ver el consumo real por tramo.
            </p>
          </div>
        </div>
      ) : (
        <DrivingModeSelector
          value={drivingMode}
          onChange={v => { setDrivingMode(v); setErrors(prev => { const n = { ...prev }; delete n.drivingMode; return n }) }}
          error={errors.drivingMode}
          context="refuel"
          accentColor="orange"
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Fecha" error={errors.date}>
          <input type="date" value={f.date} onChange={e => set('date', e.target.value)} className={inp(errors.date, 'orange')} />
        </Field>
        <Field label="Litros echados" error={errors.liters}>
          <input type="number" step="0.01" min="0" placeholder="ej. 35,5" value={f.liters} onChange={e => set('liters', e.target.value)} className={inp(errors.liters, 'orange')} />
        </Field>
        <Field label="Precio total (€)" error={errors.totalPrice}>
          <input type="number" step="0.01" min="0" placeholder="ej. 58,40" value={f.totalPrice} onChange={e => set('totalPrice', e.target.value)} className={inp(errors.totalPrice, 'orange')} />
        </Field>
        <Field label="€/litro" error={errors.pricePerLiter}>
          <input type="number" step="0.001" min="0" placeholder="ej. 1,645" value={f.pricePerLiter} onChange={e => set('pricePerLiter', e.target.value)} className={inp(errors.pricePerLiter, 'orange')} />
        </Field>
      </div>

      <Field label="Odómetro (km en el momento del repostaje)" error={errors.odometer}>
        <input type="number" min="0" placeholder="ej. 5420" value={f.odometer} onChange={e => set('odometer', e.target.value)} className={inp(errors.odometer, 'orange')} />
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
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-jaecoo-secondary bg-jaecoo-elevated hover:bg-jaecoo-border-strong rounded-xl transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting} className="px-5 py-2 text-sm font-bold text-white bg-jaecoo-fuel hover:brightness-110 disabled:opacity-50 rounded-xl transition-all">
          {isSubmitting ? 'Guardando…' : initial ? 'Actualizar' : 'Guardar repostaje'}
        </button>
      </div>
    </form>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-jaecoo-muted">{label}</label>
      {children}
      {error && <p className="text-xs text-jaecoo-danger">{error}</p>}
    </div>
  )
}

function inp(error?: string, color: 'blue' | 'orange' = 'blue') {
  const focus = color === 'orange' ? 'focus:border-jaecoo-fuel' : 'focus:border-jaecoo-electric'
  return `w-full rounded-lg border px-3 py-2 text-sm text-jaecoo-primary outline-none transition-colors
    ${error
      ? 'border-jaecoo-danger/40 bg-jaecoo-danger/5 focus:border-jaecoo-danger'
      : `border-jaecoo-border bg-jaecoo-elevated ${focus}`
    }
    placeholder:text-jaecoo-muted`
}
