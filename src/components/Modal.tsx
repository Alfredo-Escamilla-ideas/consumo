import { useEffect } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  title: string
  onClose: () => void
  children: React.ReactNode
  size?: 'md' | 'lg'
}

export default function Modal({ title, onClose, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Panel */}
      <div className={`
        relative bg-jaecoo-card border border-jaecoo-border-strong
        rounded-2xl shadow-j-elevated
        w-full ${size === 'lg' ? 'max-w-2xl' : 'max-w-lg'}
        max-h-[90vh] flex flex-col
        animate-fade-in
      `}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-jaecoo-border shrink-0">
          <h2 className="text-base font-semibold text-jaecoo-primary">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="p-2 rounded-lg text-jaecoo-muted hover:text-jaecoo-secondary hover:bg-jaecoo-elevated transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  )
}
