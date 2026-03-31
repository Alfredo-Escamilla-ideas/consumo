import { useState, useEffect } from 'react'
import type { ElectricCharge } from '../../types'

interface ChargeFormProps {
  initial?: ElectricCharge
  onSubmit: (data: Omit<ElectricCharge, 'id'>) => void
  onCancel: () => void
  isSubmitting?: boolean
}

const EMPTY = {
  date: new Date().toISOString().substring(0, 10),
  kWh: '',
  totalPrice: '',
  pricePerKWh: '',
  odometerStart: '',
  odometerEnd: '',
  stationName: '',
  stationAddress: '',
  notes: '',
}

export default function ChargeForm({ initial, onSubmit, onCancel, isSubmitting }: ChargeFormProps) {
  const [f, setF] = useState(
    initial
      ? {
          date: initial.date,
          kWh: String(initial.kWh),
          totalPrice: String(initial.totalPrice),
          pricePerKWh: String(initial.pricePerKWh),
          odometerStart: String(initial.odometerStart),
          odometerEnd: String(initial.odometerEnd),
          stationName: initial.stationName,
          stationAddress: initial.stationAddress,
          notes: initial.notes ?? '',
        }
      : EMPTY
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Auto-calc pricePerKWh when kWh & totalPrice change
  useEffect(() => {
    const kwh = parseFloat(f.kWh)
    const price = parseFloat(f.totalPrice)
    if (kwh > 0 && price > 0 && !f.pricePerKWh) {
      setF(prev => ({ ...prev, pricePerKWh: (price / kwh).toFixed(4) }))
    }
  }, [f.kWh, f.totalPrice]) // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k: keyof typeof EMPTY, v: string) => {
    setF(prev => ({ ...prev, [k]: v }))
    setErrors(prev => { const n = { ...prev }; delete n[k]; return n })
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!f.date) e.date = 'Requerido'
    if (!f.kWh || parseFloat(f.kWh) <= 0) e.kWh = 'Introduce los kWh'
    if (!f.totalPrice || parseFloat(f.totalPrice) <= 0) e.totalPrice = 'Introduce el precio total'
    if (!f.pricePerKWh || parseFloat(f.pricePerKWh) <= 0) e.pricePerKWh = 'Introduce el €/kWh'
    if (!f.odometerStart) e.odometerStart = 'Requerido'
    if (!f.odometerEnd) e.odometerEnd = 'Requerido'
    if (parseFloat(f.odometerEnd) < parseFloat(f.odometerStart)) e.odometerEnd = 'Debe ser mayor que el km inicial'
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
      kWh: parseFloat(f.kWh),
      totalPrice: parseFloat(f.totalPrice),
      pricePerKWh: parseFloat(f.pricePerKWh),
      odometerStart: parseFloat(f.odometerStart),
      odometerEnd: parseFloat(f.odometerEnd),
      stationName: f.stationName,
      stationAddress: f.stationAddress,
      notes: f.notes || undefined,
    })
  }

  const km = parseFloat(f.odometerEnd) - parseFloat(f.odometerStart)
  const kwh = parseFloat(f.kWh)
  const efficiency = km > 0 && kwh > 0 ? ((kwh / km) * 100).toFixed(2) : null
  const chargePercent = kwh > 0 ? ((kwh / 18.3) * 100).toFixed(0) : null

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Preview badge */}
      {(efficiency || chargePercent) && (
        <div className="flex gap-3 flex-wrap">
          {efficiency && (
            <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-blue-100">
              ⚡ {efficiency} kWh/100km
            </span>
          )}
          {chargePercent && (
            <span className="inline-flex items-center gap-1.5 bg-violet-50 text-violet-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-violet-100">
              🔋 {chargePercent}% batería cargada
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Fecha" error={errors.date}>
          <input type="date" value={f.date} onChange={e => set('date', e.target.value)} className={input(errors.date)} />
        </Field>
        <Field label="kWh recargados" error={errors.kWh}>
          <input type="number" step="0.01" min="0" placeholder="e.g. 15.5" value={f.kWh} onChange={e => set('kWh', e.target.value)} className={input(errors.kWh)} />
        </Field>
        <Field label="Precio total (€)" error={errors.totalPrice}>
          <input type="number" step="0.01" min="0" placeholder="e.g. 4.20" value={f.totalPrice} onChange={e => set('totalPrice', e.target.value)} className={input(errors.totalPrice)} />
        </Field>
        <Field label="Monedero Waylet €" error={errors.pricePerKWh}>
          <input type="number" step="0.0001" min="0" placeholder="e.g. 0.27" value={f.pricePerKWh} onChange={e => set('pricePerKWh', e.target.value)} className={input(errors.pricePerKWh)} />
        </Field>
        <Field label="Km al inicio (última carga)" error={errors.odometerStart}>
          <input type="number" min="0" placeholder="e.g. 1200" value={f.odometerStart} onChange={e => set('odometerStart', e.target.value)} className={input(errors.odometerStart)} />
        </Field>
        <Field label="Km al final (esta carga)" error={errors.odometerEnd}>
          <input type="number" min="0" placeholder="e.g. 1380" value={f.odometerEnd} onChange={e => set('odometerEnd', e.target.value)} className={input(errors.odometerEnd)} />
        </Field>
      </div>

      <Field label="Nombre de la estación" error={errors.stationName}>
        <input type="text" placeholder="e.g. Zunder Madrid" value={f.stationName} onChange={e => set('stationName', e.target.value)} className={input(errors.stationName)} />
      </Field>
      <Field label="Dirección" error={errors.stationAddress}>
        <input type="text" placeholder="e.g. Calle Gran Vía 32, Madrid" value={f.stationAddress} onChange={e => set('stationAddress', e.target.value)} className={input(errors.stationAddress)} />
      </Field>
      <Field label="Notas (opcional)">
        <input type="text" placeholder="Observaciones…" value={f.notes} onChange={e => set('notes', e.target.value)} className={input()} />
      </Field>

      <div className="flex gap-3 pt-2 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting} className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-lg transition-colors">
          {isSubmitting ? 'Guardando…' : initial ? 'Actualizar' : 'Guardar recarga'}
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

function input(error?: string) {
  return `w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors
    ${error ? 'border-red-300 focus:border-red-400 bg-red-50' : 'border-slate-200 focus:border-blue-400 bg-white'}
    placeholder:text-slate-400`
}
