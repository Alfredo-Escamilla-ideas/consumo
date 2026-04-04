import { useState, useEffect, useCallback } from 'react'
import {
  Wrench, Zap, AlertTriangle, CheckCircle2, Clock, Plus, Pencil, Trash2,
  X, Loader2, ChevronDown, ChevronUp, Phone, ShieldCheck, Calendar,
  Gauge, FileText, Euro, Car, ClipboardList,
} from 'lucide-react'
import type { Repair, RepairType, RepairStatus, MaintenanceService, MaintenanceType } from '../types'
import {
  apiGetRepairs, apiAddRepair, apiUpdateRepair, apiDeleteRepair,
  apiGetMaintenance, apiAddMaintenance, apiUpdateMaintenance, apiDeleteMaintenance,
} from '../services/api'
import { useData } from '../context/DataContext'

// ─── Static data ─────────────────────────────────────────────────────────────

const JAECOO7_PARTS = [
  // Tren motriz eléctrico
  'Motor eléctrico', 'Batería de tracción HV', 'Inversor / Controlador',
  'Cargador a bordo (OBC)', 'Convertidor DC-DC', 'BMS (Gestión batería)',
  'Compresor A/C eléctrico', 'Bomba de calor', 'Módulo de carga AC/DC',
  // Motor combustión
  'Motor 1.5T gasolina', 'Caja de cambios e-CVT', 'Correa de distribución',
  'Bomba de combustible', 'Inyectores', 'Sistema de escape',
  'Catalizador', 'Filtro de partículas (GPF)', 'EGR',
  // Frenos y suspensión
  'Pastillas freno delanteras', 'Discos freno delanteros',
  'Pastillas freno traseras', 'Discos freno traseros',
  'Sistema freno regenerativo', 'Amortiguadores delanteros',
  'Amortiguadores traseros', 'Muelles', 'Brazos de suspensión', 'Rótulas',
  // Dirección y transmisión
  'Dirección eléctrica asistida (EPS)', 'Árbol de transmisión delantero',
  'Árbol de transmisión trasero', 'Diferencial', 'Semieje',
  // Eléctrico / electrónica
  'Batería 12V auxiliar', 'Cuadro de instrumentos digital',
  'Pantalla central 14.8"', 'ECU motor', 'TCU transmisión',
  'Módulo ADAS', 'Cámara trasera', 'Sensores de aparcamiento',
  'Radar frontal', 'Luces LED delanteras', 'Luces LED traseras',
  // Carrocería / confort
  'Climatizador', 'Calefacción eléctrica asistida', 'Elevalunas',
  'Limpiaparabrisas', 'Techo panorámico', 'Cierre centralizado',
  // Neumáticos y ruedas
  'Neumático delantero', 'Neumático trasero', 'Llanta', 'TPMS (sensor presión)',
]

const MAINTENANCE_CHECKLIST = [
  'Aceite motor y filtro de aceite',
  'Filtro de aire motor',
  'Filtro de habitáculo / polen',
  'Revisión pastillas y discos de freno',
  'Comprobación líquido de frenos',
  'Inspección batería de tracción HV',
  'Test BMS y sistema eléctrico',
  'Comprobación neumáticos (presión y desgaste)',
  'Revisión suspensión y dirección',
  'Comprobación fluido refrigerante',
  'Comprobación líquido limpiaparabrisas',
  'Inspección luces y señalización',
  'Diagnóstico electrónico OBD',
  'Comprobación sistema ADAS y cámaras',
  'Revisión correa de distribución',
  'Comprobación escape y catalizador',
  'Inspección bajos del vehículo',
  'Comprobación batería 12V auxiliar',
  'Revisión conectores y puerto de carga',
  'Actualización software ECU / BMS',
]

// ─── Config maps ──────────────────────────────────────────────────────────────

const REPAIR_TYPES: Record<RepairType, { label: string; icon: typeof Wrench; color: string }> = {
  mechanical:  { label: 'Mecánica',   icon: Wrench,        color: 'text-jaecoo-fuel   bg-jaecoo-fuel-dim'      },
  electrical:  { label: 'Eléctrica',  icon: Zap,           color: 'text-jaecoo-electric bg-jaecoo-electric-dim' },
  both:        { label: 'Mixta',      icon: Car,           color: 'text-violet-400 bg-violet-500/10'            },
  bodywork:    { label: 'Carrocería', icon: Car,           color: 'text-yellow-400 bg-yellow-400/10'            },
  other:       { label: 'Otra',       icon: AlertTriangle, color: 'text-jaecoo-muted bg-jaecoo-elevated'        },
}

const REPAIR_STATUS: Record<RepairStatus, { label: string; color: string; dot: string }> = {
  open:       { label: 'Abierta',      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',         dot: 'bg-rose-400'          },
  in_repair:  { label: 'En reparación',color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',   dot: 'bg-yellow-400 animate-pulse' },
  resolved:   { label: 'Resuelta',     color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',dot: 'bg-emerald-400'       },
  warranty:   { label: 'Garantía',     color: 'text-jaecoo-electric bg-jaecoo-electric-dim border-jaecoo-electric/20', dot: 'bg-jaecoo-electric' },
}

const MAINT_TYPES: Record<MaintenanceType, string> = {
  annual:  'Revisión anual',
  oil:     'Cambio de aceite',
  brakes:  'Revisión de frenos',
  tires:   'Revisión de neumáticos',
  battery: 'Inspección batería HV',
  full:    'Revisión completa',
  other:   'Otra intervención',
}

const MAINT_KM_INTERVAL = 20000
const MAINT_DAY_INTERVAL = 365

// ─── Helpers ─────────────────────────────────────────────────────────────────

const inp  = 'w-full bg-jaecoo-elevated border border-jaecoo-border rounded-xl px-3 py-2.5 text-sm text-jaecoo-primary placeholder-jaecoo-muted focus:outline-none focus:border-jaecoo-electric transition-colors'
const lbl  = 'text-xs font-medium text-jaecoo-secondary mb-1 block'
const sect = 'text-[10px] font-bold text-jaecoo-muted uppercase tracking-widest mb-2 mt-4'

function daysUntil(d?: string) {
  if (!d) return null
  return Math.round((new Date(d).getTime() - Date.now()) / 86400000)
}

function fmtPrice(n?: number | null) {
  return n != null ? n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €' : '—'
}

// ─── RepairModal ──────────────────────────────────────────────────────────────

const EMPTY_REPAIR: Repair = {
  id: '', date: new Date().toISOString().slice(0, 10), type: 'mechanical',
  status: 'open', description: '', partsAffected: [], warrantyClaim: false,
}

function RepairModal({ initial, onSave, onClose }: { initial: Repair; onSave: (r: Repair) => Promise<void>; onClose: () => void }) {
  const [f, setF] = useState<Repair>({ ...initial })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [partSearch, setPartSearch] = useState('')

  function set(k: keyof Repair, v: unknown) { setF(p => ({ ...p, [k]: v })) }
  function togglePart(p: string) {
    setF(prev => ({
      ...prev,
      partsAffected: prev.partsAffected.includes(p)
        ? prev.partsAffected.filter(x => x !== p)
        : [...prev.partsAffected, p],
    }))
  }

  const filteredParts = JAECOO7_PARTS.filter(p =>
    p.toLowerCase().includes(partSearch.toLowerCase())
  )

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveError(null)
    try { await onSave({ ...f, id: f.id || crypto.randomUUID() }); onClose() }
    catch (err) { setSaveError(err instanceof Error ? err.message : 'Error al guardar') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-jaecoo-card border border-jaecoo-border rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-jaecoo-border sticky top-0 bg-jaecoo-card z-10">
          <h2 className="text-sm font-bold text-jaecoo-primary flex items-center gap-2">
            <Wrench size={15} className="text-jaecoo-fuel" />
            {initial.id ? 'Editar avería' : 'Nueva avería'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-jaecoo-muted hover:bg-jaecoo-elevated transition-colors"><X size={16} /></button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-3">
          {/* Tipo y estado */}
          <div>
            <p className={sect}>Tipo de avería</p>
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
              {(Object.entries(REPAIR_TYPES) as [RepairType, typeof REPAIR_TYPES[RepairType]][]).map(([k, v]) => {
                const VIcon = v.icon
                return (
                  <button key={k} type="button" onClick={() => set('type', k)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-xs font-semibold transition-all
                      ${f.type === k ? `${v.color} border-current` : 'border-jaecoo-border text-jaecoo-muted hover:border-jaecoo-border-strong'}`}>
                    <VIcon size={14} />{v.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <p className={sect}>Estado</p>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {(Object.entries(REPAIR_STATUS) as [RepairStatus, typeof REPAIR_STATUS[RepairStatus]][]).map(([k, v]) => (
                <button key={k} type="button" onClick={() => set('status', k)}
                  className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-xs font-semibold transition-all
                    ${f.status === k ? `${v.color}` : 'border-jaecoo-border text-jaecoo-muted hover:border-jaecoo-border-strong'}`}>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${f.status === k ? v.dot : 'bg-jaecoo-muted'}`} />
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className={lbl}>Descripción del problema *</label>
            <textarea required rows={3} className={`${inp} resize-none`} placeholder="Describe el problema observado..." value={f.description} onChange={e => set('description', e.target.value)} />
          </div>

          {/* Fecha y km */}
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lbl}>Fecha *</label>
              <input required type="date" className={inp} value={f.date} onChange={e => set('date', e.target.value)} /></div>
            <div><label className={lbl}>Kilómetros</label>
              <input type="number" min="0" className={inp} placeholder="Odómetro" value={f.odometer ?? ''} onChange={e => set('odometer', e.target.value ? parseInt(e.target.value) : undefined)} /></div>
          </div>

          {/* Taller */}
          <div>
            <p className={sect}>Taller</p>
            <div className="grid grid-cols-2 gap-2">
              <input className={inp} placeholder="Nombre del taller" value={f.workshop ?? ''} onChange={e => set('workshop', e.target.value || undefined)} />
              <input className={inp} placeholder="Teléfono" value={f.workshopPhone ?? ''} onChange={e => set('workshopPhone', e.target.value || undefined)} />
            </div>
          </div>

          {/* Diagnóstico */}
          <div>
            <label className={lbl}>Diagnóstico del taller</label>
            <textarea rows={2} className={`${inp} resize-none`} placeholder="Diagnóstico técnico..." value={f.diagnosis ?? ''} onChange={e => set('diagnosis', e.target.value || undefined)} />
          </div>

          {/* Precios */}
          <div>
            <p className={sect}>Costes</p>
            <div className="grid grid-cols-3 gap-2">
              <div><label className={lbl}>Presupuesto (€)</label>
                <input type="number" step="0.01" min="0" className={inp} placeholder="0,00" value={f.estimatePrice ?? ''} onChange={e => set('estimatePrice', e.target.value ? parseFloat(e.target.value) : undefined)} /></div>
              <div><label className={lbl}>Factura final (€)</label>
                <input type="number" step="0.01" min="0" className={inp} placeholder="0,00" value={f.finalPrice ?? ''} onChange={e => set('finalPrice', e.target.value ? parseFloat(e.target.value) : undefined)} /></div>
              <div><label className={lbl}>Días en taller</label>
                <input type="number" min="0" className={inp} placeholder="0" value={f.repairDays ?? ''} onChange={e => set('repairDays', e.target.value ? parseInt(e.target.value) : undefined)} /></div>
            </div>
          </div>

          {/* Garantía + factura */}
          <div className="flex gap-3">
            <button type="button" onClick={() => set('warrantyClaim', !f.warrantyClaim)}
              className={`flex-1 flex items-center gap-2 p-3 rounded-xl border transition-all text-xs font-semibold
                ${f.warrantyClaim ? 'border-jaecoo-electric/40 bg-jaecoo-electric-dim text-jaecoo-electric' : 'border-jaecoo-border text-jaecoo-muted'}`}>
              <ShieldCheck size={14} /> En garantía
            </button>
            <div className="flex-1">
              <input className={inp} placeholder="Nº factura" value={f.invoiceNumber ?? ''} onChange={e => set('invoiceNumber', e.target.value || undefined)} />
            </div>
          </div>

          {/* Piezas afectadas */}
          <div>
            <p className={sect}>Piezas afectadas</p>
            <input className={`${inp} mb-2`} placeholder="Buscar pieza…" value={partSearch} onChange={e => setPartSearch(e.target.value)} />
            <div className="max-h-40 overflow-y-auto border border-jaecoo-border rounded-xl p-2 flex flex-wrap gap-1.5">
              {filteredParts.map(p => (
                <button key={p} type="button" onClick={() => togglePart(p)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all
                    ${f.partsAffected.includes(p)
                      ? 'bg-jaecoo-electric-dim border-jaecoo-electric/40 text-jaecoo-electric'
                      : 'border-jaecoo-border text-jaecoo-muted hover:border-jaecoo-border-strong'}`}>
                  {p}
                </button>
              ))}
            </div>
            {f.partsAffected.length > 0 && (
              <p className="text-[10px] text-jaecoo-muted mt-1">{f.partsAffected.length} piezas seleccionadas</p>
            )}
          </div>

          {/* Notas */}
          <div>
            <label className={lbl}>Notas adicionales</label>
            <textarea rows={2} className={`${inp} resize-none`} value={f.notes ?? ''} onChange={e => set('notes', e.target.value || undefined)} />
          </div>

          {saveError && <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">{saveError}</p>}
          <button type="submit" disabled={saving}
            className="w-full py-3 bg-jaecoo-electric text-jaecoo-base font-bold rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
            {saving && <Loader2 size={16} className="animate-spin" />}
            {initial.id ? 'Guardar cambios' : 'Registrar avería'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── MaintenanceModal ──────────────────────────────────────────────────────────

const EMPTY_MAINT: MaintenanceService = {
  id: '', date: new Date().toISOString().slice(0, 10), type: 'annual',
  itemsChecked: [], status: 'done',
}

function MaintenanceModal({ initial, currentOdo, onSave, onClose }: {
  initial: MaintenanceService; currentOdo: number
  onSave: (s: MaintenanceService) => Promise<void>; onClose: () => void
}) {
  const [f, setF] = useState<MaintenanceService>({ ...initial })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  function set(k: keyof MaintenanceService, v: unknown) { setF(p => ({ ...p, [k]: v })) }
  function toggleItem(item: string) {
    setF(p => ({
      ...p,
      itemsChecked: p.itemsChecked.includes(item)
        ? p.itemsChecked.filter(x => x !== item)
        : [...p.itemsChecked, item],
    }))
  }

  // Auto-suggest next service
  function autoFillNext() {
    const odo = f.odometer ?? currentOdo
    const d = new Date(f.date)
    d.setFullYear(d.getFullYear() + 1)
    setF(p => ({ ...p, nextOdometer: odo + MAINT_KM_INTERVAL, nextDate: d.toISOString().slice(0, 10) }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveError(null)
    try { await onSave({ ...f, id: f.id || crypto.randomUUID() }); onClose() }
    catch (err) { setSaveError(err instanceof Error ? err.message : 'Error al guardar') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-jaecoo-card border border-jaecoo-border rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-jaecoo-border sticky top-0 bg-jaecoo-card z-10">
          <h2 className="text-sm font-bold text-jaecoo-primary flex items-center gap-2">
            <ClipboardList size={15} className="text-jaecoo-electric" />
            {initial.id ? 'Editar revisión' : 'Nueva revisión'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-jaecoo-muted hover:bg-jaecoo-elevated transition-colors"><X size={16} /></button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-3">
          {/* Tipo */}
          <div>
            <p className={sect}>Tipo de revisión</p>
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
              {(Object.entries(MAINT_TYPES) as [MaintenanceType, string][]).map(([k, label]) => (
                <button key={k} type="button" onClick={() => set('type', k)}
                  className={`px-2 py-2 rounded-xl border text-xs font-semibold transition-all
                    ${f.type === k ? 'border-jaecoo-electric/40 bg-jaecoo-electric-dim text-jaecoo-electric' : 'border-jaecoo-border text-jaecoo-muted hover:border-jaecoo-border-strong'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Fecha y km */}
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lbl}>Fecha *</label>
              <input required type="date" className={inp} value={f.date} onChange={e => set('date', e.target.value)} /></div>
            <div><label className={lbl}>Km en revisión</label>
              <input type="number" min="0" className={inp} placeholder="Odómetro" value={f.odometer ?? ''} onChange={e => set('odometer', e.target.value ? parseInt(e.target.value) : undefined)} /></div>
          </div>

          {/* Próxima revisión */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className={sect.replace('mb-2 mt-4', '')}>Próxima revisión</p>
              <button type="button" onClick={autoFillNext} className="text-[10px] text-jaecoo-electric hover:underline">
                Auto (+1 año / +{MAINT_KM_INTERVAL.toLocaleString('es-ES')} km)
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>Fecha aprox.</label>
                <input type="date" className={inp} value={f.nextDate ?? ''} onChange={e => set('nextDate', e.target.value || undefined)} /></div>
              <div><label className={lbl}>Km estimados</label>
                <input type="number" min="0" className={inp} value={f.nextOdometer ?? ''} onChange={e => set('nextOdometer', e.target.value ? parseInt(e.target.value) : undefined)} /></div>
            </div>
          </div>

          {/* Taller y precio */}
          <div>
            <p className={sect}>Taller</p>
            <div className="grid grid-cols-2 gap-2">
              <input className={inp} placeholder="Nombre del taller" value={f.workshop ?? ''} onChange={e => set('workshop', e.target.value || undefined)} />
              <input className={inp} placeholder="Teléfono" value={f.workshopPhone ?? ''} onChange={e => set('workshopPhone', e.target.value || undefined)} />
            </div>
          </div>
          <div><label className={lbl}>Importe (€)</label>
            <input type="number" step="0.01" min="0" className={inp} placeholder="0,00" value={f.price ?? ''} onChange={e => set('price', e.target.value ? parseFloat(e.target.value) : undefined)} /></div>

          {/* Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className={sect.replace('mb-2 mt-4', 'text-[10px] font-bold text-jaecoo-muted uppercase tracking-widest')}>Puntos revisados</p>
              <button type="button" onClick={() => setF(p => ({ ...p, itemsChecked: MAINTENANCE_CHECKLIST }))} className="text-[10px] text-jaecoo-electric hover:underline">Marcar todos</button>
            </div>
            <div className="border border-jaecoo-border rounded-xl p-3 space-y-1.5 max-h-48 overflow-y-auto">
              {MAINTENANCE_CHECKLIST.map(item => (
                <button key={item} type="button" onClick={() => toggleItem(item)}
                  className="flex items-center gap-2.5 w-full text-left">
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all
                    ${f.itemsChecked.includes(item) ? 'bg-emerald-500 border-emerald-500' : 'border-jaecoo-border'}`}>
                    {f.itemsChecked.includes(item) && <CheckCircle2 size={10} className="text-white" />}
                  </div>
                  <span className={`text-xs ${f.itemsChecked.includes(item) ? 'text-jaecoo-secondary' : 'text-jaecoo-muted'}`}>{item}</span>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-jaecoo-muted mt-1">{f.itemsChecked.length} / {MAINTENANCE_CHECKLIST.length} puntos revisados</p>
          </div>

          {/* Notas */}
          <div><label className={lbl}>Observaciones</label>
            <textarea rows={2} className={`${inp} resize-none`} value={f.notes ?? ''} onChange={e => set('notes', e.target.value || undefined)} /></div>

          {saveError && <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">{saveError}</p>}
          <button type="submit" disabled={saving}
            className="w-full py-3 bg-jaecoo-electric text-jaecoo-base font-bold rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
            {saving && <Loader2 size={16} className="animate-spin" />}
            {initial.id ? 'Guardar cambios' : 'Registrar revisión'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── RepairCard ───────────────────────────────────────────────────────────────

function RepairCard({ r, onEdit, onDelete }: { r: Repair; onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  const type   = REPAIR_TYPES[r.type]
  const status = REPAIR_STATUS[r.status]
  const TypeIcon = type.icon

  return (
    <div className="bg-jaecoo-card border border-jaecoo-border rounded-2xl overflow-hidden transition-all">
      {/* Header row */}
      <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setOpen(v => !v)}>
        <div className={`p-2 rounded-xl shrink-0 ${type.color}`}><TypeIcon size={16} /></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${status.color}`}>
              <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${status.dot}`} />{status.label}
            </span>
            <span className="text-[10px] text-jaecoo-muted">{r.date}{r.odometer ? ` · ${r.odometer.toLocaleString('es-ES')} km` : ''}</span>
          </div>
          <p className="text-sm font-semibold text-jaecoo-primary truncate mt-0.5">{r.description}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {r.finalPrice != null && <span className="text-xs font-bold text-jaecoo-secondary hidden sm:block">{fmtPrice(r.finalPrice)}</span>}
          {open ? <ChevronUp size={14} className="text-jaecoo-muted" /> : <ChevronDown size={14} className="text-jaecoo-muted" />}
        </div>
      </div>

      {/* Expanded detail */}
      {open && (
        <div className="px-4 pb-4 border-t border-jaecoo-border space-y-3 pt-3">
          {r.diagnosis && (
            <div>
              <p className="text-[10px] text-jaecoo-muted uppercase font-bold tracking-wide mb-1">Diagnóstico</p>
              <p className="text-xs text-jaecoo-secondary">{r.diagnosis}</p>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {r.workshop && (
              <div>
                <p className="text-[9px] text-jaecoo-muted uppercase tracking-wide">Taller</p>
                <p className="text-xs font-semibold text-jaecoo-secondary">{r.workshop}</p>
                {r.workshopPhone && <a href={`tel:${r.workshopPhone}`} className="text-[10px] text-jaecoo-electric flex items-center gap-1"><Phone size={10} />{r.workshopPhone}</a>}
              </div>
            )}
            {r.estimatePrice != null && (
              <div>
                <p className="text-[9px] text-jaecoo-muted uppercase tracking-wide">Presupuesto</p>
                <p className="text-xs font-semibold text-jaecoo-secondary">{fmtPrice(r.estimatePrice)}</p>
              </div>
            )}
            {r.finalPrice != null && (
              <div>
                <p className="text-[9px] text-jaecoo-muted uppercase tracking-wide">Factura final</p>
                <p className="text-xs font-bold text-jaecoo-primary">{fmtPrice(r.finalPrice)}</p>
              </div>
            )}
            {r.repairDays != null && (
              <div>
                <p className="text-[9px] text-jaecoo-muted uppercase tracking-wide">Días en taller</p>
                <p className="text-xs font-semibold text-jaecoo-secondary">{r.repairDays} día{r.repairDays !== 1 ? 's' : ''}</p>
              </div>
            )}
          </div>

          {r.partsAffected.length > 0 && (
            <div>
              <p className="text-[10px] text-jaecoo-muted uppercase font-bold tracking-wide mb-1.5">Piezas afectadas</p>
              <div className="flex flex-wrap gap-1.5">
                {r.partsAffected.map(p => (
                  <span key={p} className="text-[10px] px-2 py-0.5 rounded-full bg-jaecoo-electric-dim border border-jaecoo-electric/20 text-jaecoo-electric">{p}</span>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3">
              {r.warrantyClaim && <span className="text-[10px] flex items-center gap-1 text-jaecoo-electric"><ShieldCheck size={11} /> En garantía</span>}
              {r.invoiceNumber && <span className="text-[10px] flex items-center gap-1 text-jaecoo-muted"><FileText size={11} /> {r.invoiceNumber}</span>}
            </div>
            <div className="flex gap-1">
              <button onClick={onEdit} className="p-1.5 rounded-lg text-jaecoo-muted hover:text-jaecoo-electric hover:bg-jaecoo-electric-dim transition-colors"><Pencil size={13} /></button>
              <button onClick={onDelete} className="p-1.5 rounded-lg text-jaecoo-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors"><Trash2 size={13} /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── NextServiceCard ──────────────────────────────────────────────────────────

function NextServiceCard({ services, currentOdo, onAdd }: { services: MaintenanceService[]; currentOdo: number; onAdd: () => void }) {
  const last = services.find(s => s.status === 'done')
  const nextDate = last?.nextDate
  const nextOdo  = last?.nextOdometer

  const daysLeft = daysUntil(nextDate)
  const kmLeft   = nextOdo != null ? nextOdo - currentOdo : null

  const urgencyByDays = daysLeft == null ? null : daysLeft < 0 ? 'overdue' : daysLeft <= 30 ? 'soon' : daysLeft <= 90 ? 'upcoming' : 'ok'
  const urgencyByKm   = kmLeft   == null ? null : kmLeft   < 0 ? 'overdue' : kmLeft   <= 1000 ? 'soon' : kmLeft <= 3000 ? 'upcoming' : 'ok'
  const urgency = [urgencyByDays, urgencyByKm].reduce<string | null>((worst, u) => {
    const rank: Record<string, number> = { overdue: 3, soon: 2, upcoming: 1, ok: 0 }
    if (u == null) return worst
    if (worst == null) return u
    return rank[u] > rank[worst] ? u : worst
  }, null)

  const urgencyStyleMap: Record<string, string> = {
    overdue:  'border-rose-500/30 bg-rose-500/5',
    soon:     'border-jaecoo-fuel/30 bg-jaecoo-fuel-dim',
    upcoming: 'border-yellow-400/30 bg-yellow-400/5',
    ok:       'border-emerald-500/20 bg-emerald-500/5',
  }
  const urgencyStyle = urgencyStyleMap[urgency ?? 'ok']

  const urgencyTextMap: Record<string, { label: string; color: string }> = {
    overdue:  { label: 'Revisión vencida', color: 'text-rose-400' },
    soon:     { label: 'Revisión próxima', color: 'text-jaecoo-fuel' },
    upcoming: { label: 'Revisión próximamente', color: 'text-yellow-400' },
    ok:       { label: 'Revisión al día', color: 'text-emerald-400' },
  }
  const urgencyText = urgencyTextMap[urgency ?? 'ok']

  if (!last && services.length === 0) {
    return (
      <div className="border-2 border-dashed border-jaecoo-border rounded-2xl p-6 text-center">
        <ClipboardList size={28} className="text-jaecoo-muted mx-auto mb-2" />
        <p className="text-sm font-semibold text-jaecoo-secondary">Sin revisiones registradas</p>
        <p className="text-xs text-jaecoo-muted mt-1">Registra la última revisión para hacer seguimiento</p>
        <button onClick={onAdd} className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-jaecoo-electric text-jaecoo-base rounded-xl text-xs font-bold hover:brightness-110 transition-all">
          <Plus size={13} /> Registrar revisión
        </button>
      </div>
    )
  }

  return (
    <div className={`border rounded-2xl p-4 ${urgencyStyle}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className={`text-xs font-bold uppercase tracking-wide ${urgencyText.color}`}>{urgencyText.label}</p>
          <p className="text-[11px] text-jaecoo-muted mt-0.5">Cada {MAINT_DAY_INTERVAL / 30} meses o {MAINT_KM_INTERVAL.toLocaleString('es-ES')} km</p>
        </div>
        <Calendar size={20} className={urgencyText.color} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {daysLeft != null && (
          <div>
            <p className="text-[9px] text-jaecoo-muted uppercase tracking-wide">Fecha</p>
            <p className={`text-xl font-bold ${urgencyText.color}`}>
              {daysLeft < 0 ? `${Math.abs(daysLeft)} días` : daysLeft === 0 ? 'Hoy' : `${daysLeft} días`}
            </p>
            <p className="text-[10px] text-jaecoo-muted">{daysLeft < 0 ? 'de retraso' : 'restantes'} · {nextDate}</p>
          </div>
        )}
        {kmLeft != null && (
          <div>
            <p className="text-[9px] text-jaecoo-muted uppercase tracking-wide">Kilómetros</p>
            <p className={`text-xl font-bold ${urgencyText.color}`}>
              {kmLeft < 0 ? `+${Math.abs(kmLeft).toLocaleString('es-ES')}` : kmLeft.toLocaleString('es-ES')}
            </p>
            <p className="text-[10px] text-jaecoo-muted">{kmLeft < 0 ? 'pasados' : 'restantes'} · próx. {nextOdo?.toLocaleString('es-ES')} km</p>
          </div>
        )}
      </div>

      {last && (
        <p className="text-[10px] text-jaecoo-muted mt-3 pt-3 border-t border-jaecoo-border">
          Última revisión: <span className="font-semibold text-jaecoo-secondary">{last.date}</span>
          {last.odometer && ` · ${last.odometer.toLocaleString('es-ES')} km`}
          {last.workshop && ` · ${last.workshop}`}
        </p>
      )}
    </div>
  )
}

// ─── MaintenanceCard ──────────────────────────────────────────────────────────

function MaintenanceCard({ s, onEdit, onDelete }: { s: MaintenanceService; onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-jaecoo-card border border-jaecoo-border rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setOpen(v => !v)}>
        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0"><CheckCircle2 size={16} /></div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-jaecoo-primary">{MAINT_TYPES[s.type]}</p>
          <p className="text-[11px] text-jaecoo-muted">{s.date}{s.odometer ? ` · ${s.odometer.toLocaleString('es-ES')} km` : ''}{s.workshop ? ` · ${s.workshop}` : ''}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {s.price != null && <span className="text-xs font-semibold text-jaecoo-secondary hidden sm:block">{fmtPrice(s.price)}</span>}
          <span className="text-[10px] text-emerald-400 font-bold">{s.itemsChecked.length}/{MAINTENANCE_CHECKLIST.length}</span>
          {open ? <ChevronUp size={14} className="text-jaecoo-muted" /> : <ChevronDown size={14} className="text-jaecoo-muted" />}
        </div>
      </div>

      {open && (
        <div className="px-4 pb-4 border-t border-jaecoo-border pt-3 space-y-3">
          {s.itemsChecked.length > 0 && (
            <div>
              <p className="text-[10px] text-jaecoo-muted uppercase font-bold tracking-wide mb-2">Puntos revisados</p>
              <div className="grid sm:grid-cols-2 gap-1">
                {s.itemsChecked.map(item => (
                  <div key={item} className="flex items-center gap-1.5">
                    <CheckCircle2 size={11} className="text-emerald-400 shrink-0" />
                    <span className="text-[11px] text-jaecoo-secondary">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {s.notes && <p className="text-xs text-jaecoo-secondary italic">{s.notes}</p>}
          <div className="flex justify-between items-center pt-1">
            {s.workshopPhone
              ? <a href={`tel:${s.workshopPhone}`} className="text-[10px] text-jaecoo-electric flex items-center gap-1"><Phone size={10} />{s.workshopPhone}</a>
              : <span />}
            <div className="flex gap-1">
              <button onClick={onEdit} className="p-1.5 rounded-lg text-jaecoo-muted hover:text-jaecoo-electric hover:bg-jaecoo-electric-dim transition-colors"><Pencil size={13} /></button>
              <button onClick={onDelete} className="p-1.5 rounded-lg text-jaecoo-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors"><Trash2 size={13} /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Garage() {
  const { data } = useData()
  const [repairs, setRepairs] = useState<Repair[]>([])
  const [services, setServices] = useState<MaintenanceService[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'repairs' | 'maintenance'>('repairs')
  const [repairModal, setRepairModal] = useState<Repair | null | false>(false)
  const [maintModal, setMaintModal]   = useState<MaintenanceService | null | false>(false)

  const allRecords = [...data.electricCharges, ...data.fuelRefuels]
  const currentOdo = allRecords.length > 0 ? Math.max(...allRecords.map(r => r.odometer)) : 0

  const load = useCallback(async () => {
    const [r, m] = await Promise.all([apiGetRepairs(), apiGetMaintenance()])
    setRepairs(r); setServices(m); setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function saveRepair(r: Repair) {
    if (repairs.find(x => x.id === r.id)) { await apiUpdateRepair(r); setRepairs(p => p.map(x => x.id === r.id ? r : x)) }
    else { await apiAddRepair(r); setRepairs(p => [r, ...p]) }
  }
  async function deleteRepair(id: string) {
    if (!confirm('¿Eliminar esta avería?')) return
    await apiDeleteRepair(id); setRepairs(p => p.filter(x => x.id !== id))
  }
  async function saveMaint(s: MaintenanceService) {
    if (services.find(x => x.id === s.id)) { await apiUpdateMaintenance(s); setServices(p => p.map(x => x.id === s.id ? s : x)) }
    else { await apiAddMaintenance(s); setServices(p => [s, ...p]) }
  }
  async function deleteMaint(id: string) {
    if (!confirm('¿Eliminar esta revisión?')) return
    await apiDeleteMaintenance(id); setServices(p => p.filter(x => x.id !== id))
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-jaecoo-electric" size={32} /></div>

  const openCount     = repairs.filter(r => r.status === 'open').length
  const inRepairCount = repairs.filter(r => r.status === 'in_repair').length
  const totalCost     = repairs.reduce((s, r) => s + (r.finalPrice ?? 0), 0)

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-1 bg-jaecoo-elevated p-1 rounded-2xl">
        <button onClick={() => setTab('repairs')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all
            ${tab === 'repairs' ? 'bg-jaecoo-card shadow-j-card text-jaecoo-primary' : 'text-jaecoo-muted hover:text-jaecoo-secondary'}`}>
          <Wrench size={15} />
          Averías
          {(openCount + inRepairCount) > 0 && (
            <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">{openCount + inRepairCount}</span>
          )}
        </button>
        <button onClick={() => setTab('maintenance')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all
            ${tab === 'maintenance' ? 'bg-jaecoo-card shadow-j-card text-jaecoo-primary' : 'text-jaecoo-muted hover:text-jaecoo-secondary'}`}>
          <ClipboardList size={15} />
          Revisiones
        </button>
      </div>

      {/* ── AVERÍAS ── */}
      {tab === 'repairs' && (
        <div className="space-y-4">
          {/* Summary */}
          {repairs.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-jaecoo-card border border-rose-500/20 rounded-2xl p-3 text-center">
                <p className="text-xl font-bold text-rose-400">{openCount}</p>
                <p className="text-[10px] text-jaecoo-muted mt-0.5">Abiertas</p>
              </div>
              <div className="bg-jaecoo-card border border-yellow-400/20 rounded-2xl p-3 text-center">
                <p className="text-xl font-bold text-yellow-400">{inRepairCount}</p>
                <p className="text-[10px] text-jaecoo-muted mt-0.5">En taller</p>
              </div>
              <div className="bg-jaecoo-card border border-jaecoo-border rounded-2xl p-3 text-center">
                <p className="text-lg font-bold text-jaecoo-primary">{fmtPrice(totalCost)}</p>
                <p className="text-[10px] text-jaecoo-muted mt-0.5">Gasto total</p>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center">
            <p className="text-xs text-jaecoo-muted">{repairs.length} avería{repairs.length !== 1 ? 's' : ''} registrada{repairs.length !== 1 ? 's' : ''}</p>
            <button onClick={() => setRepairModal(null)}
              className="flex items-center gap-1.5 px-3 py-2 bg-jaecoo-electric text-jaecoo-base rounded-xl text-xs font-bold hover:brightness-110 transition-all">
              <Plus size={13} /> Nueva avería
            </button>
          </div>

          {repairs.length === 0 ? (
            <div className="border-2 border-dashed border-jaecoo-border rounded-2xl p-8 text-center">
              <Wrench size={28} className="text-jaecoo-muted mx-auto mb-2" />
              <p className="text-sm font-semibold text-jaecoo-secondary">Sin averías registradas</p>
              <p className="text-xs text-jaecoo-muted mt-1">¡Espero que así siga mucho tiempo!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {repairs.map(r => (
                <RepairCard key={r.id} r={r} onEdit={() => setRepairModal(r)} onDelete={() => deleteRepair(r.id)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── REVISIONES ── */}
      {tab === 'maintenance' && (
        <div className="space-y-4">
          <NextServiceCard services={services} currentOdo={currentOdo} onAdd={() => setMaintModal(null)} />

          <div className="flex justify-between items-center">
            <p className="text-xs text-jaecoo-muted">{services.length} revisión{services.length !== 1 ? 'es' : ''} registrada{services.length !== 1 ? 's' : ''}</p>
            <button onClick={() => setMaintModal(null)}
              className="flex items-center gap-1.5 px-3 py-2 bg-jaecoo-electric text-jaecoo-base rounded-xl text-xs font-bold hover:brightness-110 transition-all">
              <Plus size={13} /> Nueva revisión
            </button>
          </div>

          {services.length === 0 ? null : (
            <div className="space-y-2">
              {services.map(s => (
                <MaintenanceCard key={s.id} s={s} onEdit={() => setMaintModal(s)} onDelete={() => deleteMaint(s.id)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {repairModal !== false && (
        <RepairModal initial={repairModal ?? EMPTY_REPAIR} onSave={saveRepair} onClose={() => setRepairModal(false)} />
      )}
      {maintModal !== false && (
        <MaintenanceModal initial={maintModal ?? EMPTY_MAINT} currentOdo={currentOdo} onSave={saveMaint} onClose={() => setMaintModal(false)} />
      )}
    </div>
  )
}
