import { useState, useCallback, useMemo } from 'react'
import { Plus, Fuel, Pencil, Trash2, MapPin, Calendar, Filter, X as XIcon, Zap, ChevronDown } from 'lucide-react'
import { drivingModeLabel, drivingModeIcon } from '../components/DrivingModeSelector'
import { useData } from '../context/DataContext'
import type { FuelRefuel, ElectricCharge } from '../types'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import FuelForm from '../components/forms/FuelForm'
import QuickEntryModal from '../components/QuickEntryModal'
import { ToastContainer } from '../components/Toast'
import type { ToastData } from '../components/Toast'
import { formatDate, formatCurrency, formatNumber } from '../utils/calculations'

export default function FuelRefuels() {
  const { data, addRefuel, updateRefuel, deleteRefuel, addCharge } = useData()
  const sortedByOdo = [...data.fuelRefuels].sort((a, b) => a.odometer - b.odometer)

  const [showForm, setShowForm] = useState(false)
  const [showQuick, setShowQuick] = useState(false)
  const [editing, setEditing] = useState<FuelRefuel | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [toasts, setToasts] = useState<ToastData[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [filterMode, setFilterMode] = useState<'all' | 'city' | 'highway' | 'mixed'>('all')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const refuels = useMemo(() => {
    return [...data.fuelRefuels]
      .filter(r => {
        if (filterMode !== 'all' && r.drivingMode !== filterMode) return false
        if (filterFrom && r.date < filterFrom) return false
        if (filterTo && r.date > filterTo) return false
        return true
      })
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [data.fuelRefuels, filterMode, filterFrom, filterTo])

  const hasActiveFilter = filterMode !== 'all' || filterFrom !== '' || filterTo !== ''
  const clearFilters = () => { setFilterMode('all'); setFilterFrom(''); setFilterTo('') }

  const kmSinceLast = (refuel: FuelRefuel): number | null => {
    const idx = sortedByOdo.findIndex(r => r.id === refuel.id)
    if (idx <= 0) return null
    return refuel.odometer - sortedByOdo[idx - 1].odometer
  }

  const consumption = (refuel: FuelRefuel): number | null => {
    const km = kmSinceLast(refuel)
    if (!km || km <= 0) return null
    return (refuel.liters / km) * 100
  }

  const toast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = crypto.randomUUID()
    setToasts(prev => [...prev, { id, message, type }])
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const handleAdd = async (data: Omit<FuelRefuel, 'id'>) => {
    setSubmitting(true)
    try {
      await addRefuel({ ...data, id: crypto.randomUUID() })
      toast('Repostaje guardado correctamente')
      setShowForm(false)
    } catch {
      toast('Error al guardar el repostaje', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async (data: Omit<FuelRefuel, 'id'>) => {
    if (!editing) return
    setSubmitting(true)
    try {
      await updateRefuel({ ...data, id: editing.id })
      toast('Repostaje actualizado')
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
      await deleteRefuel(deleting)
      toast('Repostaje eliminado')
    } catch {
      toast('Error al eliminar', 'error')
    } finally {
      setDeleting(null)
    }
  }

  const handleQuickFuel = async (d: Omit<FuelRefuel, 'id'>) => {
    await addRefuel({ ...d, id: crypto.randomUUID() })
    toast('Repostaje guardado')
  }

  const handleQuickCharge = async (d: Omit<ElectricCharge, 'id'>) => {
    await addCharge({ ...d, id: crypto.randomUUID() })
    toast('Recarga guardada')
  }

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <p className="text-sm text-jaecoo-muted">
          {refuels.length} registro{refuels.length !== 1 ? 's' : ''}
          {hasActiveFilter && <span className="ml-1 text-jaecoo-fuel">(filtrado)</span>}
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-jaecoo-fuel hover:brightness-110 text-white rounded-xl text-sm font-bold transition-all shadow-j-fuel"
        >
          <Plus size={16} /> Nuevo repostaje
        </button>
      </div>

      {/* Filters */}
      {data.fuelRefuels.length > 0 && (
        <div className="bg-jaecoo-elevated border border-jaecoo-border rounded-xl overflow-hidden">
          {/* Mobile toggle header */}
          <button
            className="sm:hidden w-full flex items-center justify-between px-3 py-2.5 text-xs text-jaecoo-muted font-medium"
            onClick={() => setFiltersOpen(o => !o)}
          >
            <span className="flex items-center gap-1.5">
              <Filter size={13} />
              Filtros{hasActiveFilter ? <span className="ml-1 text-jaecoo-fuel font-bold">({[filterMode !== 'all', filterFrom !== '', filterTo !== ''].filter(Boolean).length} activos)</span> : ''}
            </span>
            <ChevronDown size={14} className={`transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Filter panel — always visible on sm+, toggleable on mobile */}
          <div className={`flex flex-col sm:flex-row sm:flex-wrap gap-3 items-start sm:items-center p-3 ${filtersOpen ? '' : 'hidden sm:flex'}`}>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-jaecoo-muted font-medium">
              <Filter size={13} /> Filtros
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(['all', 'city', 'highway', 'mixed'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setFilterMode(m)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors
                    ${filterMode === m
                      ? 'bg-jaecoo-fuel text-white'
                      : 'bg-jaecoo-card text-jaecoo-secondary hover:bg-jaecoo-border-strong'}`}
                >
                  {m === 'all' ? 'Todos' : m === 'city' ? '🏙️ Ciudad' : m === 'highway' ? '🛣️ Carretera' : '🔄 Mixto'}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 items-center sm:ml-auto w-full sm:w-auto">
              <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} className="flex-1 sm:flex-none text-xs border border-jaecoo-border bg-jaecoo-card text-jaecoo-secondary rounded-lg px-2 py-1.5 outline-none focus:border-jaecoo-fuel" />
              <span className="text-xs text-jaecoo-muted">—</span>
              <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} className="flex-1 sm:flex-none text-xs border border-jaecoo-border bg-jaecoo-card text-jaecoo-secondary rounded-lg px-2 py-1.5 outline-none focus:border-jaecoo-fuel" />
              {hasActiveFilter && (
                <button onClick={clearFilters} aria-label="Limpiar filtros" className="text-xs text-jaecoo-danger hover:text-jaecoo-danger/80 font-medium flex items-center gap-0.5 px-1 transition-colors">
                  <XIcon size={12} /> Limpiar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {data.fuelRefuels.length === 0 ? (
        <div className="bg-jaecoo-card border border-jaecoo-border rounded-2xl p-12 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-jaecoo-fuel-dim text-jaecoo-fuel rounded-2xl mb-4">
            <Fuel size={28} />
          </div>
          <p className="font-semibold text-jaecoo-primary">Sin repostajes registrados</p>
          <p className="text-sm text-jaecoo-muted mt-1 mb-4">Añade tu primer repostaje de gasolina</p>
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-jaecoo-fuel text-white rounded-xl text-sm font-bold hover:brightness-110 transition-all">
            <Plus size={14} /> Añadir repostaje
          </button>
        </div>
      ) : refuels.length === 0 ? (
        <div className="bg-jaecoo-card border border-jaecoo-border rounded-2xl p-10 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-jaecoo-elevated text-jaecoo-muted rounded-2xl mb-3">
            <Filter size={22} />
          </div>
          <p className="font-semibold text-jaecoo-primary">Sin resultados</p>
          <p className="text-sm text-jaecoo-muted mt-1 mb-4">Ningún repostaje coincide con los filtros</p>
          <button onClick={clearFilters} className="inline-flex items-center gap-2 px-4 py-2 bg-jaecoo-elevated hover:bg-jaecoo-border-strong text-jaecoo-secondary rounded-xl text-sm font-medium transition-colors">
            <XIcon size={14} /> Quitar filtros
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {refuels.map((r, idx) => {
            const km = kmSinceLast(r)
            const cons = consumption(r)
            return (
              <div key={r.id} className="bg-jaecoo-card border border-jaecoo-border hover:border-jaecoo-fuel/30 rounded-2xl p-4 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 flex flex-col items-center gap-1">
                    <div className="bg-jaecoo-fuel-dim text-jaecoo-fuel rounded-xl p-2">
                      <Fuel size={18} />
                    </div>
                    <span className="text-[10px] text-jaecoo-muted font-medium">#{refuels.length - idx}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-jaecoo-primary text-sm truncate">{r.stationName}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin size={11} className="text-jaecoo-muted shrink-0" />
                          <p className="text-xs text-jaecoo-muted truncate">{r.stationAddress}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setEditing(r)}
                          aria-label="Editar repostaje"
                          className="w-11 h-11 flex items-center justify-center rounded-lg text-jaecoo-muted hover:text-jaecoo-fuel hover:bg-jaecoo-fuel-dim transition-colors"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleting(r.id)}
                          aria-label="Eliminar repostaje"
                          className="w-11 h-11 flex items-center justify-center rounded-lg text-jaecoo-muted hover:text-jaecoo-danger hover:bg-jaecoo-danger/10 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                      <Chip icon={<Calendar size={11} />} label={formatDate(r.date)} />
                      <Chip icon={<Fuel size={11} />} label={`${r.liters} L`} fuel />
                      <Chip label={formatCurrency(r.totalPrice)} green />
                      {km !== null && km > 0 && <Chip label={`${km.toLocaleString('es-ES')} km`} />}
                      {cons !== null && <Chip label={`${cons.toFixed(2)} L/100km`} fuel />}
                      {km === null && <Chip label="Primer repostaje" />}
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      <ChipSm label={`${formatNumber(r.pricePerLiter, 3)} €/L`} />
                      {r.drivingMode && <ChipSm label={`${drivingModeIcon(r.drivingMode)} ${drivingModeLabel(r.drivingMode)}`} />}
                    </div>

                    <div className="mt-2 text-xs text-jaecoo-muted">
                      Odómetro: <strong className="text-jaecoo-secondary">{r.odometer.toLocaleString('es-ES')} km</strong>
                    </div>

                    {r.notes && <p className="text-xs text-jaecoo-muted italic mt-1">{r.notes}</p>}
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
        className="fixed bottom-6 right-4 z-40 flex items-center gap-2 px-5 py-3.5 bg-jaecoo-fuel text-white rounded-full font-bold text-sm shadow-j-fuel hover:brightness-110 transition-all active:scale-95"
      >
        <Zap size={16} /> Añadir rápido
      </button>

      {(showForm || editing) && (
        <Modal
          title={editing ? 'Editar repostaje' : 'Nuevo repostaje de gasolina'}
          onClose={() => { setShowForm(false); setEditing(null) }}
          size="lg"
        >
          <FuelForm
            initial={editing ?? undefined}
            onSubmit={editing ? handleUpdate : handleAdd}
            onCancel={() => { setShowForm(false); setEditing(null) }}
            isSubmitting={submitting}
          />
        </Modal>
      )}

      {showQuick && (
        <QuickEntryModal
          mode="fuel"
          onClose={() => setShowQuick(false)}
          onSaveCharge={handleQuickCharge}
          onSaveFuel={handleQuickFuel}
        />
      )}

      {deleting && (
        <ConfirmDialog
          message="¿Eliminar este repostaje? Esta acción no se puede deshacer."
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}

function Chip({ icon, label, fuel, green }: { icon?: React.ReactNode; label: string; fuel?: boolean; green?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full
      ${fuel ? 'bg-jaecoo-fuel-dim text-jaecoo-fuel' : green ? 'bg-jaecoo-success-dim text-jaecoo-success' : 'bg-jaecoo-elevated text-jaecoo-secondary'}`}>
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
