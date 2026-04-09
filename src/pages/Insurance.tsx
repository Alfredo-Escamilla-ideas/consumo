import { useState, useEffect } from 'react'
import {
  Shield, ShieldCheck, ShieldAlert, Phone, Mail, User,
  CalendarDays, Euro, FileText, Pencil, Plus, Loader2,
  CheckCircle2, X, AlertTriangle, RefreshCw, Hash,
} from 'lucide-react'
import type { Insurance, InsuranceType } from '../types'
import { apiGetInsurance, apiSaveInsurance } from '../services/api'

// ─── Constants ───────────────────────────────────────────────────────────────

const TYPES: { value: InsuranceType; label: string; desc: string; color: string; icon: typeof Shield }[] = [
  { value: 'third_party',        label: 'Terceros',                     desc: 'Cobertura básica obligatoria',           color: 'text-jaecoo-muted   bg-jaecoo-elevated',        icon: Shield      },
  { value: 'third_party_plus',   label: 'Terceros ampliado',            desc: 'Terceros + robo, lunas e incendio',      color: 'text-jaecoo-electric bg-jaecoo-electric-dim',   icon: ShieldCheck },
  { value: 'comprehensive_excess',label: 'Todo riesgo con franquicia',  desc: 'Cobertura total con importe a cargo',    color: 'text-yellow-400 bg-yellow-400/10',              icon: ShieldAlert },
  { value: 'comprehensive',      label: 'Todo riesgo sin franquicia',   desc: 'Cobertura máxima sin costes adicionales',color: 'text-emerald-400 bg-emerald-500/10',            icon: ShieldCheck },
]

const DEFAULT_COVERAGES = [
  'Responsabilidad civil obligatoria',
  'Responsabilidad civil voluntaria',
  'Defensa jurídica',
  'Asistencia en viaje 24h',
  'Robo e incendio',
  'Lunas',
  'Daños propios',
  'Vehículo de sustitución',
  'Conductor designado',
]

const EMPTY: Insurance = {
  id: '', company: '', policyNumber: '', type: 'comprehensive',
  annualPrice: undefined, excessAmount: undefined,
  startDate: undefined, endDate: undefined, autoRenewal: true,
  agentName: undefined, agentPhone: undefined, agentEmail: undefined,
  emergencyPhone: undefined, coverages: [], notes: undefined,
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysUntil(dateStr?: string) {
  if (!dateStr) return null
  return Math.round((new Date(dateStr).getTime() - Date.now()) / 86400000)
}

function expiryBadge(days: number | null) {
  if (days === null) return null
  if (days < 0)   return { label: `Vencido hace ${Math.abs(days)} días`, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' }
  if (days <= 30) return { label: `Vence en ${days} días`, color: 'text-jaecoo-fuel bg-jaecoo-fuel-dim border-jaecoo-fuel/20' }
  if (days <= 90) return { label: `Vence en ${days} días`, color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' }
  return            { label: `Vigente — ${days} días`, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' }
}

const inp = 'w-full bg-jaecoo-elevated border border-jaecoo-border rounded-xl px-3 py-2.5 text-sm text-jaecoo-primary placeholder-jaecoo-muted focus:outline-none focus:border-jaecoo-electric transition-colors'
const lbl = 'text-xs font-medium text-jaecoo-secondary mb-1 block'

// ─── InfoRow ─────────────────────────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value, highlight }: { icon: typeof Phone; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-jaecoo-border last:border-0">
      <Icon size={14} className="text-jaecoo-muted shrink-0" />
      <span className="text-xs text-jaecoo-muted w-36 shrink-0">{label}</span>
      <span className={`text-xs font-semibold truncate ${highlight ? 'text-jaecoo-primary' : 'text-jaecoo-secondary'}`}>{value}</span>
    </div>
  )
}

// ─── Modal form ───────────────────────────────────────────────────────────────

function InsuranceModal({ initial, onSave, onClose }: { initial: Insurance; onSave: (ins: Insurance) => Promise<void>; onClose: () => void }) {
  const [f, setF] = useState<Insurance>({ ...initial })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [coverageText, setCoverageText] = useState(initial.coverages.join('\n'))

  function set(k: keyof Insurance, v: unknown) { setF(p => ({ ...p, [k]: v })) }
  const hasExcess = f.type === 'comprehensive_excess'

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveError(null)
    try {
      const id = f.id || crypto.randomUUID()
      const coverages = coverageText.split('\n').map(s => s.trim()).filter(Boolean)
      await onSave({ ...f, id, coverages })
      onClose()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-jaecoo-card border border-jaecoo-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-jaecoo-border sticky top-0 bg-jaecoo-card z-10">
          <h2 className="text-sm font-bold text-jaecoo-primary flex items-center gap-2">
            <Shield size={15} className="text-jaecoo-electric" />
            {initial.id ? 'Editar seguro' : 'Registrar seguro'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-jaecoo-muted hover:text-jaecoo-primary hover:bg-jaecoo-elevated transition-colors"><X size={16} /></button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">

          {/* Tipo */}
          <div>
            <label className={lbl}>Tipo de seguro *</label>
            <div className="grid grid-cols-2 gap-2">
              {TYPES.map(t => {
                const TIcon = t.icon
                return (
                  <button key={t.value} type="button" onClick={() => set('type', t.value)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all
                      ${f.type === t.value ? `${t.color} border-current` : 'border-jaecoo-border text-jaecoo-muted hover:border-jaecoo-border-strong'}`}>
                    <TIcon size={14} className="shrink-0" />
                    <span className="text-xs font-semibold leading-tight">{t.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Compañía + póliza */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Compañía *</label>
              <input required className={inp} placeholder="Mapfre, AXA…" value={f.company} onChange={e => set('company', e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Número de póliza</label>
              <input className={inp} placeholder="123456789" value={f.policyNumber} onChange={e => set('policyNumber', e.target.value)} />
            </div>
          </div>

          {/* Precio + franquicia */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Prima anual (€)</label>
              <input type="number" step="0.01" min="0" className={inp} placeholder="850.00" value={f.annualPrice ?? ''} onChange={e => set('annualPrice', e.target.value ? parseFloat(e.target.value) : undefined)} />
            </div>
            <div>
              <label className={`${lbl} ${!hasExcess ? 'opacity-40' : ''}`}>Importe franquicia (€)</label>
              <input type="number" step="0.01" min="0" disabled={!hasExcess} className={`${inp} ${!hasExcess ? 'opacity-40 cursor-not-allowed' : ''}`} placeholder="300.00" value={f.excessAmount ?? ''} onChange={e => set('excessAmount', e.target.value ? parseFloat(e.target.value) : undefined)} />
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Fecha de inicio</label>
              <input type="date" className={inp} value={f.startDate ?? ''} onChange={e => set('startDate', e.target.value || undefined)} />
            </div>
            <div>
              <label className={lbl}>Fecha de vencimiento</label>
              <input type="date" className={inp} value={f.endDate ?? ''} onChange={e => set('endDate', e.target.value || undefined)} />
            </div>
          </div>

          {/* Renovación automática */}
          <button type="button" onClick={() => set('autoRenewal', !f.autoRenewal)}
            className={`flex items-center gap-3 w-full p-3 rounded-xl border transition-all
              ${f.autoRenewal ? 'border-jaecoo-electric/40 bg-jaecoo-electric-dim' : 'border-jaecoo-border bg-jaecoo-elevated'}`}>
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${f.autoRenewal ? 'bg-jaecoo-electric border-jaecoo-electric' : 'border-jaecoo-border'}`}>
              {f.autoRenewal && <CheckCircle2 size={10} className="text-jaecoo-base" />}
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-jaecoo-primary">Renovación automática</p>
              <p className="text-[10px] text-jaecoo-muted">La póliza se renueva automáticamente al vencer</p>
            </div>
          </button>

          {/* Contacto agente */}
          <div>
            <p className="text-xs font-semibold text-jaecoo-muted uppercase tracking-wide mb-2">Contacto mediador / agente</p>
            <div className="space-y-2">
              <input className={inp} placeholder="Nombre del agente" value={f.agentName ?? ''} onChange={e => set('agentName', e.target.value || undefined)} />
              <div className="grid grid-cols-2 gap-2">
                <input className={inp} placeholder="Teléfono" value={f.agentPhone ?? ''} onChange={e => set('agentPhone', e.target.value || undefined)} />
                <input type="email" className={inp} placeholder="Email" value={f.agentEmail ?? ''} onChange={e => set('agentEmail', e.target.value || undefined)} />
              </div>
            </div>
          </div>

          {/* Teléfono emergencias */}
          <div>
            <label className={lbl}>Teléfono de emergencias / asistencia</label>
            <input className={inp} placeholder="900 123 456" value={f.emergencyPhone ?? ''} onChange={e => set('emergencyPhone', e.target.value || undefined)} />
          </div>

          {/* Coberturas */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={lbl}>Coberturas incluidas</label>
              <button type="button" className="text-[10px] text-jaecoo-electric hover:underline" onClick={() => setCoverageText(DEFAULT_COVERAGES.join('\n'))}>
                Usar predeterminadas
              </button>
            </div>
            <textarea rows={6} className={`${inp} resize-none font-mono text-xs`} placeholder="Una cobertura por línea…" value={coverageText} onChange={e => setCoverageText(e.target.value)} />
          </div>

          {/* Notas */}
          <div>
            <label className={lbl}>Notas adicionales</label>
            <textarea rows={2} className={`${inp} resize-none`} placeholder="Condiciones especiales, descuentos, etc." value={f.notes ?? ''} onChange={e => set('notes', e.target.value || undefined)} />
          </div>

          {saveError && (
            <p className="text-xs text-jaecoo-danger bg-jaecoo-danger/10 border border-jaecoo-danger/20 rounded-xl px-3 py-2">{saveError}</p>
          )}
          <button type="submit" disabled={saving}
            className="w-full py-3 bg-jaecoo-electric text-jaecoo-base font-bold rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
            {saving && <Loader2 size={16} className="animate-spin" />}
            Guardar seguro
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InsurancePage() {
  const [ins, setIns] = useState<Insurance | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    apiGetInsurance().then(data => { setIns(data); setLoading(false) })
  }, [])

  async function handleSave(data: Insurance) {
    await apiSaveInsurance(data)
    setIns(data)
  }

  if (loading) return (
    <div className="grid md:grid-cols-[3fr_2fr] gap-5 items-start animate-pulse">
      <div className="space-y-5">
        <div className="bg-jaecoo-card border border-jaecoo-border rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-jaecoo-elevated rounded-2xl shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-jaecoo-elevated rounded-full w-2/3" />
              <div className="h-3 bg-jaecoo-elevated rounded-full w-1/3" />
            </div>
          </div>
          <div className="h-8 bg-jaecoo-elevated rounded-xl" />
        </div>
        <div className="bg-jaecoo-card border border-jaecoo-border rounded-2xl p-5">
          <div className="h-3 bg-jaecoo-elevated rounded-full w-24 mb-4" />
          {[0,1,2,3].map(i => <div key={i} className="h-3 bg-jaecoo-elevated rounded-full w-full mb-2 last:mb-0" />)}
        </div>
      </div>
      <div className="space-y-5">
        <div className="bg-jaecoo-card border border-jaecoo-border rounded-2xl p-5">
          <div className="h-3 bg-jaecoo-elevated rounded-full w-16 mb-4" />
          <div className="grid grid-cols-3 gap-4">
            {[0,1,2].map(i => (
              <div key={i} className="text-center space-y-2">
                <div className="h-7 bg-jaecoo-elevated rounded-full" />
                <div className="h-2.5 bg-jaecoo-elevated rounded-full w-3/4 mx-auto" />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-jaecoo-card border border-jaecoo-border rounded-2xl p-5">
          <div className="h-3 bg-jaecoo-elevated rounded-full w-28 mb-3" />
          {[0,1,2,3,4].map(i => (
            <div key={i} className="flex gap-3 py-2.5 border-b border-jaecoo-border last:border-0">
              <div className="w-3.5 h-3.5 bg-jaecoo-elevated rounded shrink-0" />
              <div className="h-3 bg-jaecoo-elevated rounded-full w-24" />
              <div className="h-3 bg-jaecoo-elevated rounded-full flex-1 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  if (!ins) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-jaecoo-electric-dim flex items-center justify-center">
          <Shield size={28} className="text-jaecoo-electric" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-jaecoo-primary">Sin seguro registrado</p>
          <p className="text-xs text-jaecoo-muted mt-1">Registra los datos de tu póliza para tenerlos siempre a mano</p>
        </div>
        <button onClick={() => setEditing(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-jaecoo-electric text-jaecoo-base rounded-xl text-sm font-bold hover:brightness-110 transition-all">
          <Plus size={15} /> Registrar seguro
        </button>
        {editing && <InsuranceModal initial={EMPTY} onSave={handleSave} onClose={() => setEditing(false)} />}
      </div>
    )
  }

  const typeInfo  = TYPES.find(t => t.value === ins.type)!
  const TypeIcon  = typeInfo.icon
  const days      = daysUntil(ins.endDate)
  const expiry    = expiryBadge(days)
  const monthly   = ins.annualPrice != null ? ins.annualPrice / 12 : null

  return (
    <>
      <div className="grid md:grid-cols-[3fr_2fr] gap-5 items-start">

        {/* LEFT COLUMN: Hero, Coverages, Notes */}
        <div className="space-y-5">

          {/* Hero card */}
          <div className="bg-jaecoo-card border border-jaecoo-border rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${typeInfo.color}`}>
                  <TypeIcon size={22} />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold text-jaecoo-primary truncate">{ins.company}</p>
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${typeInfo.color}`}>{typeInfo.label}</span>
                </div>
              </div>
              <button onClick={() => setEditing(true)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-jaecoo-muted hover:text-jaecoo-electric hover:bg-jaecoo-electric-dim border border-jaecoo-border hover:border-jaecoo-electric/30 transition-all">
                <Pencil size={12} /> Editar
              </button>
            </div>

            {/* Expiry alert */}
            {expiry && (
              <div className={`mt-4 flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold ${expiry.color}`}>
                <AlertTriangle size={13} className="shrink-0" />
                {expiry.label}
                {ins.autoRenewal && <span className="ml-auto flex items-center gap-1 font-normal opacity-80"><RefreshCw size={11} /> Auto-renovación</span>}
              </div>
            )}
          </div>

          {/* Coverages */}
          {ins.coverages.length > 0 && (
            <div className="bg-jaecoo-card border border-jaecoo-border rounded-2xl p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-jaecoo-muted mb-3 flex items-center gap-2">
                <CheckCircle2 size={13} /> Coberturas incluidas
              </h3>
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
                {ins.coverages.map((c, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                    <span className="text-xs text-jaecoo-secondary">{c}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {ins.notes && (
            <div className="bg-jaecoo-card border border-jaecoo-border rounded-2xl p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-jaecoo-muted mb-2">Notas</h3>
              <p className="text-xs text-jaecoo-secondary leading-relaxed whitespace-pre-wrap">{ins.notes}</p>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Pricing, Policy details, Contact */}
        <div className="space-y-5">

          {/* Pricing */}
          {(ins.annualPrice != null || ins.excessAmount != null) && (
            <div className="bg-jaecoo-card border border-jaecoo-border rounded-2xl p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-jaecoo-muted mb-3 flex items-center gap-2">
                <Euro size={13} /> Precio
              </h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                {ins.annualPrice != null && (
                  <div>
                    <p className="text-2xl font-bold text-jaecoo-primary">{ins.annualPrice.toFixed(2)}<span className="text-sm font-normal text-jaecoo-muted"> €</span></p>
                    <p className="text-[10px] text-jaecoo-muted uppercase tracking-wide mt-0.5">Prima anual</p>
                  </div>
                )}
                {monthly != null && (
                  <div>
                    <p className="text-2xl font-bold text-jaecoo-electric">{monthly.toFixed(2)}<span className="text-sm font-normal text-jaecoo-muted"> €</span></p>
                    <p className="text-[10px] text-jaecoo-muted uppercase tracking-wide mt-0.5">Al mes</p>
                  </div>
                )}
                {ins.excessAmount != null && (
                  <div>
                    <p className="text-2xl font-bold text-jaecoo-fuel">{ins.excessAmount.toFixed(2)}<span className="text-sm font-normal text-jaecoo-muted"> €</span></p>
                    <p className="text-[10px] text-jaecoo-muted uppercase tracking-wide mt-0.5">Franquicia</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Policy details */}
          <div className="bg-jaecoo-card border border-jaecoo-border rounded-2xl p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-jaecoo-muted mb-1 flex items-center gap-2">
              <FileText size={13} /> Datos de la póliza
            </h3>
            {ins.policyNumber && <InfoRow icon={Hash}         label="Número de póliza" value={ins.policyNumber} highlight />}
            {ins.startDate    && <InfoRow icon={CalendarDays} label="Fecha de inicio"   value={ins.startDate} />}
            {ins.endDate      && <InfoRow icon={CalendarDays} label="Vencimiento"       value={ins.endDate} highlight />}
            <InfoRow icon={RefreshCw} label="Renovación auto." value={ins.autoRenewal ? 'Sí' : 'No'} />
            <InfoRow icon={TypeIcon}  label="Tipo de cobertura" value={typeInfo.label} />
          </div>

          {/* Contact */}
          {(ins.emergencyPhone || ins.agentName || ins.agentPhone || ins.agentEmail) && (
            <div className="bg-jaecoo-card border border-jaecoo-border rounded-2xl p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-jaecoo-muted mb-1 flex items-center gap-2">
                <Phone size={13} /> Contacto
              </h3>
              {ins.emergencyPhone && (
                <div className="flex items-center gap-3 py-2.5 border-b border-jaecoo-border">
                  <Phone size={14} className="text-emerald-400 shrink-0" />
                  <span className="text-xs text-jaecoo-muted w-36 shrink-0">Emergencias 24h</span>
                  <a href={`tel:${ins.emergencyPhone}`} className="text-xs font-bold text-emerald-400 hover:underline transition-colors">{ins.emergencyPhone}</a>
                </div>
              )}
              {ins.agentName  && <InfoRow icon={User}  label="Mediador / agente" value={ins.agentName} />}
              {ins.agentPhone && (
                <div className="flex items-center gap-3 py-2.5 border-b border-jaecoo-border last:border-0">
                  <Phone size={14} className="text-jaecoo-muted shrink-0" />
                  <span className="text-xs text-jaecoo-muted w-36 shrink-0">Tel. agente</span>
                  <a href={`tel:${ins.agentPhone}`} className="text-xs font-semibold text-jaecoo-electric hover:underline transition-colors">{ins.agentPhone}</a>
                </div>
              )}
              {ins.agentEmail && (
                <div className="flex items-center gap-3 py-2.5 last:border-0">
                  <Mail size={14} className="text-jaecoo-muted shrink-0" />
                  <span className="text-xs text-jaecoo-muted w-36 shrink-0">Email agente</span>
                  <a href={`mailto:${ins.agentEmail}`} className="text-xs font-semibold text-jaecoo-electric hover:underline truncate transition-colors">{ins.agentEmail}</a>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {editing && <InsuranceModal initial={ins} onSave={handleSave} onClose={() => setEditing(false)} />}
    </>
  )
}
