import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, X, Loader2, CircleAlert, CheckCircle2, AlertTriangle, Circle } from 'lucide-react'
import type { Tire, TirePosition, TireType } from '../types'
import { apiGetTires, apiAddTire, apiUpdateTire, apiDeleteTire } from '../services/api'
import { useData } from '../context/DataContext'

// ─── Constants ───────────────────────────────────────────────────────────────

const POSITIONS: { value: TirePosition; label: string; short: string }[] = [
  { value: 'front_left',  label: 'Delantera izquierda', short: 'D. Izq.' },
  { value: 'front_right', label: 'Delantera derecha',   short: 'D. Der.' },
  { value: 'rear_left',   label: 'Trasera izquierda',   short: 'T. Izq.' },
  { value: 'rear_right',  label: 'Trasera derecha',     short: 'T. Der.' },
  { value: 'spare',       label: 'Repuesto',            short: 'Repuesto' },
]

const TYPES: { value: TireType; label: string; color: string }[] = [
  { value: 'summer',   label: 'Verano',     color: 'text-jaecoo-fuel bg-jaecoo-fuel-dim' },
  { value: 'winter',   label: 'Invierno',   color: 'text-jaecoo-electric bg-jaecoo-electric-dim' },
  { value: 'allseason',label: 'All-Season', color: 'text-emerald-400 bg-emerald-500/10' },
]

const TIRE_BRANDS = [
  'Giti', 'Michelin', 'Bridgestone', 'Continental', 'Goodyear', 'Pirelli',
  'Dunlop', 'Hankook', 'Yokohama', 'Falken', 'Kumho', 'Toyo', 'Nexen',
  'Cooper', 'BFGoodrich', 'Uniroyal', 'Semperit', 'Firestone', 'General',
  'Vredestein', 'Maxxis', 'Nankang', 'Sailun', 'Laufenn', 'Kleber',
  'Nokian', 'Barum', 'Sava', 'Matador', 'Fulda', 'Ceat', 'Apollo',
  'MRF', 'Petlas', 'Triangle', 'Linglong', 'Zeetex', 'Atturo', 'Westlake',
  'Accelera', 'Aplus', 'Arivo', 'Austone', 'Boto', 'Centara', 'Chaoyang',
  'Comforser', 'Dayton', 'Delinte', 'Doublestar', 'Duraturn', 'Eldorado',
  'Evergreen', 'Fortuna', 'Galaxy', 'Goodride', 'GT Radial', 'Headway',
  'Hifly', 'Imperial', 'Infinity', 'Interstate', 'Ironman', 'Jinyu',
  'Kenda', 'Landsail', 'Marshal', 'Mazzini', 'Membat', 'Minerva',
  'Momo', 'Nitto', 'Orium', 'Ovation', 'Pace', 'Paxaro', 'Powertrac',
  'Radar', 'Runway', 'Sonar', 'Sportiva', 'Star Performer', 'Starfire',
  'Starmaxx', 'Sunfull', 'Sunwide', 'Superia', 'Taurus', 'Technic',
  'Tigar', 'Torque', 'Tracmax', 'Trazano', 'Tristar', 'Unigrip',
  'Venerdi', 'Vitour', 'Wanli', 'Windforce', 'Windpower', 'Wolking',
  'Wonda', 'Wanstone', 'Yokohama', 'Zeta', 'Zetum',
]

// Tamaños compatibles con Jaecoo 7 PHEV (OEM primero)
const JAECOO7_SIZES = [
  '235/50 R19 103V',  // OEM — Giti GitiComfort F50
  '235/50 R19',
  '235/55 R18',
  '235/55 R18 104V',
  '245/45 R19',
  '245/45 R19 102W',
]

const EMPTY_FORM: Omit<Tire, 'id'> = {
  brand: 'Giti', model: 'GitiComfort F50', type: 'summer', size: '235/50 R19 103V', position: 'front_left',
  purchaseDate: new Date().toISOString().slice(0, 10),
  purchasePrice: undefined, odometerAtInstall: 0, estimatedLifeKm: 40000,
  treadDepthMm: undefined, estimatedChangeDate: undefined, dotCode: undefined, notes: undefined,
}

// ─── Wear helpers ─────────────────────────────────────────────────────────────

function wearInfo(tire: Tire, currentOdo: number) {
  const driven = Math.max(0, currentOdo - tire.odometerAtInstall)
  const pct = Math.min(100, Math.round((driven / tire.estimatedLifeKm) * 100))
  const remaining = Math.max(0, tire.estimatedLifeKm - driven)
  if (pct >= 90) return { pct, driven, remaining, color: 'text-rose-400', bar: 'bg-rose-500',    label: 'Sustituir',    icon: CircleAlert }
  if (pct >= 75) return { pct, driven, remaining, color: 'text-jaecoo-fuel', bar: 'bg-jaecoo-fuel', label: 'Pronto',  icon: AlertTriangle }
  if (pct >= 50) return { pct, driven, remaining, color: 'text-yellow-400', bar: 'bg-yellow-400',  label: 'Mitad',       icon: AlertTriangle }
  return              { pct, driven, remaining, color: 'text-emerald-400',  bar: 'bg-emerald-500', label: 'Buen estado', icon: CheckCircle2 }
}

function daysUntil(dateStr?: string) {
  if (!dateStr) return null
  const diff = Math.round((new Date(dateStr).getTime() - Date.now()) / 86400000)
  return diff
}

// ─── TireCard ────────────────────────────────────────────────────────────────

function TireCard({
  position, tire, currentOdo, onEdit, onDelete,
}: {
  position: typeof POSITIONS[number]
  tire: Tire | undefined
  currentOdo: number
  onEdit: (tire: Tire | null, position: TirePosition) => void
  onDelete: (id: string) => void
}) {
  const isSpare = position.value === 'spare'

  if (!tire) {
    return (
      <button
        onClick={() => onEdit(null, position.value)}
        className={`group border-2 border-dashed border-jaecoo-border hover:border-jaecoo-electric/50 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all hover:bg-jaecoo-electric-dim ${isSpare ? 'p-5' : 'p-8'}`}
      >
        <div className="w-10 h-10 rounded-full bg-jaecoo-elevated flex items-center justify-center group-hover:bg-jaecoo-electric/10 transition-colors">
          <Plus size={18} className="text-jaecoo-muted group-hover:text-jaecoo-electric transition-colors" />
        </div>
        <p className="text-xs text-jaecoo-muted group-hover:text-jaecoo-electric transition-colors font-medium">{position.short}</p>
      </button>
    )
  }

  const w = wearInfo(tire, currentOdo)
  const WearIcon = w.icon
  const days = daysUntil(tire.estimatedChangeDate)
  const typeInfo = TYPES.find(t => t.value === tire.type)!

  return (
    <div className="bg-jaecoo-card border border-jaecoo-border hover:border-jaecoo-border-strong rounded-2xl p-4 flex flex-col gap-3 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-jaecoo-muted">{position.short}</p>
          <p className="text-sm font-bold text-jaecoo-primary truncate mt-0.5">{tire.brand}</p>
          <p className="text-xs text-jaecoo-secondary truncate">{tire.model}</p>
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={() => onEdit(tire, position.value)} className="p-1.5 rounded-lg text-jaecoo-muted hover:text-jaecoo-electric hover:bg-jaecoo-electric-dim transition-colors">
            <Pencil size={13} />
          </button>
          <button onClick={() => onDelete(tire.id)} className="p-1.5 rounded-lg text-jaecoo-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-jaecoo-elevated text-jaecoo-secondary">{tire.size}</span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeInfo.color}`}>{typeInfo.label}</span>
        {tire.dotCode && <span className="text-[10px] px-2 py-0.5 rounded-full bg-jaecoo-elevated text-jaecoo-muted">DOT {tire.dotCode}</span>}
      </div>

      {/* Wear bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <WearIcon size={12} className={w.color} />
            <span className={`text-[11px] font-semibold ${w.color}`}>{w.label}</span>
          </div>
          <span className={`text-xs font-bold ${w.color}`}>{w.pct}%</span>
        </div>
        <div className="h-2 bg-jaecoo-elevated rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${w.bar}`} style={{ width: `${w.pct}%` }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-jaecoo-muted">{w.driven.toLocaleString('es-ES')} km</span>
          <span className="text-[10px] text-jaecoo-muted">{w.remaining.toLocaleString('es-ES')} km restantes</span>
        </div>
      </div>

      {/* Footer info */}
      <div className="border-t border-jaecoo-border pt-2.5 grid grid-cols-2 gap-x-3 gap-y-1">
        {tire.purchaseDate && (
          <div>
            <p className="text-[9px] text-jaecoo-muted uppercase tracking-wide">Compra</p>
            <p className="text-[11px] text-jaecoo-secondary font-medium">{tire.purchaseDate}</p>
          </div>
        )}
        {tire.purchasePrice != null && (
          <div>
            <p className="text-[9px] text-jaecoo-muted uppercase tracking-wide">Precio</p>
            <p className="text-[11px] text-jaecoo-secondary font-medium">{tire.purchasePrice.toFixed(2)} €</p>
          </div>
        )}
        {tire.treadDepthMm != null && (
          <div>
            <p className="text-[9px] text-jaecoo-muted uppercase tracking-wide">Dibujo</p>
            <p className="text-[11px] text-jaecoo-secondary font-medium">{tire.treadDepthMm} mm</p>
          </div>
        )}
        {days !== null && (
          <div>
            <p className="text-[9px] text-jaecoo-muted uppercase tracking-wide">Cambio aprox.</p>
            <p className={`text-[11px] font-semibold ${days < 0 ? 'text-rose-400' : days < 30 ? 'text-jaecoo-fuel' : 'text-jaecoo-secondary'}`}>
              {days < 0 ? `Hace ${Math.abs(days)} días` : days === 0 ? 'Hoy' : `En ${days} días`}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── TireModal (form) ─────────────────────────────────────────────────────────

const inp = 'w-full bg-jaecoo-elevated border border-jaecoo-border rounded-xl px-3 py-2.5 text-sm text-jaecoo-primary placeholder-jaecoo-muted focus:outline-none focus:border-jaecoo-electric transition-colors'
const lbl = 'text-xs font-medium text-jaecoo-secondary mb-1 block'

function TireModal({
  initial, position: defaultPosition, onSave, onClose,
}: {
  initial: Tire | null
  position: TirePosition
  onSave: (tire: Tire) => Promise<void>
  onClose: () => void
}) {
  const [f, setF] = useState<Omit<Tire, 'id'>>(() =>
    initial ? { ...initial } : { ...EMPTY_FORM, position: defaultPosition }
  )
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  function set(k: keyof typeof f, v: unknown) { setF(p => ({ ...p, [k]: v })) }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveError(null)
    try {
      const id = initial?.id ?? crypto.randomUUID()
      await onSave({ id, ...f })
      onClose()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-jaecoo-card border border-jaecoo-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-jaecoo-border sticky top-0 bg-jaecoo-card z-10">
          <h2 className="text-sm font-bold text-jaecoo-primary">{initial ? 'Editar neumático' : 'Nuevo neumático'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-jaecoo-muted hover:text-jaecoo-primary hover:bg-jaecoo-elevated transition-colors"><X size={16} /></button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          <datalist id="tire-brands">
            {TIRE_BRANDS.map(b => <option key={b} value={b} />)}
          </datalist>
          <datalist id="tire-sizes">
            {JAECOO7_SIZES.map(s => <option key={s} value={s} />)}
          </datalist>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Marca *</label>
              <input required list="tire-brands" className={inp} placeholder="Michelin" value={f.brand} onChange={e => set('brand', e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Modelo *</label>
              <input required className={inp} placeholder="Primacy 4" value={f.model} onChange={e => set('model', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Tamaño *</label>
              <input required list="tire-sizes" className={inp} placeholder="235/50 R19" value={f.size} onChange={e => set('size', e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Posición *</label>
              <select required className={inp} value={f.position} onChange={e => set('position', e.target.value as TirePosition)}>
                {POSITIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={lbl}>Tipo</label>
            <div className="flex gap-2">
              {TYPES.map(t => (
                <button key={t.value} type="button"
                  onClick={() => set('type', t.value)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all
                    ${f.type === t.value ? `${t.color} border-current` : 'border-jaecoo-border text-jaecoo-muted hover:border-jaecoo-border-strong'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Fecha de compra *</label>
              <input required type="date" className={inp} value={f.purchaseDate} onChange={e => set('purchaseDate', e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Precio (€)</label>
              <input type="number" step="0.01" min="0" className={inp} placeholder="120.00" value={f.purchasePrice ?? ''} onChange={e => set('purchasePrice', e.target.value ? parseFloat(e.target.value) : undefined)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Km al instalar</label>
              <input type="number" min="0" className={inp} placeholder="0" value={f.odometerAtInstall} onChange={e => set('odometerAtInstall', parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <label className={lbl}>Vida estimada (km)</label>
              <input type="number" min="1000" className={inp} value={f.estimatedLifeKm} onChange={e => set('estimatedLifeKm', parseInt(e.target.value) || 40000)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Profundidad dibujo (mm)</label>
              <input type="number" step="0.1" min="0" max="12" className={inp} placeholder="8.0" value={f.treadDepthMm ?? ''} onChange={e => set('treadDepthMm', e.target.value ? parseFloat(e.target.value) : undefined)} />
            </div>
            <div>
              <label className={lbl}>Código DOT</label>
              <input className={inp} placeholder="3223" maxLength={8} value={f.dotCode ?? ''} onChange={e => set('dotCode', e.target.value || undefined)} />
            </div>
          </div>

          <div>
            <label className={lbl}>Fecha aproximada de cambio</label>
            <input type="date" className={inp} value={f.estimatedChangeDate ?? ''} onChange={e => set('estimatedChangeDate', e.target.value || undefined)} />
          </div>

          <div>
            <label className={lbl}>Notas</label>
            <textarea rows={2} className={`${inp} resize-none`} placeholder="Observaciones..." value={f.notes ?? ''} onChange={e => set('notes', e.target.value || undefined)} />
          </div>

          {saveError && <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">{saveError}</p>}
          <button type="submit" disabled={saving}
            className="w-full py-3 bg-jaecoo-electric text-jaecoo-base font-bold rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
            {saving && <Loader2 size={16} className="animate-spin" />}
            {initial ? 'Guardar cambios' : 'Añadir neumático'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Tires() {
  const { data } = useData()
  const [tires, setTires] = useState<Tire[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ tire: Tire | null; position: TirePosition } | null>(null)

  // Current odometer from latest data
  const allRecords = [...data.electricCharges, ...data.fuelRefuels]
  const currentOdo = allRecords.length > 0 ? Math.max(...allRecords.map(r => r.odometer)) : 0

  const load = useCallback(async () => {
    try { setTires(await apiGetTires()) } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSave(tire: Tire) {
    if (tires.find(t => t.id === tire.id)) {
      await apiUpdateTire(tire)
      setTires(prev => prev.map(t => t.id === tire.id ? tire : t))
    } else {
      await apiAddTire(tire)
      setTires(prev => [...prev, tire])
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este neumático?')) return
    await apiDeleteTire(id)
    setTires(prev => prev.filter(t => t.id !== id))
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-jaecoo-electric" size={32} /></div>
  }

  const tireAt = (pos: TirePosition) => tires.find(t => t.position === pos)
  const mainPositions = POSITIONS.filter(p => p.value !== 'spare')
  const sparePos = POSITIONS.find(p => p.value === 'spare')!

  // Summary stats
  const scored = tires.filter(t => t.position !== 'spare')
  const avgWear = scored.length > 0 ? Math.round(scored.reduce((s, t) => s + wearInfo(t, currentOdo).pct, 0) / scored.length) : null
  const wearColor = avgWear == null ? '' : avgWear >= 75 ? 'text-rose-400' : avgWear >= 50 ? 'text-yellow-400' : 'text-emerald-400'

  return (
    <div className="space-y-6">

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-jaecoo-primary">Neumáticos</h1>
          {avgWear !== null && (
            <p className="text-xs text-jaecoo-muted mt-0.5">
              Desgaste medio: <span className={`font-bold ${wearColor}`}>{avgWear}%</span>
              <span className="mx-1.5 text-jaecoo-border">·</span>
              {scored.length} neumáticos registrados
            </p>
          )}
        </div>
        <button
          onClick={() => setModal({ tire: null, position: 'front_left' })}
          className="flex items-center gap-2 px-4 py-2 bg-jaecoo-electric text-jaecoo-base rounded-xl text-sm font-bold hover:brightness-110 transition-all"
        >
          <Plus size={15} /> Añadir
        </button>
      </div>

      {/* 2×2 main grid */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-jaecoo-muted mb-3 flex items-center gap-2">
          <Circle size={6} className="fill-jaecoo-muted" /> Neumáticos principales
        </p>
        <div className="grid grid-cols-2 gap-4">
          {mainPositions.map(pos => (
            <TireCard key={pos.value} position={pos} tire={tireAt(pos.value)} currentOdo={currentOdo} onEdit={(t, p) => setModal({ tire: t, position: p })} onDelete={handleDelete} />
          ))}
        </div>
      </div>

      {/* Spare */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-jaecoo-muted mb-3 flex items-center gap-2">
          <Circle size={6} className="fill-jaecoo-muted" /> Neumático de repuesto
        </p>
        <div className="max-w-sm">
          <TireCard position={sparePos} tire={tireAt('spare')} currentOdo={currentOdo} onEdit={(t, p) => setModal({ tire: t, position: p })} onDelete={handleDelete} />
        </div>
      </div>

      {modal && (
        <TireModal
          initial={modal.tire}
          position={modal.position}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
