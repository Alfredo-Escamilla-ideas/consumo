import { useState } from 'react'
import { Eye, EyeOff, Github, CheckCircle2, AlertCircle, Loader2, ExternalLink, Info } from 'lucide-react'
import { useData } from '../context/DataContext'
import { githubValidateToken } from '../services/github'

export default function Settings() {
  const { token, setToken, lastSynced } = useData()
  const [inputToken, setInputToken] = useState(token)
  const [showToken, setShowToken] = useState(false)
  const [validating, setValidating] = useState(false)
  const [validResult, setValidResult] = useState<'ok' | 'error' | null>(null)
  const [saved, setSaved] = useState(false)

  const handleValidate = async () => {
    if (!inputToken) return
    setValidating(true)
    setValidResult(null)
    const ok = await githubValidateToken(inputToken)
    setValidResult(ok ? 'ok' : 'error')
    setValidating(false)
  }

  const handleSave = () => {
    setToken(inputToken)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="max-w-xl space-y-6">
      {/* GitHub Token */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-slate-800 text-white rounded-xl p-2">
            <Github size={18} />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800 text-sm">Token de GitHub</h2>
            <p className="text-xs text-slate-500">Para sincronizar datos con el repositorio</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <input
              type={showToken ? 'text' : 'password'}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={inputToken}
              onChange={e => { setInputToken(e.target.value); setValidResult(null) }}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm pr-10 focus:outline-none focus:border-blue-400 font-mono"
            />
            <button
              type="button"
              onClick={() => setShowToken(v => !v)}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {validResult === 'ok' && (
            <p className="flex items-center gap-1.5 text-xs text-emerald-600">
              <CheckCircle2 size={13} /> Token válido · acceso al repositorio confirmado
            </p>
          )}
          {validResult === 'error' && (
            <p className="flex items-center gap-1.5 text-xs text-red-500">
              <AlertCircle size={13} /> Token inválido o sin acceso al repositorio
            </p>
          )}
          {lastSynced && token && (
            <p className="text-xs text-slate-400">
              Última sincronización: {lastSynced.toLocaleString('es-ES')}
            </p>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleValidate}
              disabled={!inputToken || validating}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {validating ? <Loader2 size={12} className="animate-spin" /> : null}
              Verificar
            </button>
            <button
              onClick={handleSave}
              disabled={!inputToken}
              className="px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {saved ? <><CheckCircle2 size={12} /> Guardado</> : 'Guardar token'}
            </button>
          </div>
        </div>
      </div>

      {/* How to get a token */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Info size={15} className="text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-700">Cómo obtener un token</h3>
        </div>
        <ol className="space-y-2 text-xs text-slate-600">
          <li className="flex gap-2"><span className="shrink-0 font-bold text-slate-400">1.</span> Ve a GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)</li>
          <li className="flex gap-2"><span className="shrink-0 font-bold text-slate-400">2.</span> Pulsa <strong>Generate new token (classic)</strong></li>
          <li className="flex gap-2"><span className="shrink-0 font-bold text-slate-400">3.</span> Dale un nombre descriptivo (ej: «Consumo PHEV»)</li>
          <li className="flex gap-2"><span className="shrink-0 font-bold text-slate-400">4.</span> Selecciona el scope <code className="bg-slate-200 px-1 rounded">repo</code> (acceso completo a repositorios)</li>
          <li className="flex gap-2"><span className="shrink-0 font-bold text-slate-400">5.</span> Pulsa <strong>Generate token</strong> y cópialo aquí</li>
        </ol>
        <a
          href="https://github.com/settings/tokens/new?description=Consumo+PHEV&scopes=repo"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 mt-3 text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          Crear token en GitHub <ExternalLink size={11} />
        </a>
      </div>

      {/* Repo info */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Repositorio de datos</h3>
        <div className="space-y-2 text-xs text-slate-600">
          <div className="flex justify-between">
            <span className="text-slate-500">Repositorio</span>
            <code className="bg-slate-100 px-1.5 py-0.5 rounded">Alfredo-Escamilla-ideas/consumo</code>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Archivo de datos</span>
            <code className="bg-slate-100 px-1.5 py-0.5 rounded">data/consumo.json</code>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Vehículo</span>
            <span className="font-medium">Jaecoo 7 PHEV</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Capacidad batería</span>
            <span className="font-medium">18,3 kWh</span>
          </div>
        </div>

        <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg">
          <p className="text-xs text-amber-700">
            <strong>Nota de privacidad:</strong> Los datos se guardan en tu repositorio de GitHub.
            Si el repositorio es público, los datos serán visibles para cualquiera.
            Considera hacerlo privado si quieres mantener la privacidad.
          </p>
        </div>
      </div>
    </div>
  )
}
