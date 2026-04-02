import { useState, useEffect } from 'react'
import type { ElectricCharge, DrivingMode } from '../../types'
import StationInput from '../StationInput'
import DrivingModeSelector from '../DrivingModeSelector'
import { useData } from '../../context/DataContext'
import { getKnownChargingStations, formatCurrency, formatNumber, BATTERY_CAPACITY_KWH } from '../../utils/calculations'

interface ChargeFormProps {
  initial?: ElectricCharge
  onSubmit: (data: Omit<ElectricCharge, 'id'>) => void
  onCancel: () => void
  isSubmitting?: boolean
}

const EMPTY = {
  date: new Date().toISOString().substring(0, 10),
  kWh: '',
  pricePerKWh: '',
  batteryPercent: '',
  wayletBefore: '',
  wayletAfter: '',
  odometer: '',
  stationName: '',
  stationAddress: '',
  notes: '',
}

function calcWaylet(kWh: number, pricePerKWh: number, wayletBefore: number) {
  if (kWh <= 0 || pricePerKWh <= 0) return null
  const gross = kWh * pricePerKWh
  const wayletUsed = Math.min(wayletBefore, gross)
  const cashPaid = gross - wayletUsed
  const wayletReturn = gross * 0.5
  const newBalance = (wayletBefore - wayletUsed) + wayletReturn
  const effectivePerKWh = kWh > 0 ? cashPaid / kWh : 0
  return { gross, wayletUsed, cashPaid, wayletReturn, newBalance, effectivePerKWh }
}

export default function ChargeForm({ initial, onSubmit, onCancel, isSubmitting }: ChargeFormProps) {
  const { data } = useData()
  const knownStations = getKnownChargingStations(data.electricCharges)
  const sortedCharges = [...data.electricCharges].sort((a, b) => a.odometer - b.odometer)
  const otherCharges = sortedCharges.filter(c => c.id !== initial?.id)
  const isFirstEntry = otherCharges.length === 0

  const [f, setF] = useState(
    initial
      ? {
          date: initial.date,
          kWh: String(initial.kWh),
          pricePerKWh: String(initial.pricePerKWh),
          batteryPercent: initial.batteryPercent != null ? String(initial.batteryPercent) : '',
          wayletBefore: initial.wayletBefore != null ? String(initial.wayletBefore) : '',
          wayletAfter:  initial.wayletAfter  != null ? String(initial.wayletAfter)  : '',
          odometer: String(initial.odometer),
          stationName: initial.stationName,
          stationAddress: initial.stationAddress,
          notes: initial.notes ?? '',
        }
      : EMPTY
  )
  const [drivingMode, setDrivingMode] = useState<DrivingMode | ''>(initial?.drivingMode ?? '')
  const [wayletEnabled, setWayletEnabled] = useState(initial?.wayletBefore != null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = (k: keyof typeof EMPTY, v: string) => {
    setF(prev => ({ ...prev, [k]: v }))
    setErrors(prev => { const n = { ...prev }; delete n[k]; return n })
  }

  const kWh = parseFloat(f.kWh)
  const pricePerKWh = parseFloat(f.pricePerKWh)
  const wayletBefore = parseFloat(f.wayletBefore) || 0
  const waylet = wayletEnabled && !isNaN(kWh) && !isNaN(pricePerKWh)
    ? calcWaylet(kWh, pricePerKWh, wayletBefore)
    : null

  useEffect(() => {
    if (wayletEnabled && waylet && !f.wayletAfter) {
      setF(prev => ({ ...prev, wayletAfter: waylet.newBalance.toFixed(2) }))
    }
  }, [waylet?.newBalance, wayletEnabled]) // eslint-disable-line react-hooks/exhaustive-deps

  const currentOdo = parseFloat(f.odometer)
  const prevCharge = !isNaN(currentOdo) && !isFirstEntry
    ? (() => { const arr = otherCharges.filter(c => c.odometer < currentOdo); return arr[arr.length - 1] })()
    : undefined
  const kmSinceLast = prevCharge && !isNaN(currentOdo) ? currentOdo - prevCharge.odometer : null
  const prevEfficiency = kmSinceLast && kmSinceLast > 0 ? (prevCharge!.kWh / kmSinceLast) * 100 : null
  const chargePercent = kWh > 0 ? Math.min(100, Math.round((kWh / BATTERY_CAPACITY_KWH) * 100)) : null

  const validate = () => {
    const e: Record<string, string> = {}
    if (!isFirstEntry && !drivingMode) e.drivingMode = 'Selecciona el tipo de trayecto'
    if (!f.date) e.date = 'Requerido'
    if (!f.kWh || kWh <= 0) e.kWh = 'Introduce los kWh'
    if (!f.pricePerKWh || pricePerKWh <= 0) e.pricePerKWh = 'Introduce el precio por kWh'
    if (!f.odometer) e.odometer = 'Requerido'
    if (!f.stationName) e.stationName = 'Requerido'
    if (!f.stationAddress) e.stationAddress = 'Requerido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    const gross = kWh * pricePerKWh
    const cashPaid = waylet ? waylet.cashPaid : gross
    onSubmit({
      date: f.date,
      kWh,
      pricePerKWh,
      totalPriceGross: parseFloat(gross.toFixed(2)),
      totalPrice: parseFloat(cashPaid.toFixed(2)),
      batteryPercent: f.batteryPercent !== '' ? parseInt(f.batteryPercent, 10) : undefined,
      wayletBefore: wayletEnabled && f.wayletBefore !== '' ? parseFloat(f.wayletBefore) : undefined,
      wayletAfter:  wayletEnabled && f.wayletAfter  !== '' ? parseFloat(f.wayletAfter)  : undefined,
      odometer: parseFloat(f.odometer),
      stationName: f.stationName,
      stationAddress: f.stationAddress,
      drivingMode: drivingMode as DrivingMode || undefined,
      notes: f.notes || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* First entry OR driving mode */}
      {isFirstEntry ? (
        <div className="bg-jaecoo-electric-dim border border-jaecoo-electric/20 rounded-xl px-4 py-3 flex items-start gap-2">
          <span className="text-lg leading-none mt-0.5">📌</span>
          <div>
            <p className="font-semibold text-sm text-jaecoo-electric">Primer registro — punto de referencia</p>
            <p className="text-xs text-jaecoo-electric/70 mt-0.5">
              Este registro servirá como punto de partida. A partir de la siguiente recarga podrás ver el consumo real por tramo.
            </p>
          </div>
        </div>
      ) : (
        <DrivingModeSelector
          value={drivingMode}
          onChange={v => { setDrivingMode(v); setErrors(prev => { const n = { ...prev }; delete n.drivingMode; return n }) }}
          error={errors.drivingMode}
          context="charge"
          accentColor="blue"
        />
      )}

      {/* Odometer + date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Fecha" error={errors.date}>
          <input type="date" value={f.date} onChange={e => set('date', e.target.value)} className={inp(errors.date)} />
        </Field>
        <Field label="Km actuales (odómetro)" error={errors.odometer}>
          <input type="number" min="0" placeholder="ej. 5420" value={f.odometer} onChange={e => set('odometer', e.target.value)} className={inp(errors.odometer)} />
        </Field>
      </div>

      {/* km preview chips */}
      {(kmSinceLast !== null || prevEfficiency || chargePercent) && (
        <div className="flex gap-2 flex-wrap">
          {kmSinceLast !== null && kmSinceLast > 0 && (
            <span className="inline-flex items-center gap-1.5 bg-jaecoo-elevated text-jaecoo-secondary text-xs font-semibold px-3 py-1.5 rounded-full border border-jaecoo-border">
              📍 {kmSinceLast.toLocaleString('es-ES')} km desde última recarga
            </span>
          )}
          {prevEfficiency && (
            <span className="inline-flex items-center gap-1.5 bg-jaecoo-electric-dim text-jaecoo-electric text-xs font-semibold px-3 py-1.5 rounded-full border border-jaecoo-electric/20">
              ⚡ {prevEfficiency.toFixed(2)} kWh/100km (tramo anterior)
            </span>
          )}
          {chargePercent !== null && (
            <span className="inline-flex items-center gap-1.5 bg-violet-500/10 text-violet-400 text-xs font-semibold px-3 py-1.5 rounded-full border border-violet-500/20">
              🔋 {chargePercent}% batería cargada
            </span>
          )}
        </div>
      )}

      {/* Main charge data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="kWh recargados" error={errors.kWh}>
          <input type="number" step="0.01" min="0" placeholder="ej. 18,5" value={f.kWh} onChange={e => set('kWh', e.target.value)} className={inp(errors.kWh)} />
        </Field>
        <Field label="Precio del kWh — tarifa (€)" error={errors.pricePerKWh}>
          <input type="number" step="0.001" min="0" placeholder="ej. 0,48" value={f.pricePerKWh} onChange={e => set('pricePerKWh', e.target.value)} className={inp(errors.pricePerKWh)} />
        </Field>
        <Field label="% batería al terminar la recarga">
          <div className="relative">
            <input type="number" min="0" max="100" placeholder="ej. 100" value={f.batteryPercent} onChange={e => set('batteryPercent', e.target.value)} className={`${inp()} pr-8`} />
            <span className="absolute right-3 top-2.5 text-sm text-jaecoo-muted pointer-events-none">%</span>
          </div>
        </Field>
      </div>

      {/* Waylet toggle */}
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <div className="relative">
          <input
            type="checkbox"
            className="sr-only"
            checked={wayletEnabled}
            onChange={e => {
              setWayletEnabled(e.target.checked)
              if (!e.target.checked) { set('wayletBefore', ''); set('wayletAfter', '') }
            }}
          />
          <div className={`w-10 h-6 rounded-full transition-colors ${wayletEnabled ? 'bg-jaecoo-electric' : 'bg-jaecoo-elevated border border-jaecoo-border-strong'}`} />
          <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${wayletEnabled ? 'translate-x-4' : ''}`} />
        </div>
        <span className="text-sm font-medium text-jaecoo-secondary">
          💳 ¿Recarga compatible con saldo Waylet?
        </span>
      </label>

      {/* Waylet section */}
      {wayletEnabled && (
        <div className="bg-jaecoo-elevated rounded-xl border border-jaecoo-border p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Saldo Waylet antes de recargar (€)">
              <input type="number" step="0.01" min="0" placeholder="ej. 4,20" value={f.wayletBefore} onChange={e => { set('wayletBefore', e.target.value); set('wayletAfter', '') }} className={inp()} />
            </Field>
          </div>

          {/* Live breakdown */}
          {waylet && (
            <div className="bg-jaecoo-card rounded-lg border border-jaecoo-border divide-y divide-jaecoo-border/50">
              <WayletRow label="Coste bruto de la recarga" value={formatCurrency(waylet.gross)} sub={`${formatNumber(kWh)} kWh × ${formatNumber(pricePerKWh, 3)} €/kWh`} />
              <WayletRow label="Saldo Waylet utilizado" value={`− ${formatCurrency(waylet.wayletUsed)}`} valueColor="text-jaecoo-fuel" />
              <WayletRow label="Dinero real pagado" value={formatCurrency(waylet.cashPaid)} valueColor="text-jaecoo-primary font-bold" />
              <WayletRow label="Retorno Waylet (+50%)" value={`+ ${formatCurrency(waylet.wayletReturn)}`} valueColor="text-emerald-400" />
              <WayletRow label="Nuevo saldo Waylet" value={formatCurrency(waylet.newBalance)} valueColor="text-emerald-400 font-semibold" />
              <WayletRow label="Precio efectivo por kWh" value={`${formatNumber(waylet.effectivePerKWh, 4)} €/kWh`} valueColor="text-jaecoo-electric font-bold" />
            </div>
          )}

          <Field label="Saldo Waylet después (€) — para verificar">
            <input type="number" step="0.01" min="0" placeholder={waylet ? waylet.newBalance.toFixed(2) : 'ej. 4,00'} value={f.wayletAfter} onChange={e => set('wayletAfter', e.target.value)} className={inp()} />
          </Field>
        </div>
      )}

      <StationInput
        nameValue={f.stationName}
        addressValue={f.stationAddress}
        onChangeName={v => set('stationName', v)}
        onChangeAddress={v => set('stationAddress', v)}
        known={knownStations}
        nameError={errors.stationName}
        addressError={errors.stationAddress}
        accentColor="blue"
      />

      <Field label="Notas (opcional)">
        <input type="text" placeholder="Observaciones…" value={f.notes} onChange={e => set('notes', e.target.value)} className={inp()} />
      </Field>

      <div className="flex gap-3 pt-2 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-jaecoo-secondary bg-jaecoo-elevated hover:bg-jaecoo-border-strong rounded-xl transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting} className="px-5 py-2 text-sm font-bold text-jaecoo-base bg-jaecoo-electric hover:brightness-110 disabled:opacity-50 rounded-xl transition-all">
          {isSubmitting ? 'Guardando…' : initial ? 'Actualizar' : 'Guardar recarga'}
        </button>
      </div>
    </form>
  )
}

function WayletRow({ label, value, sub, valueColor = 'text-jaecoo-secondary' }: {
  label: string; value: string; sub?: string; valueColor?: string
}) {
  return (
    <div className="flex justify-between items-center px-3 py-2">
      <div>
        <span className="text-xs text-jaecoo-muted">{label}</span>
        {sub && <p className="text-[10px] text-jaecoo-muted/70">{sub}</p>}
      </div>
      <span className={`text-xs ${valueColor}`}>{value}</span>
    </div>
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

function inp(error?: string) {
  return `w-full rounded-lg border px-3 py-2 text-sm text-jaecoo-primary outline-none transition-colors
    ${error
      ? 'border-jaecoo-danger/40 bg-jaecoo-danger/5 focus:border-jaecoo-danger'
      : 'border-jaecoo-border bg-jaecoo-elevated focus:border-jaecoo-electric'
    }
    placeholder:text-jaecoo-muted`
}
