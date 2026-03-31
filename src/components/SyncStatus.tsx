import { Cloud, CloudOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { useData } from '../context/DataContext'

export default function SyncStatus() {
  const { isSyncing, syncError, lastSynced, token } = useData()

  if (!token) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-2.5 py-1.5 rounded-full border border-amber-200">
        <CloudOff size={13} />
        <span>Sin GitHub</span>
      </div>
    )
  }

  if (isSyncing) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-full border border-blue-200">
        <Loader2 size={13} className="animate-spin" />
        <span>Sincronizando…</span>
      </div>
    )
  }

  if (syncError) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 px-2.5 py-1.5 rounded-full border border-red-200" title={syncError}>
        <AlertCircle size={13} />
        <span>Error sync</span>
      </div>
    )
  }

  if (lastSynced) {
    const time = lastSynced.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-full border border-emerald-200">
        <CheckCircle2 size={13} />
        <span>Guardado {time}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-full border border-slate-200">
      <Cloud size={13} />
      <span>GitHub</span>
    </div>
  )
}
