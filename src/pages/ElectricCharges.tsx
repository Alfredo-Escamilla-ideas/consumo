import { useState, useCallback } from 'react'
import { Plus, Zap, Pencil, Trash2, MapPin, Calendar, Battery } from 'lucide-react'
import { useData } from '../context/DataContext'
import type { ElectricCharge } from '../types'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import ChargeForm from '../components/forms/ChargeForm'
import { ToastContainer } from '../components/Toast'
import type { ToastData } from '../components/Toast'
import { formatDate, formatCurrency, formatNumber } from '../utils/calculations'

export default function ElectricCharges() {
  const { data, addCharge, updateCharge, deleteCharge } = useData()
  const charges = [...data.electricCharges].sort((a, b) => b.date.localeCompare(a.date))

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ElectricCharge | null>(null)
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{charges.length} registros</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={16} /> Nueva recarga
        </button>
      </div>

      {/* List */}
      {charges.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 text-blue-500 rounded-2xl mb-4">
            <Zap size={28} />
          </div>
          <p className="font-semibold text-slate-700">Sin recargas registradas</p>
          <p className="text-sm text-slate-400 mt-1 mb-4">Añade tu primera recarga eléctrica</p>
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            <Plus size={14} /> Añadir recarga
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {charges.map((c, idx) => {
            const km = c.odometerEnd - c.odometerStart
            const efficiency = km > 0 ? (c.kWh / km) * 100 : null
            const chargePercent = (c.kWh / 18.3) * 100

            return (
              <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-blue-200 transition-colors">
                <div className="flex items-start gap-4">
                  {/* Icon + number */}
                  <div className="shrink-0 flex flex-col items-center gap-1">
                    <div className="bg-blue-100 text-blue-600 rounded-xl p-2">
                      <Zap size={18} />
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">#{charges.length - idx}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{c.stationName}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin size={11} className="text-slate-400" />
                          <p className="text-xs text-slate-400 truncate max-w-[280px]">{c.stationAddress}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => setEditing(c)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleting(c.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="flex flex-wrap gap-3 mt-3">
                      <Chip icon={<Calendar size={11} />} label={formatDate(c.date)} />
                      <Chip icon={<Zap size={11} />} label={`${c.kWh} kWh`} blue />
                      <Chip icon={<Battery size={11} />} label={`${chargePercent.toFixed(0)}% batería`} />
                      <Chip label={formatCurrency(c.totalPrice)} green />
                      <Chip label={`${formatNumber(c.pricePerKWh, 4)} €/kWh (Wailet)`} />
                      {km > 0 && <Chip label={`${km} km recorridos`} />}
                      {efficiency && <Chip label={`${efficiency.toFixed(2)} kWh/100km`} blue />}
                    </div>

                    {/* Odometer */}
                    <div className="flex gap-4 mt-2 text-xs text-slate-400">
                      <span>Km inicio: <strong className="text-slate-600">{c.odometerStart.toLocaleString('es-ES')}</strong></span>
                      <span>Km fin: <strong className="text-slate-600">{c.odometerEnd.toLocaleString('es-ES')}</strong></span>
                    </div>

                    {c.notes && <p className="text-xs text-slate-400 italic mt-1">{c.notes}</p>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

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

      {deleting && (
        <ConfirmDialog
          message="¿Eliminar esta recarga? Esta acción no se puede deshacer."
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}

function Chip({ icon, label, blue, green }: { icon?: React.ReactNode; label: string; blue?: boolean; green?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full
      ${blue ? 'bg-blue-50 text-blue-700' : green ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
      {icon}{label}
    </span>
  )
}
