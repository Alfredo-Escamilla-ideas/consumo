import { useState } from 'react'
import { Car, LogOut, Info, Zap, Fuel, Database } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'

export default function Settings() {
  const { plate, vehicleModel, logout } = useAuth()
  const { data } = useData()
  const [confirmLogout, setConfirmLogout] = useState(false)

  return (
    <div className="max-w-xl space-y-6">
      {/* Vehicle info */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-600 text-white rounded-xl p-2.5">
            <Car size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800">{vehicleModel}</h2>
            <p className="text-xs text-slate-500">Vehículo registrado</p>
          </div>
        </div>
        <dl className="space-y-2">
          <Row label="Matrícula" value={plate ?? '—'} mono />
          <Row label="Modelo" value={vehicleModel ?? '—'} />
          <Row label="Capacidad batería" value="18,3 kWh" />
        </dl>
      </div>

      {/* Stats summary */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Database size={15} className="text-slate-400" />
          <h2 className="font-semibold text-slate-800 text-sm">Datos almacenados</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-xl p-4 flex items-center gap-3">
            <Zap size={20} className="text-blue-500" />
            <div>
              <p className="text-2xl font-bold text-blue-700">{data.electricCharges.length}</p>
              <p className="text-xs text-slate-500">Recargas</p>
            </div>
          </div>
          <div className="bg-orange-50 rounded-xl p-4 flex items-center gap-3">
            <Fuel size={20} className="text-orange-500" />
            <div>
              <p className="text-2xl font-bold text-orange-700">{data.fuelRefuels.length}</p>
              <p className="text-xs text-slate-500">Repostajes</p>
            </div>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Info size={15} className="text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-700">Acerca de la app</h3>
        </div>
        <dl className="space-y-2">
          <Row label="Versión" value="2.0.0" />
          <Row label="Base de datos" value="MySQL · lienzovirtual.com" />
          <Row label="Datos" value="Exclusivos por matrícula" />
        </dl>
      </div>

      {/* Logout */}
      <div className="bg-white rounded-2xl border border-red-100 p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-1">Cerrar sesión</h3>
        <p className="text-xs text-slate-400 mb-4">
          Tus datos seguirán guardados en la base de datos. Podrás volver a entrar con tu matrícula y contraseña.
        </p>
        {!confirmLogout ? (
          <button
            onClick={() => setConfirmLogout(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-sm font-medium transition-colors border border-red-200"
          >
            <LogOut size={14} /> Cerrar sesión
          </button>
        ) : (
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-sm text-slate-600">¿Seguro?</p>
            <button onClick={logout} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors">
              Sí, salir
            </button>
            <button onClick={() => setConfirmLogout(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors">
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className={`text-xs font-semibold text-slate-700 ${mono ? 'font-mono tracking-widest' : ''}`}>{value}</dd>
    </div>
  )
}
