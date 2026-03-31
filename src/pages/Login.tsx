import { useState } from 'react'
import { Car, Zap, Loader2, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, register } = useAuth()
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [plate, setPlate] = useState('')
  const [password, setPassword] = useState('')
  const [model, setModel] = useState('Jaecoo 7 PHEV')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!plate.trim() || !password.trim()) {
      setError('Introduce matrícula y contraseña')
      return
    }
    setLoading(true)
    try {
      if (tab === 'login') {
        await login(plate, password)
      } else {
        await register(plate, password, model)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-600/30">
            <Car size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Control Consumo</h1>
          <p className="text-blue-300 text-sm mt-1 flex items-center justify-center gap-1">
            <Zap size={13} /> PHEV · Híbrido enchufable
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-100">
            {(['login', 'register'] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError('') }}
                className={`flex-1 py-3.5 text-sm font-semibold transition-colors
                  ${tab === t ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {t === 'login' ? 'Entrar' : 'Registrarse'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Plate */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Matrícula
              </label>
              <input
                type="text"
                placeholder="1234-BCD"
                value={plate}
                onChange={e => setPlate(e.target.value.toUpperCase().replace(/\s/g, ''))}
                maxLength={10}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-mono font-bold tracking-widest uppercase focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                autoComplete="username"
                autoFocus
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Mínimo 4 caracteres"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm pr-11 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                  autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Vehicle model (register only) */}
            {tab === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Modelo del vehículo
                </label>
                <input
                  type="text"
                  placeholder="Jaecoo 7 PHEV"
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl py-3 text-sm transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {tab === 'login' ? 'Entrar' : 'Crear cuenta'}
            </button>

            {tab === 'register' && (
              <p className="text-xs text-slate-400 text-center">
                La matrícula es tu identificador único. Cada vehículo tiene sus datos aislados.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
