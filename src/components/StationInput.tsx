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
  const focus = accentColor === 'blue' ? 'focus:border-jaecoo-electric' : 'focus:border-jaecoo-fuel'

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

  const borderName = nameError
    ? 'border-jaecoo-danger/40 bg-jaecoo-danger/5'
    : 'border-jaecoo-border bg-jaecoo-elevated'
  const borderAddr = addressError
    ? 'border-jaecoo-danger/40 bg-jaecoo-danger/5'
    : 'border-jaecoo-border bg-jaecoo-elevated'

  return (
    <div className="space-y-3">
      {/* Station name with autocomplete */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-jaecoo-muted">Nombre de la estación</label>
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
            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors pr-8 text-jaecoo-primary ${borderName} ${focus} placeholder:text-jaecoo-muted`}
          />
          {known.length > 0 && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => { setFiltered(known); setOpen(v => !v) }}
              className="absolute right-2.5 top-2.5 text-jaecoo-muted hover:text-jaecoo-secondary"
            >
              <ChevronDown size={14} />
            </button>
          )}

          {/* Dropdown */}
          {open && filtered.length > 0 && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-jaecoo-card rounded-xl border border-jaecoo-border-strong shadow-j-elevated overflow-hidden max-h-48 overflow-y-auto">
              {filtered.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => select(s)}
                  className="w-full text-left px-3 py-2.5 hover:bg-jaecoo-elevated transition-colors border-b border-jaecoo-border last:border-0"
                >
                  <p className="text-sm font-medium text-jaecoo-primary">{s.name}</p>
                  <p className="text-xs text-jaecoo-muted flex items-center gap-1 mt-0.5">
                    <MapPin size={10} /> {s.address}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
        {nameError && <p className="text-xs text-jaecoo-danger">{nameError}</p>}
      </div>

      {/* Address */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-jaecoo-muted">Dirección</label>
        <input
          type="text"
          placeholder="e.g. Calle Gran Vía 32, Madrid"
          value={addressValue}
          onChange={e => onChangeAddress(e.target.value)}
          className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors text-jaecoo-primary ${borderAddr} ${focus} placeholder:text-jaecoo-muted`}
        />
        {addressError && <p className="text-xs text-jaecoo-danger">{addressError}</p>}
      </div>
    </div>
  )
}
