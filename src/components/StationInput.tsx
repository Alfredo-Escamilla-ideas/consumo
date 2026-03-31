import { useState, useRef, useEffect } from 'react'
import { MapPin, ChevronDown } from 'lucide-react'
import type { KnownStation } from '../utils/calculations'

interface StationInputProps {
  nameValue: string
  addressValue: string
  onChangeName: (v: string) => void
  onChangeAddress: (v: string) => void
  known: KnownStation[]
  nameError?: string
  addressError?: string
  accentColor?: 'blue' | 'orange'
}

export default function StationInput({
  nameValue, addressValue, onChangeName, onChangeAddress,
  known, nameError, addressError, accentColor = 'blue',
}: StationInputProps) {
  const [open, setOpen] = useState(false)
  const [filtered, setFiltered] = useState<KnownStation[]>([])
  const ref = useRef<HTMLDivElement>(null)
  const focus = accentColor === 'blue' ? 'focus:border-blue-400' : 'focus:border-orange-400'

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleNameChange = (v: string) => {
    onChangeName(v)
    const q = v.toLowerCase()
    const matches = known.filter(s => s.name.toLowerCase().includes(q))
    setFiltered(matches)
    setOpen(matches.length > 0 && v.length > 0)
  }

  const select = (s: KnownStation) => {
    onChangeName(s.name)
    onChangeAddress(s.address)
    setOpen(false)
  }

  const borderName = nameError ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'
  const borderAddr = addressError ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'

  return (
    <div className="space-y-3">
      {/* Station name with autocomplete */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">Nombre de la estación</label>
        <div ref={ref} className="relative">
          <input
            type="text"
            placeholder="e.g. Zunder Madrid"
            value={nameValue}
            onChange={e => handleNameChange(e.target.value)}
            onFocus={() => {
              const matches = known.filter(s => s.name.toLowerCase().includes(nameValue.toLowerCase()))
              setFiltered(matches)
              if (matches.length > 0) setOpen(true)
            }}
            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors pr-8 ${borderName} ${focus} placeholder:text-slate-400`}
          />
          {known.length > 0 && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => { setFiltered(known); setOpen(v => !v) }}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <ChevronDown size={14} />
            </button>
          )}

          {/* Dropdown */}
          {open && filtered.length > 0 && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden max-h-48 overflow-y-auto">
              {filtered.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => select(s)}
                  className="w-full text-left px-3 py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                >
                  <p className="text-sm font-medium text-slate-800">{s.name}</p>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin size={10} /> {s.address}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
        {nameError && <p className="text-xs text-red-500">{nameError}</p>}
      </div>

      {/* Address */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">Dirección</label>
        <input
          type="text"
          placeholder="e.g. Calle Gran Vía 32, Madrid"
          value={addressValue}
          onChange={e => onChangeAddress(e.target.value)}
          className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${borderAddr} ${focus} placeholder:text-slate-400`}
        />
        {addressError && <p className="text-xs text-red-500">{addressError}</p>}
      </div>
    </div>
  )
}
