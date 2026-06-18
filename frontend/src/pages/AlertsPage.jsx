import React, { useEffect, useState } from 'react'
import alertService from '../features/alerts/services/alertService'
import Card from '../shared/components/Card'

const inputCls = 'bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all w-full'
const labelCls = 'text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5 block'

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ ticker: '', alertType: 'PE_THRESHOLD', threshold: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchAlerts() }, [])

  async function fetchAlerts() {
    try {
      const data = await alertService.getAlerts()
      setAlerts(data)
    } catch {
      setError('Impossible de charger les alertes.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const threshold = parseFloat(form.threshold)
    if (!form.ticker.trim()) {
      setError('Le ticker est requis.')
      return
    }
    if (isNaN(threshold) || threshold < 0) {
      setError('Le seuil P/E doit être un nombre positif.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const alert = await alertService.createAlert({
        ticker: form.ticker.trim().toUpperCase(),
        alertType: form.alertType,
        threshold,
      })
      setAlerts((prev) => [alert, ...prev])
      setForm({ ticker: '', alertType: 'PE_THRESHOLD', threshold: '' })
    } catch {
      setError("Erreur lors de la création de l'alerte.")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    try {
      await alertService.deleteAlert(id)
      setAlerts((prev) => prev.filter((a) => a.id !== id))
    } catch {
      setError('Erreur lors de la suppression.')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-slate-100">Alertes</h1>

      <Card>
        <h2 className="text-slate-200 font-semibold mb-2">Nouvelle alerte</h2>
        <p className="text-xs text-slate-500 mb-5">
          Reçois un email quand le P/E d'un titre descend sous ton seuil. L'alerte se déclenche une seule fois et se désactive ensuite.
        </p>
        {error && (
          <div className="bg-red-500/10 border border-red-500/25 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[120px]">
            <label className={labelCls}>Ticker</label>
            <input
              value={form.ticker}
              onChange={(e) => setForm((f) => ({ ...f, ticker: e.target.value }))}
              placeholder="ex: AAPL"
              className={inputCls}
              required
            />
          </div>
          <div className="w-48">
            <label className={labelCls}>Type</label>
            <select value={form.alertType} onChange={(e) => setForm((f) => ({ ...f, alertType: e.target.value }))} className={inputCls}>
              <option value="PE_THRESHOLD">P/E en dessous de</option>
            </select>
          </div>
          <div className="w-36">
            <label className={labelCls}>Seuil P/E</label>
            <input
              type="number"
              value={form.threshold}
              onChange={(e) => setForm((f) => ({ ...f, threshold: e.target.value }))}
              placeholder="ex: 20"
              min="0"
              step="0.1"
              className={inputCls}
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-semibold rounded-xl px-5 py-2 text-sm transition-all duration-200"
          >
            {submitting ? 'Création...' : "Créer l'alerte"}
          </button>
        </form>
      </Card>

      <Card>
        <h2 className="text-slate-200 font-semibold mb-4">Mes alertes</h2>
        {loading ? (
          <p className="text-slate-500 text-sm">Chargement...</p>
        ) : alerts.length === 0 ? (
          <p className="text-slate-500 text-sm">Aucune alerte configurée.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {alerts.map((a) => (
              <div
                key={a.id}
                className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                  a.active
                    ? 'border-slate-700/60 bg-slate-900/40'
                    : 'border-slate-700/30 bg-slate-900/20 opacity-60'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="font-mono text-emerald-400 font-semibold text-sm tracking-wider">{a.ticker}</span>
                  <span className="text-slate-400 text-sm">P/E &lt; {a.threshold}</span>
                  {!a.active && (
                    <span className="text-xs bg-amber-500/15 text-amber-400 border border-amber-500/25 rounded-lg px-2 py-0.5">
                      Déclenchée {a.triggeredAt ? new Date(a.triggeredAt).toLocaleDateString('fr-FR') : ''}
                    </span>
                  )}
                  {a.active && (
                    <span className="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 rounded-lg px-2 py-0.5">Active</span>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(a.id)}
                  className="text-slate-600 hover:text-red-400 transition-colors text-sm px-2 py-1 rounded-lg hover:bg-red-500/10"
                >
                  Supprimer
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
