import { useState } from 'react'
import { Car, Zap, Loader2, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, register } = useAuth()
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [plate, setPlate] = useState('')
  const [password, setPassword] = useState('')
  const [model, setModel] = useState('Jaecoo 7 PHEV')
  const [initialOdometer, setInitialOdometer] = useState('')
  const [initialBattery, setInitialBattery] = useState('100')
  const [initialFuel, setInitialFuel] = useState('60')
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
        await register(
          plate,
          password,
          model,
          parseInt(initialOdometer || '0', 10),
          parseInt(initialBattery || '100', 10),
          parseFloat(initialFuel || '60'),
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const inp = `w-full rounded-xl border border-jaecoo-border bg-jaecoo-elevated px-4 py-3 text-sm text-jaecoo-primary
    focus:outline-none focus:border-jaecoo-electric focus:ring-2 focus:ring-jaecoo-electric/20
    transition-all placeholder:text-jaecoo-muted`

  return (
    <div className="min-h-screen bg-jaecoo-base flex items-center justify-center p-4">
      {/* Subtle radial glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-jaecoo-electric/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-jaecoo-electric rounded-2xl mb-4 shadow-j-electric">
            <Car size={32} className="text-jaecoo-base" />
          </div>
          <h1 className="text-2xl font-bold text-jaecoo-primary">Control Consumo</h1>
          <p className="text-jaecoo-electric/80 text-sm mt-1 flex items-center justify-center gap-1">
            <Zap size={13} /> PHEV · Híbrido enchufable
          </p>
        </div>

        {/* Card */}
        <div className="bg-jaecoo-card border border-jaecoo-border-strong rounded-2xl shadow-j-elevated overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-jaecoo-border">
            {(['login', 'register'] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError('') }}
                className={`flex-1 py-3.5 text-sm font-semibold transition-colors
                  ${tab === t
                    ? 'text-jaecoo-electric border-b-2 border-jaecoo-electric'
                    : 'text-jaecoo-muted hover:text-jaecoo-secondary'}`}
              >
                {t === 'login' ? 'Entrar' : 'Registrarse'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Plate */}
            <div>
              <label className="block text-xs font-semibold text-jaecoo-muted uppercase tracking-wide mb-1.5">
                Matrícula
              </label>
              <input
                type="text"
                placeholder="1234-BCD"
                value={plate}
                onChange={e => setPlate(e.target.value.toUpperCase().replace(/\s/g, ''))}
                maxLength={10}
                className={`${inp} font-mono font-bold tracking-widest uppercase`}
                autoComplete="username"
                autoFocus
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-jaecoo-muted uppercase tracking-wide mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Mínimo 4 caracteres"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className={`${inp} pr-11`}
                  autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3.5 top-3.5 text-jaecoo-muted hover:text-jaecoo-secondary transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Register-only fields */}
            {tab === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-jaecoo-muted uppercase tracking-wide mb-1.5">
                    Modelo del vehículo
                  </label>
                  <input
                    type="text"
                    placeholder="Jaecoo 7 PHEV"
                    value={model}
                    onChange={e => setModel(e.target.value)}
                    className={inp}
                  />
                </div>

                <div className="bg-jaecoo-elevated rounded-xl border border-jaecoo-border p-4 space-y-3">
                  <p className="text-xs font-semibold text-jaecoo-muted uppercase tracking-wide">
                    Estado inicial del vehículo
                  </p>
                  <p className="text-xs text-jaecoo-muted/70 -mt-1">
                    Se recomienda registrar con batería al 100% y depósito lleno para mayor precisión.
                  </p>

                  <div>
                    <label className="block text-xs font-medium text-jaecoo-muted mb-1">
                      Kilómetros totales actuales
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 12500"
                      value={initialOdometer}
                      onChange={e => setInitialOdometer(e.target.value)}
                      className={inp}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-jaecoo-muted mb-1">
                        Batería actual (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="100"
                        value={initialBattery}
                        onChange={e => setInitialBattery(e.target.value)}
                        className={inp}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-jaecoo-muted mb-1">
                        Combustible (litros)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="60"
                        step="0.5"
                        placeholder="43"
                        value={initialFuel}
                        onChange={e => setInitialFuel(e.target.value)}
                        className={inp}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Error */}
            {error && (
              <div className="bg-jaecoo-danger/10 border border-jaecoo-danger/30 rounded-xl px-4 py-3 text-sm text-jaecoo-danger">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-jaecoo-electric hover:brightness-110 disabled:opacity-50 text-jaecoo-base font-bold rounded-xl py-3 text-sm transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {tab === 'login' ? 'Entrar' : 'Crear cuenta'}
            </button>

            {tab === 'register' && (
              <p className="text-xs text-jaecoo-muted text-center">
                La matrícula es tu identificador único. Cada vehículo tiene sus datos aislados.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
