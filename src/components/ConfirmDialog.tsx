import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({ message, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-jaecoo-card border border-jaecoo-border-strong rounded-2xl shadow-j-elevated w-full max-w-sm p-6 animate-fade-in">
        <div className="flex gap-4">
          <div className="shrink-0 bg-jaecoo-danger/10 text-jaecoo-danger rounded-xl p-2.5">
            <AlertTriangle size={22} />
          </div>
          <div>
            <h3 className="font-semibold text-jaecoo-primary">Confirmar eliminación</h3>
            <p className="text-sm text-jaecoo-secondary mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 mt-6 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-jaecoo-secondary bg-jaecoo-elevated hover:bg-jaecoo-border-strong rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-jaecoo-danger/90 hover:bg-jaecoo-danger rounded-xl transition-colors"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}
