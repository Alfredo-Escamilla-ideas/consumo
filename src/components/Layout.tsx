import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar, { MenuButton } from './Sidebar'
import SyncStatus from './SyncStatus'
import { RefreshCw } from 'lucide-react'
import { useData } from '../context/DataContext'

const titles: Record<string, string> = {
  '/': 'Panel',
  '/recargas': 'Recargas eléctricas',
  '/repostajes': 'Repostajes de gasolina',
  '/estadisticas': 'Estadísticas',
  '/configuracion': 'Configuración',
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const { syncNow, isSyncing } = useData()
  const title = titles[location.pathname] ?? 'Consumo PHEV'

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main */}
      <div className="flex-1 flex flex-col lg:ml-16 min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center gap-3 px-4 sticky top-0 z-10 shrink-0">
          <MenuButton onClick={() => setSidebarOpen(v => !v)} />
          <h1 className="text-base font-semibold text-slate-800 flex-1 truncate">{title}</h1>
          <button
            onClick={syncNow}
            disabled={isSyncing}
            title="Sincronizar con GitHub"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-40"
          >
            <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
          </button>
          <SyncStatus />
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 max-w-6xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
