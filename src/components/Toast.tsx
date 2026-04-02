import { useEffect } from 'react'
import { CheckCircle2, XCircle, X } from 'lucide-react'

export interface ToastData {
  id: string
  message: string
  type: 'success' | 'error'
}

interface ToastProps {
  toast: ToastData
  onDismiss: (id: string) => void
}

export function Toast({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 3500)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  const isSuccess = toast.type === 'success'

  return (
    <div className={`
      flex items-center gap-3 px-4 py-3 rounded-xl shadow-j-elevated border
      text-sm font-medium max-w-xs w-full pointer-events-auto
      bg-jaecoo-card animate-fade-in
      ${isSuccess
        ? 'border-emerald-500/30 text-emerald-400'
        : 'border-jaecoo-danger/30 text-jaecoo-danger'}
    `}>
      {isSuccess
        ? <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
        : <XCircle size={16} className="shrink-0 text-jaecoo-danger" />
      }
      <span className="flex-1 text-jaecoo-primary">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Cerrar notificación"
        className="shrink-0 text-jaecoo-muted hover:text-jaecoo-secondary transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  )
}

interface ToastContainerProps {
  toasts: ToastData[]
  onDismiss: (id: string) => void
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed bottom-6 right-4 z-50 flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map(t => <Toast key={t.id} toast={t} onDismiss={onDismiss} />)}
    </div>
  )
}
