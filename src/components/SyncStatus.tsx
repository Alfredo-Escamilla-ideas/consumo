import { Car } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function SyncStatus() {
  const { plate, vehicleModel } = useAuth()
  if (!plate) return null
  return (
    <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-full border border-blue-200 font-semibold tracking-wide">
      <Car size={13} />
      <span>{plate}</span>
    </div>
  )
}
