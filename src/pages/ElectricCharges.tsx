import { useState, useCallback, useMemo } from 'react'
import { Plus, Zap, Pencil, Trash2, MapPin, Calendar, Battery, Filter, X as XIcon } from 'lucide-react'
import { drivingModeLabel, drivingModeIcon } from '../components/DrivingModeSelector'
import { useData } from '../context/DataContext'
import type { ElectricCharge, FuelRefuel } from '../types'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import ChargeForm from '../components/forms/ChargeForm'
import QuickEntryModal from '../components/QuickEntryModal'
import { ToastContainer } from '../components/Toast'
import type { ToastData } from '../components/Toast'
import { formatDate, formatCurrency, formatNumber, BATTERY_CAPACITY_KWH } from '../utils/calculations'

export default function ElectricCharges() {
  const { data, addCharge, updateCharge, deleteCharge, addRefuel } = useData()
  const sortedByOdo = [...data.electricCharges].sort((a, b) => a.odometer - b.odometer)

  const [showForm, setShowForm] = useState(false)
  const [showQuick, setShowQuick] = useState(false)
  const [editing, setEditing] = useState<ElectricCharge | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [toasts, setToasts] = useState<ToastData[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [filterMode, setFilterMode] = useState<'all' | 'city' | 'highway' | 'mixed'>('all')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')

  const charges = useMemo(() => {
    return [...data.electricCharges]
      .filter(c => {
        if (filterMode !== 'all' && c.drivingMode !== filterMode) return false
        if (filterFrom && c.date < filterFrom) return false
        if (filterTo && c.date > filterTo) return false
        return true
      })
      .sort((a, b) => b.odometer - a.odometer)
  }, [data.electricCharges, filterMode, filterFrom, filterTo])

  const hasActiveFilter = filterMode !== 'all' || filterFrom !== '' || filterTo !== ''
  const clearFilters = () => { setFilterMode('all'); setFilterFrom(''); setFilterTo('') }

  const toast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = crypto.randomUUID()
    setToasts(prev => [...prev, { id, message, type }])
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const handleAdd = async (data: Omit<ElectricCharge, 'id'>) => {
    setSubmitting(true)
    try {
      await addCharge({ ...data, id: crypto.randomUUID() })
      toast('Recarga guardada correctamente')
      setShowForm(false)
    } catch {
      toast('Error al guardar la recarga', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async (data: Omit<ElectricCharge, 'id'>) => {
    if (!editing) return
    setSubmitting(true)
    try {
      await updateCharge({ ...data, id: editing.id })
      toast('Recarga actualizada')
      setEditing(null)
    } catch {
      toast('Error al actualizar', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    try {
      await deleteCharge(deleting)
      toast('Recarga eliminada')
    } catch {
      toast('Error al eliminar', 'error')
    } finally {
      setDeleting(null)
    }
  }

  const handleQuickCharge = async (d: Omit<ElectricCharge, 'id'>) => {
    await addCharge({ ...d, id: crypto.randomUUID() })
    toast('Recarga guardada')
  }

  const handleQuickFuel = async (d: Omit<FuelRefuel, 'id'>) => {
    await addRefuel({ ...d, id: crypto.randomUUID() })
    toast('Repostaje guardado')
  }

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-jaecoo-muted">
          {charges.length} registro{charges.length !== 1 ? 's' : ''}
          {hasActiveFilter && <span className="ml-1 text-jaecoo-electric">(filtrado)</span>}
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-jaecoo-electric hover:brightness-110 text-jaecoo-base rounded-xl text-sm font-bold transition-all shadow-j-electric"
        >
          <Plus size={16} /> Nueva recarga
        </button>
      </div>

      {/* Filters */}
      {data.electricCharges.length > 0 && (
        <div className="bg-jaecoo-elevated border border-jaecoo-border rounded-xl p-3 flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-1.5 text-xs text-jaecoo-muted font-medium">
            <Filter size={13} /> Filtros
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(['all', 'city', 'highway', 'mixed'] as const).map(m => (
              <button
                key={m}
                onClick={() => setFilterMode(m)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors
                  ${filterMode === m
                    ? 'bg-jaecoo-electric text-jaecoo-base'
                    : 'bg-jaecoo-card text-jaecoo-secondary hover:bg-jaecoo-border-strong'}`}
              >
                {m === 'all' ? 'Todos' : m === 'city' ? '🏙️ Ciudad' : m === 'highway' ? '🛣️ Carretera' : '🔄 Mixto'}
              </button>
            ))}
          </div>
          <div className="flex gap-2 items-center ml-auto">
            <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} className="text-xs border border-jaecoo-border bg-jaecoo-card text-jaecoo-secondary rounded-lg px-2 py-1 outline-none focus:border-jaecoo-electric" />
            <span className="text-xs text-jaecoo-muted">—</span>
            <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} className="text-xs border border-jaecoo-border bg-jaecoo-card text-jaecoo-secondary rounded-lg px-2 py-1 outline-none focus:border-jaecoo-electric" />
            {hasActiveFilter && (
              <button onClick={clearFilters} aria-label="Limpiar filtros" className="text-xs text-jaecoo-danger hover:text-jaecoo-danger/80 font-medium flex items-center gap-0.5 px-1">
                <XIcon size={12} /> Limpiar
              </button>
            )}
          </div>
        </div>
      )}

      {/* List */}
      {data.electricCharges.length === 0 ? (
        <div className="bg-jaecoo-card border border-jaecoo-border rounded-2xl p-12 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-jaecoo-electric-dim text-jaecoo-electric rounded-2xl mb-4">
            <Zap size={28} />
          </div>
          <p className="font-semibold text-jaecoo-primary">Sin recargas registradas</p>
          <p className="text-sm text-jaecoo-muted mt-1 mb-4">Añade tu primera recarga eléctrica</p>
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-jaecoo-electric text-jaecoo-base rounded-xl text-sm font-bold hover:brightness-110 transition-all">
            <Plus size={14} /> Añadir recarga
          </button>
        </div>
      ) : charges.length === 0 ? (
        <div className="bg-jaecoo-card border border-jaecoo-border rounded-2xl p-10 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-jaecoo-elevated text-jaecoo-muted rounded-2xl mb-3">
            <Filter size={22} />
          </div>
          <p className="font-semibold text-jaecoo-primary">Sin resultados</p>
          <p className="text-sm text-jaecoo-muted mt-1 mb-4">Ninguna recarga coincide con los filtros</p>
          <button onClick={clearFilters} className="inline-flex items-center gap-2 px-4 py-2 bg-jaecoo-elevated hover:bg-jaecoo-border-strong text-jaecoo-secondary rounded-xl text-sm font-medium transition-colors">
            <XIcon size={14} /> Quitar filtros
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {charges.map((c, idx) => {
            const odoIdx = sortedByOdo.findIndex(x => x.id === c.id)
            const prev = odoIdx > 0 ? sortedByOdo[odoIdx - 1] : null
            const km = prev ? c.odometer - prev.odometer : null
            const efficiency = km && km > 0 ? (prev!.kWh / km) * 100 : null
            const chargePercent = Math.min(100, Math.round((c.kWh / BATTERY_CAPACITY_KWH) * 100))
            const batteryLabel = c.batteryPercent != null ? `${c.batteryPercent}%` : `~${chargePercent}%`
            const isEstimatedBattery = c.batteryPercent == null

            return (
              <div key={c.id} className="bg-jaecoo-card border border-jaecoo-border hover:border-jaecoo-electric/30 rounded-2xl p-4 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 flex flex-col items-center gap-1">
                    <div className="bg-jaecoo-electric-dim text-jaecoo-electric rounded-xl p-2">
                      <Zap size={18} />
                    </div>
                    <span className="text-[10px] text-jaecoo-muted font-medium">#{charges.length - idx}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-jaecoo-primary text-sm truncate">{c.stationName}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin size={11} className="text-jaecoo-muted shrink-0" />
                          <p className="text-xs text-jaecoo-muted truncate">{c.stationAddress}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setEditing(c)}
                          aria-label="Editar recarga"
                          className="w-9 h-9 flex items-center justify-center rounded-lg text-jaecoo-muted hover:text-jaecoo-electric hover:bg-jaecoo-electric-dim transition-colors"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleting(c.id)}
                          aria-label="Eliminar recarga"
                          className="w-9 h-9 flex items-center justify-center rounded-lg text-jaecoo-muted hover:text-jaecoo-danger hover:bg-jaecoo-danger/10 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                      <Chip icon={<Calendar size={11} />} label={formatDate(c.date)} />
                      <Chip icon={<Zap size={11} />} label={`${c.kWh} kWh`} electric />
                      <Chip label={formatCurrency(c.totalPrice)} green />
                      {c.totalPriceGross > c.totalPrice && <Chip label={`Bruto ${formatCurrency(c.totalPriceGross)}`} />}
                      {km !== null && km > 0 && <Chip label={`${km.toLocaleString('es-ES')} km`} />}
                      {efficiency && <Chip label={`${efficiency.toFixed(2)} kWh/100km`} electric />}
                      {km === null && <Chip label="Primer registro" />}
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      <ChipSm icon={<Battery size={10} />} label={`${batteryLabel} bat.${isEstimatedBattery ? ' (est.)' : ''}`} />
                      <ChipSm label={`${formatNumber(c.pricePerKWh, 3)} €/kWh tarifa`} />
                      {c.wayletBefore != null && <ChipSm label={`💳 ${formatCurrency(c.wayletBefore)} → ${formatCurrency(c.wayletAfter ?? 0)}`} />}
                      {c.drivingMode && <ChipSm label={`${drivingModeIcon(c.drivingMode)} ${drivingModeLabel(c.drivingMode)}`} />}
                    </div>

                    <div className="mt-2 text-xs text-jaecoo-muted">
                      Odómetro: <strong className="text-jaecoo-secondary">{c.odometer.toLocaleString('es-ES')} km</strong>
                    </div>

                    {c.notes && <p className="text-xs text-jaecoo-muted italic mt-1">{c.notes}</p>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* FAB — Modo Gasolinera */}
      <button
        onClick={() => setShowQuick(true)}
        className="fixed bottom-6 right-4 z-40 flex items-center gap-2 px-5 py-3.5 bg-jaecoo-electric text-jaecoo-base rounded-full font-bold text-sm shadow-j-electric hover:brightness-110 transition-all active:scale-95"
      >
        <Zap size={16} /> Añadir rápido
      </button>

      {/* Modals */}
      {(showForm || editing) && (
        <Modal
          title={editing ? 'Editar recarga' : 'Nueva recarga eléctrica'}
          onClose={() => { setShowForm(false); setEditing(null) }}
          size="lg"
        >
          <ChargeForm
            initial={editing ?? undefined}
            onSubmit={editing ? handleUpdate : handleAdd}
            onCancel={() => { setShowForm(false); setEditing(null) }}
            isSubmitting={submitting}
          />
        </Modal>
      )}

      {showQuick && (
        <QuickEntryModal
          mode="electric"
          onClose={() => setShowQuick(false)}
          onSaveCharge={handleQuickCharge}
          onSaveFuel={handleQuickFuel}
        />
      )}

      {deleting && (
        <ConfirmDialog
          message="¿Eliminar esta recarga? Esta acción no se puede deshacer."
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}

      <div className="flex justify-center pt-6 pb-2">
        <a
          href="https://buymeacoffee.com/alfredoescd"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium
            bg-amber-500/10 text-amber-400 border border-amber-500/20
            hover:bg-amber-500/20 hover:border-amber-500/40 hover:text-amber-300
            transition-all duration-200 group"
        >
          <span className="text-base leading-none">☕</span>
          <span>¿Te es útil esta app? Invítame a un café</span>
          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-amber-400">→</span>
        </a>
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}

function Chip({ icon, label, electric, green }: { icon?: React.ReactNode; label: string; electric?: boolean; green?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full
      ${electric ? 'bg-jaecoo-electric-dim text-jaecoo-electric' : green ? 'bg-emerald-500/10 text-emerald-400' : 'bg-jaecoo-elevated text-jaecoo-secondary'}`}>
      {icon}{label}
    </span>
  )
}

function ChipSm({ icon, label }: { icon?: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-jaecoo-elevated text-jaecoo-muted border border-jaecoo-border">
      {icon}{label}
    </span>
  )
}
