import { useState, useCallback } from 'react'
import { Car, LogOut, Info, Zap, Fuel, Database, Trash2, AlertTriangle, Download } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { apiDeleteVehicle } from '../services/api'
import { formatDate } from '../utils/calculations'
import { ToastContainer } from '../components/Toast'
import type { ToastData } from '../components/Toast'

function downloadCsv(filename: string, rows: (string | number | null | undefined)[][]): void {
  const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function Settings() {
  const { plate, vehicleModel, initialOdometer, initialBatteryPct, initialFuelLiters, createdAt, logout } = useAuth()
  const { data } = useData()
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [deleteStep, setDeleteStep] = useState<'idle' | 'confirm' | 'deleting'>('idle')
  const [deleteError, setDeleteError] = useState('')
  const [toasts, setToasts] = useState<ToastData[]>([])

  const toast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = crypto.randomUUID()
    setToasts(prev => [...prev, { id, message, type }])
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const exportChargesCsv = () => {
    const filename = `recargas_${plate}_${new Date().toISOString().substring(0, 10)}.csv`
    const header = ['Fecha', 'Odómetro (km)', 'kWh', '€/kWh tarifa', 'Coste bruto (€)', 'Coste real (€)', 'Batería %', 'Waylet antes (€)', 'Waylet después (€)', 'Estación', 'Dirección', 'Modo conducción', 'Notas']
    const rows = data.electricCharges.map(c => [
      c.date, c.odometer, c.kWh, c.pricePerKWh,
      c.totalPriceGross, c.totalPrice,
      c.batteryPercent ?? '', c.wayletBefore ?? '', c.wayletAfter ?? '',
      c.stationName, c.stationAddress, c.drivingMode ?? '', c.notes ?? '',
    ])
    downloadCsv(filename, [header, ...rows])
    toast(`Descargado: ${filename}`)
  }

  const exportRefuelsCsv = () => {
    const filename = `repostajes_${plate}_${new Date().toISOString().substring(0, 10)}.csv`
    const header = ['Fecha', 'Odómetro (km)', 'Litros', '€/litro', 'Coste total (€)', 'Estación', 'Dirección', 'Modo conducción', 'Notas']
    const rows = data.fuelRefuels.map(r => [
      r.date, r.odometer, r.liters, r.pricePerLiter, r.totalPrice,
      r.stationName, r.stationAddress, r.drivingMode ?? '', r.notes ?? '',
    ])
    downloadCsv(filename, [header, ...rows])
    toast(`Descargado: ${filename}`)
  }

  const handleDeleteVehicle = async () => {
    setDeleteStep('deleting')
    setDeleteError('')
    try {
      await apiDeleteVehicle()
      logout()
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Error al eliminar')
      setDeleteStep('confirm')
    }
  }

  return (
    <>
    <div className="max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-6">

        {/* LEFT COLUMN */}
        <div className="space-y-6">

          {/* Vehicle info */}
          <div className="bg-jaecoo-card border border-jaecoo-border rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-jaecoo-electric text-jaecoo-base rounded-xl p-2.5 shadow-j-electric">
                <Car size={20} />
              </div>
              <div>
                <h2 className="font-semibold text-jaecoo-primary">{vehicleModel}</h2>
                <p className="text-xs text-jaecoo-muted">Vehículo registrado</p>
              </div>
            </div>
            <dl className="space-y-2">
              <Row label="Matrícula" value={plate ?? '—'} mono />
              <Row label="Modelo" value={vehicleModel ?? '—'} />
              <Row label="Capacidad batería" value="18,3 kWh" />
              <Row label="Km al registrarse" value={initialOdometer ? `${initialOdometer.toLocaleString('es-ES')} km` : '—'} />
              <Row label="Batería inicial" value={`${initialBatteryPct}%`} />
              <Row label="Combustible inicial" value={`${initialFuelLiters} L`} />
              {createdAt && <Row label="Fecha de registro" value={formatDate(createdAt)} />}
            </dl>
            <div className="mt-4 pt-4 border-t border-jaecoo-border flex flex-col items-center gap-3">
              <p className="text-xs text-jaecoo-muted text-center leading-relaxed">
                Esta WebApp es gratuita y sin anuncios. Si quieres apoyar a su mantenimiento y su desarrollo, puedes invitarme a un café.
              </p>
              <a
                href="https://buymeacoffee.com/alfredoescd"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium
                  text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30
                  hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
              >
                <span className="text-sm">☕</span>
                ¿Te es útil esta app? Invítame a un café
              </a>
            </div>

          </div>

          {/* Stats summary */}
          <div className="bg-jaecoo-card border border-jaecoo-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Database size={15} className="text-jaecoo-muted" />
              <h2 className="font-semibold text-jaecoo-primary text-sm">Datos almacenados</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-jaecoo-electric-dim border border-jaecoo-electric/10 rounded-xl p-4 flex items-center gap-3">
                <Zap size={20} className="text-jaecoo-electric" />
                <div>
                  <p className="text-2xl font-bold text-jaecoo-electric">{data.electricCharges.length}</p>
                  <p className="text-xs text-jaecoo-muted">Recargas</p>
                </div>
              </div>
              <div className="bg-jaecoo-fuel-dim border border-jaecoo-fuel/10 rounded-xl p-4 flex items-center gap-3">
                <Fuel size={20} className="text-jaecoo-fuel" />
                <div>
                  <p className="text-2xl font-bold text-jaecoo-fuel">{data.fuelRefuels.length}</p>
                  <p className="text-xs text-jaecoo-muted">Repostajes</p>
                </div>
              </div>
            </div>
          </div>

          {/* Export CSV */}
          <div className="bg-jaecoo-card border border-jaecoo-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-1">
              <Download size={15} className="text-jaecoo-muted" />
              <h2 className="font-semibold text-jaecoo-primary text-sm">Exportar datos</h2>
            </div>
            <p className="text-xs text-jaecoo-muted mb-4">Descarga tus registros en formato CSV para abrirlos en Excel o Google Sheets.</p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={exportChargesCsv}
                disabled={data.electricCharges.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2 bg-jaecoo-electric-dim hover:bg-jaecoo-electric/20 text-jaecoo-electric rounded-xl text-sm font-medium transition-colors border border-jaecoo-electric/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download size={14} /> Recargas ({data.electricCharges.length})
              </button>
              <button
                onClick={exportRefuelsCsv}
                disabled={data.fuelRefuels.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2 bg-jaecoo-fuel-dim hover:bg-jaecoo-fuel/20 text-jaecoo-fuel rounded-xl text-sm font-medium transition-colors border border-jaecoo-fuel/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download size={14} /> Repostajes ({data.fuelRefuels.length})
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">

          {/* About */}
          <div className="bg-jaecoo-elevated border border-jaecoo-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Info size={15} className="text-jaecoo-muted" />
              <h3 className="text-sm font-semibold text-jaecoo-secondary">Acerca de la app</h3>
            </div>
            <dl className="space-y-2">
              <Row label="Versión" value="2.0.0" />
              <Row label="Base de datos" value="MySQL · lienzovirtual.com" />
              <Row label="Datos" value="Exclusivos por matrícula" />
            </dl>
          </div>

          {/* Logout */}
          <div className="bg-jaecoo-card border border-jaecoo-border rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-jaecoo-primary mb-1">Cerrar sesión</h3>
            <p className="text-xs text-jaecoo-muted mb-4">
              Tus datos seguirán guardados en la base de datos. Podrás volver a entrar con tu matrícula y contraseña.
            </p>
            {!confirmLogout ? (
              <button
                onClick={() => setConfirmLogout(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-jaecoo-danger/10 text-jaecoo-danger hover:bg-jaecoo-danger/20 rounded-xl text-sm font-medium transition-colors border border-jaecoo-danger/20"
              >
                <LogOut size={14} /> Cerrar sesión
              </button>
            ) : (
              <div className="flex items-center gap-3 flex-wrap">
                <p className="text-sm text-jaecoo-secondary">¿Seguro?</p>
                <button onClick={logout} className="px-4 py-2 bg-jaecoo-danger hover:brightness-110 text-white rounded-xl text-sm font-medium transition-all">
                  Sí, salir
                </button>
                <button onClick={() => setConfirmLogout(false)} className="px-4 py-2 bg-jaecoo-elevated hover:bg-jaecoo-border-strong text-jaecoo-secondary rounded-xl text-sm font-medium transition-colors">
                  Cancelar
                </button>
              </div>
            )}
          </div>

          {/* Delete vehicle */}
          <div className="bg-jaecoo-card border border-jaecoo-danger/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-1">
              <Trash2 size={15} className="text-jaecoo-danger" />
              <h3 className="text-sm font-semibold text-jaecoo-danger">Eliminar vehículo</h3>
            </div>
            <p className="text-xs text-jaecoo-muted mb-4">
              Elimina permanentemente el vehículo y todos sus datos: recargas, repostajes y la matrícula. Esta acción no se puede deshacer.
            </p>

            {deleteStep === 'idle' && (
              <button
                onClick={() => setDeleteStep('confirm')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-jaecoo-danger/10 text-jaecoo-danger hover:bg-jaecoo-danger/20 rounded-xl text-sm font-medium transition-colors border border-jaecoo-danger/20"
              >
                <Trash2 size={14} /> Eliminar vehículo y todos los datos
              </button>
            )}

            {deleteStep === 'confirm' && (
              <div className="bg-jaecoo-danger/10 border border-jaecoo-danger/30 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={16} className="text-jaecoo-danger shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-jaecoo-danger">¿Eliminar todo permanentemente?</p>
                    <p className="text-xs text-jaecoo-danger/80 mt-0.5">
                      Se borrarán <strong>{data.electricCharges.length} recargas</strong> y <strong>{data.fuelRefuels.length} repostajes</strong>, la matrícula <strong className="font-mono">{plate}</strong> y todos sus datos. No hay vuelta atrás.
                    </p>
                  </div>
                </div>
                {deleteError && (
                  <p className="text-xs text-jaecoo-danger bg-jaecoo-danger/10 rounded-lg px-3 py-2">{deleteError}</p>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteVehicle}
                    className="px-4 py-2 bg-jaecoo-danger hover:brightness-110 text-white rounded-xl text-sm font-semibold transition-all"
                  >
                    Sí, eliminar todo
                  </button>
                  <button
                    onClick={() => { setDeleteStep('idle'); setDeleteError('') }}
                    className="px-4 py-2 bg-jaecoo-elevated hover:bg-jaecoo-border-strong text-jaecoo-secondary rounded-xl text-sm font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {deleteStep === 'deleting' && (
              <p className="text-sm text-jaecoo-muted">Eliminando datos…</p>
            )}
          </div>

        </div>
      </div>
    </div>

    <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-jaecoo-border last:border-0">
      <dt className="text-xs text-jaecoo-muted">{label}</dt>
      <dd className={`text-xs font-semibold text-jaecoo-primary ${mono ? 'font-mono tracking-widest' : ''}`}>{value}</dd>
    </div>
  )
}
