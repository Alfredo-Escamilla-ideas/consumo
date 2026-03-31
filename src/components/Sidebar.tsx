import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Zap, Fuel, BarChart3, Settings, Menu, X, Car } from 'lucide-react'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

const links = [
  { to: '/', icon: LayoutDashboard, label: 'Panel' },
  { to: '/recargas', icon: Zap, label: 'Recargas' },
  { to: '/repostajes', icon: Fuel, label: 'Repostajes' },
  { to: '/estadisticas', icon: BarChart3, label: 'Estadísticas' },
  { to: '/configuracion', icon: Settings, label: 'Configuración' },
]

export default function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-20 bg-slate-900/40 lg:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full z-30 flex flex-col bg-white border-r border-slate-200 transition-all duration-300
        ${open ? 'w-60' : 'w-0 lg:w-16'} overflow-hidden`}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-100 shrink-0">
          <div className="shrink-0 w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Car size={16} className="text-white" />
          </div>
          <div className={`transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 lg:hidden'} min-w-0`}>
            <p className="text-sm font-bold text-slate-800 truncate">Jaecoo 7 PHEV</p>
            <p className="text-[10px] text-slate-400 truncate">Control de consumo</p>
          </div>
          <button onClick={onClose} className="ml-auto lg:hidden shrink-0 p-1 text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-4 flex flex-col gap-1 px-2">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => { if (window.innerWidth < 1024) onClose() }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors group
                ${isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} className={`shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  <span className={`truncate transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 lg:hidden'}`}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className={`px-4 py-3 border-t border-slate-100 ${open ? '' : 'hidden lg:block'}`}>
          <p className={`text-[10px] text-slate-400 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 lg:hidden'}`}>
            v1.0.0
          </p>
        </div>
      </aside>
    </>
  )
}

export function MenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
      <Menu size={20} />
    </button>
  )
}
