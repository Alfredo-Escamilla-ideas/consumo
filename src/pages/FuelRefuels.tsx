import { useState, useCallback } from 'react'
import { Plus, Fuel, Pencil, Trash2, MapPin, Calendar } from 'lucide-react'
import { useData } from '../context/DataContext'
import type { FuelRefuel } from '../types'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import FuelForm from '../components/forms/FuelForm'
import { ToastContainer } from '../components/Toast'
import type { ToastData } from '../components/Toast'
import { formatDate, formatCurrency, formatNumber } from '../utils/calculations'

export default function FuelRefuels() {
  const { data, addRefuel, updateRefuel, deleteRefuel } = useData()
  const refuels = [...data.fuelRefuels].sort((a, b) => b.date.localeCompare(a.date))
  const sortedByOdo = [...data.fuelRefuels].sort((a, b) => a.odometer - b.odometer)

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<FuelRefuel | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [toasts, setToasts] = useState<ToastData[]>([])
  const [submitting, setSubmitting] = useState(false)

  const toast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = crypto.randomUUID()
    setToasts(prev => [...prev, { id, message, type }])
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // Calculate km since last fill for each refuel
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{refuels.length} registros</p>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={16} /> Nuevo repostaje
        </button>
      </div>

      {refuels.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-orange-100 text-orange-500 rounded-2xl mb-4">
            <Fuel size={28} />
          </div>
          <p className="font-semibold text-slate-700">Sin repostajes registrados</p>
          <p className="text-sm text-slate-400 mt-1 mb-4">Añade tu primer repostaje de gasolina</p>
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">
            <Plus size={14} /> Añadir repostaje
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {refuels.map((r, idx) => {
            const km = kmSinceLast(r)
            const cons = consumption(r)
            return (
              <div key={r.id} className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-orange-200 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 flex flex-col items-center gap-1">
                    <div className="bg-orange-100 text-orange-600 rounded-xl p-2">
                      <Fuel size={18} />
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">#{refuels.length - idx}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{r.stationName}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin size={11} className="text-slate-400" />
                          <p className="text-xs text-slate-400 truncate max-w-[280px]">{r.stationAddress}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => setEditing(r)} className="p-1.5 rounded-lg text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleting(r.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 mt-3">
                      <Chip icon={<Calendar size={11} />} label={formatDate(r.date)} />
                      <Chip icon={<Fuel size={11} />} label={`${r.liters} L`} orange />
                      <Chip label={formatCurrency(r.totalPrice)} green />
                      <Chip label={`${formatNumber(r.pricePerLiter, 3)} €/L`} />
                      {km !== null && <Chip label={`${km} km desde último repostaje`} />}
                      {cons !== null && (
                        <Chip label={`${cons.toFixed(2)} L/100km`} orange />
                      )}
                      {km === null && (
                        <Chip label="Primer repostaje (referencia)" />
                      )}
                    </div>

                    <div className="mt-2 text-xs text-slate-400">
                      Odómetro: <strong className="text-slate-600">{r.odometer.toLocaleString('es-ES')} km</strong>
                    </div>

                    {r.notes && <p className="text-xs text-slate-400 italic mt-1">{r.notes}</p>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

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

function Chip({ icon, label, orange, green }: { icon?: React.ReactNode; label: string; orange?: boolean; green?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full
      ${orange ? 'bg-orange-50 text-orange-700' : green ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
      {icon}{label}
    </span>
  )
}
