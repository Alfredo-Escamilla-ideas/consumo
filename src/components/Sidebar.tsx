import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Zap, Fuel, BarChart3, Settings,
  Menu, X, Car, Disc3, ShieldCheck, Wrench,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

const links = [
  { to: '/',              icon: LayoutDashboard, label: 'Panel'         },
  { to: '/recargas',      icon: Zap,             label: 'Recargas'      },
  { to: '/repostajes',    icon: Fuel,            label: 'Repostajes'    },
  { to: '/estadisticas',  icon: BarChart3,        label: 'Estadísticas'  },
  { to: '/neumaticos',    icon: Disc3,            label: 'Neumáticos'    },
  { to: '/taller',        icon: Wrench,           label: 'Taller'        },
  { to: '/seguro',        icon: ShieldCheck,      label: 'Seguro'        },
  { to: '/configuracion', icon: Settings,         label: 'Configuración' },
]

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { vehicleModel } = useAuth()
  const isGasOnly = vehicleModel === 'Jaecoo 7 Gasolina'
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-30 flex flex-col
          bg-jaecoo-surface border-r border-jaecoo-border
          transition-all duration-300
          ${open ? 'w-60' : 'w-0 lg:w-16'}
          overflow-hidden
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-jaecoo-border shrink-0">
          {/* Icono del coche con glow eléctrico */}
          <div className="shrink-0 w-8 h-8 bg-jaecoo-electric rounded-lg flex items-center justify-center shadow-j-electric">
            <Car size={16} className="text-jaecoo-base" />
          </div>
          <div className={`transition-opacity duration-200 min-w-0 ${open ? 'opacity-100' : 'opacity-0 lg:hidden'}`}>
            <p className="text-sm font-bold text-jaecoo-primary truncate">Jaecoo 7 PHEV</p>
            <p className="text-[10px] text-jaecoo-muted truncate">Control de consumo</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar menú"
            className="ml-auto lg:hidden shrink-0 p-1 text-jaecoo-muted hover:text-jaecoo-secondary transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-4 flex flex-col gap-1 px-2 overflow-y-auto scrollbar-hide">
          {links.map(({ to, icon: Icon, label }) => {
            const disabled = to === '/recargas' && isGasOnly
            if (disabled) {
              return (
                <div
                  key={to}
                  title={open ? 'No disponible en Jaecoo 7 Gasolina' : label}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium opacity-30 cursor-not-allowed select-none"
                >
                  <Icon size={18} className="shrink-0 text-jaecoo-muted" />
                  <span className={`truncate transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 lg:hidden'}`}>
                    {label}
                  </span>
                </div>
              )
            }
            return (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                title={!open ? label : undefined}
                onClick={() => { if (window.innerWidth < 1024) onClose() }}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-150 group
                  ${isActive
                    ? 'bg-jaecoo-electric-dim text-jaecoo-electric'
                    : 'text-jaecoo-secondary hover:bg-jaecoo-elevated hover:text-jaecoo-primary'}
                `}
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={18}
                      className={`shrink-0 transition-colors ${
                        isActive
                          ? 'text-jaecoo-electric'
                          : 'text-jaecoo-muted group-hover:text-jaecoo-secondary'
                      }`}
                    />
                    <span className={`truncate transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 lg:hidden'}`}>
                      {label}
                    </span>
                    {isActive && (
                      <span className={`ml-auto w-1.5 h-1.5 rounded-full bg-jaecoo-electric shrink-0 ${open ? '' : 'hidden'}`} />
                    )}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Footer */}
        <div className={`px-4 py-3 border-t border-jaecoo-border ${open ? '' : 'hidden lg:block'}`}>
          <p className={`text-[10px] text-jaecoo-muted transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 lg:hidden'}`}>
            v2.0.0
          </p>
        </div>
      </aside>
    </>
  )
}

export function MenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Abrir menú"
      className="p-2 rounded-lg text-jaecoo-muted hover:bg-jaecoo-elevated hover:text-jaecoo-secondary transition-colors"
    >
      <Menu size={20} />
    </button>
  )
}
