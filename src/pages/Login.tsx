import { useState } from 'react'
import { Car, Zap, Fuel, BarChart3, Wrench, Shield, Loader2, Eye, EyeOff, ChevronRight, Gauge } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const FEATURES = [
  {
    icon: Zap,
    color: 'text-jaecoo-electric',
    bg: 'bg-jaecoo-electric-dim',
    title: 'Recargas eléctricas',
    desc: 'Registra cada carga, coste, kWh y estación.',
  },
  {
    icon: Fuel,
    color: 'text-jaecoo-fuel',
    bg: 'bg-jaecoo-fuel-dim',
    title: 'Repostajes',
    desc: 'Control preciso de litros, precio y consumo.',
  },
  {
    icon: BarChart3,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    title: 'Estadísticas',
    desc: 'Analiza tu consumo real y ahorro energético.',
  },
  {
    icon: Wrench,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    title: 'Taller e ITV',
    desc: 'Historial de revisiones y próximos servicios.',
  },
  {
    icon: Shield,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    title: 'Seguro',
    desc: 'Datos de tu póliza siempre a mano.',
  },
  {
    icon: Gauge,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    title: 'Neumáticos',
    desc: 'Controla el estado y vida útil de tus ruedas.',
  },
]

export default function Login() {
  const { login, register } = useAuth()
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [plate, setPlate] = useState('')
  const [password, setPassword] = useState('')
  const [model, setModel] = useState<'Jaecoo 7 PHEV' | 'Jaecoo 7 Gasolina'>('Jaecoo 7 PHEV')
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
    <div className="min-h-screen bg-jaecoo-base flex flex-col lg:flex-row">

      {/* ── LEFT: Landing / Marketing ── */}
      <div className="relative flex flex-col justify-between lg:flex-1 px-8 py-10 lg:px-16 lg:py-14 overflow-hidden">

        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-jaecoo-electric/8 blur-[100px]" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-blue-500/6 blur-[120px]" />
        </div>

        <div className="relative">
          {/* Brand */}
          <div className="flex items-center gap-3 mb-12 lg:mb-16">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-jaecoo-electric rounded-xl shadow-j-electric">
              <Car size={20} className="text-jaecoo-base" />
            </div>
            <div>
              <p className="font-bold text-jaecoo-primary text-sm leading-none">Control Consumo</p>
              <p className="text-jaecoo-electric/80 text-xs flex items-center gap-1 mt-0.5">
                <Zap size={10} /> PHEV · Híbrido enchufable
              </p>
            </div>
          </div>

          {/* Hero */}
          <div className="max-w-lg mb-10 lg:mb-14">
            <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-jaecoo-primary leading-tight mb-4">
              Tu vehículo,{' '}
              <span className="text-jaecoo-electric">bajo control</span>
            </h1>
            <p className="text-jaecoo-secondary text-base lg:text-lg leading-relaxed">
              Seguimiento completo del consumo, costes y mantenimiento de tu Jaecoo 7 PHEV.
              Gratuito, sin anuncios y con tus datos protegidos.
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {FEATURES.map(({ icon: Icon, color, bg, title, desc }) => (
              <div
                key={title}
                className="flex items-start gap-3 bg-jaecoo-card/60 border border-jaecoo-border rounded-2xl p-4 backdrop-blur-sm"
              >
                <div className={`${bg} rounded-xl p-2 shrink-0 mt-0.5`}>
                  <Icon size={16} className={color} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-jaecoo-primary mb-0.5">{title}</p>
                  <p className="text-xs text-jaecoo-muted leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative mt-10 lg:mt-0">
          <p className="text-xs text-jaecoo-muted flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-jaecoo-electric/60" />
            Datos exclusivos por matrícula · Sin publicidad · Hecho con ♥
          </p>
        </div>
      </div>

      {/* ── RIGHT: Login / Register form ── */}
      <div className="flex items-center justify-center px-6 py-10 lg:py-14 lg:w-[440px] xl:w-[480px] lg:border-l border-jaecoo-border">
        <div className="w-full max-w-sm">

          {/* Heading */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-jaecoo-primary">
              {tab === 'login' ? 'Bienvenido de nuevo' : 'Crear cuenta'}
            </h2>
            <p className="text-sm text-jaecoo-muted mt-1">
              {tab === 'login'
                ? 'Accede con tu matrícula y contraseña'
                : 'Registra tu vehículo para empezar'}
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
                    <select
                      value={model}
                      onChange={e => {
                        const v = e.target.value as 'Jaecoo 7 PHEV' | 'Jaecoo 7 Gasolina'
                        setModel(v)
                        if (v === 'Jaecoo 7 Gasolina') setInitialBattery('0')
                        else setInitialBattery('100')
                      }}
                      className={inp}
                    >
                      <option value="Jaecoo 7 PHEV">Jaecoo 7 PHEV</option>
                      <option value="Jaecoo 7 Gasolina">Jaecoo 7 Gasolina</option>
                    </select>
                  </div>

                  <div className="bg-jaecoo-elevated rounded-xl border border-jaecoo-border p-4 space-y-3">
                    <p className="text-xs font-semibold text-jaecoo-muted uppercase tracking-wide">
                      Estado inicial del vehículo
                    </p>
                    <p className="text-xs text-jaecoo-muted -mt-1">
                      Recomendamos registrar con depósito lleno para mayor precisión.
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
                    <div className={model === 'Jaecoo 7 Gasolina' ? 'block' : 'grid grid-cols-2 gap-3'}>
                      {model === 'Jaecoo 7 PHEV' && (
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
                      )}
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
                {loading
                  ? <Loader2 size={16} className="animate-spin" />
                  : <ChevronRight size={16} />}
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

    </div>
  )
}
