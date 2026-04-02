import { useState, useEffect, useRef } from 'react'
import { X, Zap, Fuel, Save } from 'lucide-react'
import type { ElectricCharge, FuelRefuel } from '../types'
import { useData } from '../context/DataContext'
import { getKnownChargingStations, getKnownFuelStations } from '../utils/calculations'

type Mode = 'electric' | 'fuel'

interface QuickEntryModalProps {
  mode: Mode
  onClose: () => void
  onSaveCharge: (data: Omit<ElectricCharge, 'id'>) => Promise<void>
  onSaveFuel: (data: Omit<FuelRefuel, 'id'>) => Promise<void>
}

export default function QuickEntryModal({ mode: initialMode, onClose, onSaveCharge, onSaveFuel }: QuickEntryModalProps) {
  const { data } = useData()
  const [mode, setMode] = useState<Mode>(initialMode)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const odoRef = useRef<HTMLInputElement>(null)

  // Shared
  const [odometer, setOdometer] = useState('')
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10))

  // Electric
  const [kWh, setKWh] = useState('')
  const [pricePerKWh, setPricePerKWh] = useState('')

  // Fuel
  const [liters, setLiters] = useState('')
  const [totalPrice, setTotalPrice] = useState('')
  const [pricePerLiter, setPricePerLiter] = useState('')
  const [lastFuelChanged, setLastFuelChanged] = useState<'total' | 'perLiter' | null>(null)

  // Pre-fill station from last record
  const lastCharge = [...data.electricCharges].sort((a, b) => b.odometer - a.odometer)[0]
  const lastRefuel = [...data.fuelRefuels].sort((a, b) => b.odometer - a.odometer)[0]
  const knownChargeStations = getKnownChargingStations(data.electricCharges)
  const knownFuelStations = getKnownFuelStations(data.fuelRefuels)
  const [stationName, setStationName] = useState(
    mode === 'electric' ? (lastCharge?.stationName ?? '') : (lastRefuel?.stationName ?? '')
  )
  const [stationAddress, setStationAddress] = useState(
    mode === 'electric' ? (lastCharge?.stationAddress ?? '') : (lastRefuel?.stationAddress ?? '')
  )

  // Sync station when mode changes
  useEffect(() => {
    if (mode === 'electric') {
      setStationName(lastCharge?.stationName ?? '')
      setStationAddress(lastCharge?.stationAddress ?? '')
    } else {
      setStationName(lastRefuel?.stationName ?? '')
      setStationAddress(lastRefuel?.stationAddress ?? '')
    }
    setError('')
  }, [mode]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-calculate fuel price
  useEffect(() => {
    const l = parseFloat(liters)
    const t = parseFloat(totalPrice)
    const p = parseFloat(pricePerLiter)
    if (l > 0) {
      if (lastFuelChanged === 'total' && t > 0) setPricePerLiter((t / l).toFixed(3))
      else if (lastFuelChanged === 'perLiter' && p > 0) setTotalPrice((p * l).toFixed(2))
    }
  }, [liters, totalPrice, pricePerLiter, lastFuelChanged])

  // Trap Escape key
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = '' }
  }, [onClose])

  // Focus odometer on open
  useEffect(() => { setTimeout(() => odoRef.current?.focus(), 100) }, [])

  const knownStations = mode === 'electric' ? knownChargeStations : knownFuelStations

  const handleSave = async () => {
    setError('')
    const odo = parseFloat(odometer)
    if (!odometer || isNaN(odo)) return setError('Introduce el odómetro')

    if (mode === 'electric') {
      const kwh = parseFloat(kWh)
      const pKwh = parseFloat(pricePerKWh)
      if (!kWh || kwh <= 0) return setError('Introduce los kWh')
      if (!pricePerKWh || pKwh <= 0) return setError('Introduce el precio por kWh')
      if (!stationName) return setError('Introduce el nombre de la estación')
      setSaving(true)
      try {
        await onSaveCharge({
          date,
          kWh: kwh,
          pricePerKWh: pKwh,
          totalPriceGross: parseFloat((kwh * pKwh).toFixed(2)),
          totalPrice: parseFloat((kwh * pKwh).toFixed(2)),
          odometer: odo,
          stationName,
          stationAddress,
        })
        onClose()
      } catch { setError('Error al guardar'); setSaving(false) }
    } else {
      const l = parseFloat(liters)
      const t = parseFloat(totalPrice)
      const p = parseFloat(pricePerLiter)
      if (!liters || l <= 0) return setError('Introduce los litros')
      if (!totalPrice || t <= 0) return setError('Introduce el precio total')
      if (!stationName) return setError('Introduce el nombre de la estación')
      setSaving(true)
      try {
        await onSaveFuel({
          date,
          liters: l,
          totalPrice: t,
          pricePerLiter: p || parseFloat((t / l).toFixed(3)),
          odometer: odo,
          stationName,
          stationAddress,
        })
        onClose()
      } catch { setError('Error al guardar'); setSaving(false) }
    }
  }

  const isElectric = mode === 'electric'
  const accent = isElectric ? 'jaecoo-electric' : 'jaecoo-fuel'
  const accentDim = isElectric ? 'jaecoo-electric-dim' : 'jaecoo-fuel-dim'
  const inputFocus = isElectric ? 'focus:border-jaecoo-electric' : 'focus:border-jaecoo-fuel'

  const bigInp = `w-full bg-jaecoo-elevated border border-jaecoo-border ${inputFocus} rounded-2xl
    px-5 py-4 text-2xl font-bold text-jaecoo-primary outline-none transition-colors
    placeholder:text-jaecoo-muted placeholder:font-normal`

  return (
    <div className="fixed inset-0 z-50 flex flex-col" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      {/* Sheet — slides up from bottom */}
      <div className="relative mt-auto w-full max-w-lg mx-auto bg-jaecoo-surface border border-jaecoo-border-strong rounded-t-3xl shadow-j-elevated animate-fade-in px-5 pt-5 pb-8 flex flex-col gap-5">

        {/* Handle + header */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode('electric')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all
                ${isElectric
                  ? 'bg-jaecoo-electric-dim text-jaecoo-electric border border-jaecoo-electric/30'
                  : 'bg-jaecoo-elevated text-jaecoo-muted border border-jaecoo-border hover:text-jaecoo-secondary'
                }`}
            >
              <Zap size={14} /> Recarga
            </button>
            <button
              type="button"
              onClick={() => setMode('fuel')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all
                ${!isElectric
                  ? 'bg-jaecoo-fuel-dim text-jaecoo-fuel border border-jaecoo-fuel/30'
                  : 'bg-jaecoo-elevated text-jaecoo-muted border border-jaecoo-border hover:text-jaecoo-secondary'
                }`}
            >
              <Fuel size={14} /> Repostaje
            </button>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-jaecoo-muted hover:text-jaecoo-secondary hover:bg-jaecoo-elevated transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Date */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-jaecoo-muted shrink-0">Fecha</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className={`flex-1 bg-jaecoo-elevated border border-jaecoo-border ${inputFocus} rounded-xl px-3 py-2 text-sm text-jaecoo-primary outline-none transition-colors`}
          />
        </div>

        {/* Big inputs */}
        <div className="space-y-3">
          <div className="relative">
            <input
              ref={odoRef}
              type="number"
              inputMode="numeric"
              min="0"
              placeholder="Odómetro (km)"
              value={odometer}
              onChange={e => setOdometer(e.target.value)}
              className={bigInp}
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-semibold text-jaecoo-muted pointer-events-none">km</span>
          </div>

          {isElectric ? (
            <>
              <div className="relative">
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  placeholder="kWh recargados"
                  value={kWh}
                  onChange={e => setKWh(e.target.value)}
                  className={bigInp}
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-semibold text-jaecoo-muted pointer-events-none">kWh</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.001"
                  min="0"
                  placeholder="Precio por kWh"
                  value={pricePerKWh}
                  onChange={e => setPricePerKWh(e.target.value)}
                  className={bigInp}
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-semibold text-jaecoo-muted pointer-events-none">€/kWh</span>
              </div>
            </>
          ) : (
            <>
              <div className="relative">
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  placeholder="Litros"
                  value={liters}
                  onChange={e => setLiters(e.target.value)}
                  className={bigInp}
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-semibold text-jaecoo-muted pointer-events-none">L</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    placeholder="Total €"
                    value={totalPrice}
                    onChange={e => { setTotalPrice(e.target.value); setLastFuelChanged('total') }}
                    className={`${bigInp} text-xl`}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-jaecoo-muted pointer-events-none">€</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.001"
                    min="0"
                    placeholder="€/L"
                    value={pricePerLiter}
                    onChange={e => { setPricePerLiter(e.target.value); setLastFuelChanged('perLiter') }}
                    className={`${bigInp} text-xl`}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-jaecoo-muted pointer-events-none">€/L</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Station selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-jaecoo-muted uppercase tracking-widest">Estación</label>
          <div className="flex flex-wrap gap-2 mb-1">
            {knownStations.slice(0, 4).map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { setStationName(s.name); setStationAddress(s.address) }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border
                  ${stationName === s.name
                    ? `bg-${accentDim} text-${accent} border-${accent}/30`
                    : 'bg-jaecoo-elevated text-jaecoo-secondary border-jaecoo-border hover:border-jaecoo-border-strong'
                  }`}
              >
                {s.name}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Nombre de la estación…"
            value={stationName}
            onChange={e => setStationName(e.target.value)}
            className={`w-full bg-jaecoo-elevated border border-jaecoo-border ${inputFocus} rounded-xl px-4 py-2.5 text-sm text-jaecoo-primary outline-none transition-colors placeholder:text-jaecoo-muted`}
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-jaecoo-danger bg-jaecoo-danger/10 border border-jaecoo-danger/20 rounded-xl px-4 py-2.5 text-center font-medium">
            {error}
          </p>
        )}

        {/* Save button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={`w-full py-4 rounded-2xl text-base font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50
            ${isElectric
              ? 'bg-jaecoo-electric text-jaecoo-base hover:brightness-110 shadow-j-electric'
              : 'bg-jaecoo-fuel text-white hover:brightness-110 shadow-j-fuel'
            }`}
        >
          <Save size={18} />
          {saving ? 'Guardando…' : isElectric ? 'Guardar recarga' : 'Guardar repostaje'}
        </button>
      </div>
    </div>
  )
}
