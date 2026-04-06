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
  '/neumaticos':    'Neumáticos',
  '/taller':        'Taller',
  '/seguro':        'Seguro',
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

      {/* Buy Me a Coffee — botón flotante */}
      <a
        href="https://buymeacoffee.com/alfredoescd"
        target="_blank"
        rel="noopener noreferrer"
        title="Invítame a un café"
        className="group fixed bottom-5 right-5 z-50 flex items-center gap-2 pl-3 pr-3 py-2 rounded-full
          bg-amber-600 text-white text-xs font-semibold shadow-lg
          hover:bg-amber-700 transition-all duration-300 overflow-hidden whitespace-nowrap
          w-[2.25rem] hover:w-[11rem]"
      >
        <span className="text-base leading-none shrink-0">☕</span>
        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-100">Invítame a un café</span>
      </a>
    </div>
  )
}
