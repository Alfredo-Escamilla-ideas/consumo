import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sun, Moon } from 'lucide-react'
import Sidebar, { MenuButton } from './Sidebar'
import SyncStatus from './SyncStatus'
import { useTheme } from '../context/ThemeContext'

const titles: Record<string, string> = {
  '/':              'Panel',
  '/recargas':      'Recargas eléctricas',
  '/repostajes':    'Repostajes de gasolina',
  '/estadisticas':  'Estadísticas',
  '/configuracion': 'Configuración',
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const title = titles[location.pathname] ?? 'Consumo PHEV'
  const { theme, toggle } = useTheme()

  return (
    <div className="min-h-screen bg-jaecoo-base flex">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col lg:ml-16 min-w-0">
        {/* Header */}
        <header className="h-16 bg-jaecoo-surface border-b border-jaecoo-border flex items-center gap-3 px-4 sticky top-0 z-10 shrink-0">
          <MenuButton onClick={() => setSidebarOpen(v => !v)} />
          <h1 className="text-base font-semibold text-jaecoo-primary flex-1 truncate tracking-wide">
            {title}
          </h1>
          {/* Theme toggle */}
          <button
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
            className="p-2 rounded-xl text-jaecoo-muted hover:text-jaecoo-secondary hover:bg-jaecoo-elevated transition-colors"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <SyncStatus />
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 max-w-6xl w-full mx-auto animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
