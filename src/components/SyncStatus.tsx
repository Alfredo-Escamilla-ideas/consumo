import { Car } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function SyncStatus() {
  const { plate } = useAuth()
  if (!plate) return null
  return (
    <div className="flex items-center gap-1.5 text-xs text-jaecoo-electric bg-jaecoo-electric-dim px-2.5 py-1.5 rounded-full border border-jaecoo-electric/20 font-semibold tracking-wide">
      <Car size={13} />
      <span>{plate}</span>
    </div>
  )
}
