import React, { useState, useEffect, useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from 'recharts'
import Card from '../shared/components/Card'
import api from '../shared/hooks/useApi'
import { usePortfolio } from '../context/PortfolioContext'

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmt(value) {
  if (value === null || value === undefined || isNaN(value)) return '—'
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function fmtPct(value) {
  if (value === null || value === undefined || isNaN(value)) return '—'
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)} %`
}

function formatDateFR(isoDate) {
  if (!isoDate) return '—'
  const [y, m, d] = isoDate.split('-')
  return `${d}/${m}/${y}`
}

function formatMonthYear(isoDate) {
  if (!isoDate) return ''
  const [y, m] = isoDate.split('-')
  return `${m}/${y.slice(2)}`
}

const inputCls =
  'bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all w-full'
const labelCls = 'text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block'

const TABS = [
  { id: 'historique', label: 'Graphique' },
  { id: 'dca', label: 'Simulateur DCA' },
  { id: 'allocation', label: 'Allocation cible' },
  { id: 'fiscal', label: 'Calendrier fiscal' },
]

const DONUT_COLORS = [
  '#10b981', '#6366f1', '#f59e0b', '#ef4444', '#3b82f6',
  '#8b5cf6', '#14b8a6', '#f97316', '#ec4899', '#84cc16',
]

// ─── Section 1: Portfolio History Chart ─────────────────────────────────────

function HistoriqueSection() {
  const { positions } = usePortfolio()
  const [history, setHistory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        const res = await api.get('/portfolio/history')
        setHistory(res.data)
      } catch {
        setError('Impossible de charger les données.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <p className="text-slate-500 text-sm py-8 text-center">Chargement...</p>
  if (error) return <div className="bg-red-500/10 border border-red-500/25 text-red-400 text-sm rounded-xl px-4 py-3">{error}</div>

  const snapshots = history?.snapshots || []
  const totalInvested = history?.totalInvested || 0
  const nbPositions = positions.length
  const currentValue = history?.totalCurrentValue ?? null

  const chartData = snapshots.map((s) => ({
    date: formatMonthYear(s.date),
    investi: s.invested,
  }))

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-slate-100 font-semibold text-lg">Évolution du portefeuille</h2>

      {chartData.length === 0 ? (
        <Card>
          <p className="text-slate-500 text-sm text-center py-6">
            Aucune donnée d'historique disponible.
          </p>
        </Card>
      ) : (
        <Card>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradInvesti" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k€`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 12 }}
                labelStyle={{ color: '#f1f5f9' }}
                formatter={(v) => [fmt(v), 'Investi']}
              />
              <Area
                type="stepAfter"
                dataKey="investi"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#gradInvesti)"
                name="Investi"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="flex flex-col gap-1 p-5">
          <p className={labelCls}>Total investi</p>
          <p className="text-lg font-bold text-slate-100">{fmt(totalInvested)}</p>
        </Card>
        <Card className="flex flex-col gap-1 p-5">
          <p className={labelCls}>Plus-value latente</p>
          {currentValue !== null ? (
            <>
              <p className={`text-lg font-bold ${currentValue - totalInvested >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {fmt(currentValue - totalInvested)}
              </p>
              <p className="text-xs text-slate-500">
                {fmtPct(totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : null)}
              </p>
            </>
          ) : (
            <p className="text-lg font-bold text-slate-500">—</p>
          )}
        </Card>
        <Card className="flex flex-col gap-1 p-5">
          <p className={labelCls}>Nombre de positions</p>
          <p className="text-lg font-bold text-slate-100">{nbPositions}</p>
        </Card>
      </div>
    </div>
  )
}

// ─── Section 2: DCA Simulator ────────────────────────────────────────────────

function DcaSection() {
  const [form, setForm] = useState({
    initialAmount: 0,
    monthly: 200,
    years: 20,
    rate: 7,
  })

  const data = useMemo(() => {
    const { initialAmount, monthly, years, rate } = form
    const r = rate / 100
    const result = []
    for (let n = 0; n <= years; n++) {
      const value =
        r === 0
          ? initialAmount + monthly * 12 * n
          : initialAmount * Math.pow(1 + r, n) +
            monthly * ((Math.pow(1 + r / 12, n * 12) - 1) / (r / 12))
      const invested = initialAmount + monthly * 12 * n
      result.push({ year: n, value: Math.round(value), invested: Math.round(invested) })
    }
    return result
  }, [form])

  const last = data[data.length - 1]
  const finalValue = last?.value ?? 0
  const totalInvested = last?.invested ?? 0
  const gain = finalValue - totalInvested

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-slate-100 font-semibold text-lg">Simulateur DCA</h2>

      <Card>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div>
            <label className={labelCls}>Montant initial (€)</label>
            <input
              type="number"
              min="0"
              step="100"
              value={form.initialAmount}
              onChange={(e) => setForm((f) => ({ ...f, initialAmount: parseFloat(e.target.value) || 0 }))}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Versement mensuel (€)</label>
            <input
              type="number"
              min="0"
              step="50"
              value={form.monthly}
              onChange={(e) => setForm((f) => ({ ...f, monthly: parseFloat(e.target.value) || 0 }))}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Durée (années)</label>
            <input
              type="number"
              min="1"
              max="50"
              step="1"
              value={form.years}
              onChange={(e) => setForm((f) => ({ ...f, years: parseInt(e.target.value) || 1 }))}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Rendement annuel (%)</label>
            <input
              type="number"
              min="0"
              max="30"
              step="0.5"
              value={form.rate}
              onChange={(e) => setForm((f) => ({ ...f, rate: parseFloat(e.target.value) || 0 }))}
              className={inputCls}
            />
          </div>
        </div>

        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradInvested" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="year"
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickFormatter={(v) => `${v}a`}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k€`}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 12 }}
              labelStyle={{ color: '#f1f5f9' }}
              labelFormatter={(v) => `Année ${v}`}
              formatter={(v, name) => [fmt(v), name === 'value' ? 'Valeur' : 'Investi']}
            />
            <Area
              type="monotone"
              dataKey="invested"
              stroke="#6366f1"
              strokeWidth={1.5}
              fill="url(#gradInvested)"
              name="invested"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#gradValue)"
              name="value"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="flex flex-col gap-1 p-5">
          <p className={labelCls}>Capital final</p>
          <p className="text-lg font-bold text-emerald-400">{fmt(finalValue)}</p>
        </Card>
        <Card className="flex flex-col gap-1 p-5">
          <p className={labelCls}>Total investi</p>
          <p className="text-lg font-bold text-slate-100">{fmt(totalInvested)}</p>
        </Card>
        <Card className="flex flex-col gap-1 p-5">
          <p className={labelCls}>Plus-value</p>
          <p className={`text-lg font-bold ${gain >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmt(gain)}</p>
          <p className="text-xs text-slate-500">
            {totalInvested > 0 ? `× ${(finalValue / totalInvested).toFixed(2)}` : ''}
          </p>
        </Card>
      </div>
    </div>
  )
}

// ─── Section 3: Target Allocation ────────────────────────────────────────────

const DEFAULT_TARGETS = [
  { label: 'MSCI World', ticker: 'IWDA.AS', targetPercent: 60 },
  { label: 'Nasdaq 100', ticker: 'PANX.PA', targetPercent: 20 },
  { label: 'Émergents', ticker: 'AEEM.PA', targetPercent: 20 },
]

function AllocationSection() {
  const { positions } = usePortfolio()
  const [targets, setTargets] = useState(DEFAULT_TARGETS)
  const [fxRates, setFxRates] = useState({})
  const [nextDeposit, setNextDeposit] = useState(200)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const settingsRes = await api.get('/settings')
        const data = settingsRes.data
        if (data.allocationTargetsJson) {
          try {
            setTargets(JSON.parse(data.allocationTargetsJson))
          } catch {
            // keep defaults
          }
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Fetch FX rates for non-EUR positions
  useEffect(() => {
    const currencies = [...new Set(positions.map((p) => p.currency).filter((c) => c && c !== 'EUR'))]
    if (currencies.length === 0) return

    Promise.allSettled(
      currencies.map((c) =>
        api.get(`/market/fx?from=${c}&to=EUR`).then((r) => ({ currency: c, rate: r.data }))
      )
    ).then((results) => {
      const rates = {}
      results.forEach((r) => {
        if (r.status === 'fulfilled') rates[r.value.currency] = r.value.rate
      })
      setFxRates(rates)
    })
  }, [positions])

  const totalTarget = targets.reduce((s, t) => s + (parseFloat(t.targetPercent) || 0), 0)
  const totalOk = Math.abs(totalTarget - 100) < 0.01

  function addTarget() {
    setTargets((prev) => [...prev, { label: '', ticker: '', targetPercent: 0 }])
  }

  function removeTarget(idx) {
    setTargets((prev) => prev.filter((_, i) => i !== idx))
  }

  function updateTarget(idx, field, value) {
    setTargets((prev) => prev.map((t, i) => (i === idx ? { ...t, [field]: value } : t)))
  }

  async function saveSettings() {
    if (!totalOk) {
      setSaveMsg('Le total doit être exactement 100 %.')
      return
    }
    setSaving(true)
    setSaveMsg('')
    try {
      await api.put('/settings', { allocationTargetsJson: JSON.stringify(targets) })
      setSaveMsg('Sauvegardé ✓')
      setTimeout(() => setSaveMsg(''), 2500)
    } catch {
      setSaveMsg('Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  // Compute actual allocation: cost basis converted to EUR
  function toEur(price, currency) {
    if (!price) return 0
    if (!currency || currency === 'EUR') return price
    const rate = fxRates[currency]
    return rate ? price / rate : price // fallback: treat as EUR if rate unknown
  }

  const actualByTicker = {}
  positions.forEach((p) => {
    const val = toEur(p.avgPrice * p.shares, p.currency)
    actualByTicker[p.ticker] = (actualByTicker[p.ticker] || 0) + val
  })
  const totalPositionValue = Object.values(actualByTicker).reduce((s, v) => s + v, 0)

  const comparisonData = targets.map((t) => {
    const actual = totalPositionValue > 0
      ? ((actualByTicker[t.ticker] || 0) / totalPositionValue) * 100
      : 0
    return {
      name: t.label || t.ticker,
      target: parseFloat(t.targetPercent) || 0,
      actual: Math.round(actual * 10) / 10,
    }
  })

  const suggestions = targets
    .map((t) => {
      const actualVal = actualByTicker[t.ticker] || 0
      const targetVal = ((parseFloat(t.targetPercent) || 0) / 100) * (totalPositionValue + nextDeposit)
      const diff = targetVal - actualVal
      return { label: t.label || t.ticker, ticker: t.ticker, amount: Math.round(diff) }
    })
    .filter((s) => s.amount > 0)

  const donutTarget = targets.map((t, i) => ({
    name: t.label || t.ticker,
    value: parseFloat(t.targetPercent) || 0,
    fill: DONUT_COLORS[i % DONUT_COLORS.length],
  }))

  const donutActual = comparisonData
    .filter((d) => d.actual > 0)
    .map((d, i) => ({
      name: d.name,
      value: d.actual,
      fill: DONUT_COLORS[i % DONUT_COLORS.length],
    }))

  if (loading) return <p className="text-slate-500 text-sm py-8 text-center">Chargement...</p>

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-slate-100 font-semibold text-lg">Allocation cible</h2>

      {/* Define targets */}
      <Card>
        <h3 className="text-slate-200 font-medium mb-4">Définir l'allocation cible</h3>
        <div className="flex flex-col gap-3 mb-4">
          {targets.map((t, idx) => (
            <div key={idx} className="flex gap-3 items-end">
              <div className="flex-1">
                {idx === 0 && <label className={labelCls}>Libellé</label>}
                <input
                  type="text"
                  value={t.label}
                  onChange={(e) => updateTarget(idx, 'label', e.target.value)}
                  placeholder="MSCI World"
                  className={inputCls}
                />
              </div>
              <div className="w-32">
                {idx === 0 && <label className={labelCls}>Ticker</label>}
                <input
                  type="text"
                  value={t.ticker}
                  onChange={(e) => updateTarget(idx, 'ticker', e.target.value.toUpperCase())}
                  placeholder="IWDA.AS"
                  className={inputCls}
                />
              </div>
              <div className="w-24">
                {idx === 0 && <label className={labelCls}>Cible %</label>}
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={t.targetPercent}
                  onChange={(e) => updateTarget(idx, 'targetPercent', parseFloat(e.target.value) || 0)}
                  className={inputCls}
                />
              </div>
              <button
                onClick={() => removeTarget(idx)}
                className="text-slate-600 hover:text-red-400 transition-colors text-sm px-2 py-2 rounded-lg hover:bg-red-500/10 mb-0.5"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <button
            onClick={addTarget}
            className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
          >
            + Ajouter un actif
          </button>
          <div className="flex items-center gap-4">
            {!totalOk && (
              <span className="text-xs text-amber-400">
                Total : {totalTarget.toFixed(1)} % (doit être 100 %)
              </span>
            )}
            {totalOk && (
              <span className="text-xs text-emerald-400">Total : 100 % ✓</span>
            )}
            <button
              onClick={saveSettings}
              disabled={saving}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-semibold rounded-xl px-4 py-2 text-sm transition-all duration-200"
            >
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
            {saveMsg && (
              <span className={`text-xs ${saveMsg.startsWith('Erreur') || saveMsg.startsWith('Le total') ? 'text-amber-400' : 'text-emerald-400'}`}>
                {saveMsg}
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Comparison charts */}
      <Card>
        <h3 className="text-slate-200 font-medium mb-1">Allocation actuelle vs cible</h3>
        <p className="text-xs text-slate-500 mb-4">Basé sur le coût d'achat en EUR</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-slate-400 text-center mb-2">Cible</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={donutTarget}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {donutTarget.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 12 }}
                  formatter={(v, name) => [`${v} %`, name]}
                />
                <Legend
                  formatter={(value) => <span style={{ color: '#64748b', fontSize: 12 }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div>
            <p className="text-xs text-slate-400 text-center mb-2">Actuelle</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={donutActual.length > 0 ? donutActual : [{ name: 'Vide', value: 1, fill: '#374151' }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {(donutActual.length > 0 ? donutActual : [{ fill: '#374151' }]).map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 12 }}
                  formatter={(v, name) => [`${v} %`, name]}
                />
                {donutActual.length > 0 && (
                  <Legend
                    formatter={(value) => <span style={{ color: '#64748b', fontSize: 12 }}>{value}</span>}
                  />
                )}
              </PieChart>
            </ResponsiveContainer>
            {donutActual.length === 0 && (
              <p className="text-xs text-slate-500 text-center -mt-2">Aucune position enregistrée</p>
            )}
          </div>
        </div>

        {comparisonData.length > 0 && (
          <div className="mt-4">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={comparisonData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 12 }}
                  formatter={(v, name) => [`${v} %`, name === 'target' ? 'Cible' : 'Actuelle']}
                />
                <Bar dataKey="target" fill="#6366f1" radius={[4, 4, 0, 0]} name="target" />
                <Bar dataKey="actual" fill="#10b981" radius={[4, 4, 0, 0]} name="actual" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Rebalancing suggestion */}
      <Card>
        <h3 className="text-slate-200 font-medium mb-4">Suggestion de rééquilibrage</h3>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-48">
            <label className={labelCls}>Prochain versement (€)</label>
            <input
              type="number"
              min="0"
              step="50"
              value={nextDeposit}
              onChange={(e) => setNextDeposit(parseFloat(e.target.value) || 0)}
              className={inputCls}
            />
          </div>
        </div>
        {suggestions.length === 0 ? (
          <p className="text-slate-500 text-sm">
            Portefeuille équilibré ou aucune position à comparer.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-slate-400 mb-1">
              Pour rééquilibrer avec {fmt(nextDeposit)}, achetez :
            </p>
            {suggestions.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-slate-900/60 rounded-xl px-4 py-2.5 border border-slate-700/60"
              >
                <span className="text-sm font-medium text-slate-100">
                  {s.label}
                  {s.ticker && s.ticker !== s.label && (
                    <span className="text-slate-500 ml-2 text-xs">{s.ticker}</span>
                  )}
                </span>
                <span className="text-emerald-400 font-semibold text-sm">+{fmt(s.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

// ─── Section 4: PEA Tax Calendar ─────────────────────────────────────────────

function FiscalSection() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [openingDate, setOpeningDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await api.get('/settings/pea')
      setData(res.data)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveDate(e) {
    e.preventDefault()
    if (!openingDate) return
    setSaving(true)
    setSaveError('')
    try {
      await api.put('/settings', { peaOpeningDate: openingDate })
      await load()
    } catch {
      setSaveError('Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-slate-500 text-sm py-8 text-center">Chargement...</p>

  if (!data || !data.openingDate) {
    return (
      <div className="flex flex-col gap-6">
        <h2 className="text-slate-100 font-semibold text-lg">Calendrier fiscal PEA</h2>
        <Card>
          <h3 className="text-slate-200 font-medium mb-2">Date d'ouverture du PEA</h3>
          <p className="text-sm text-slate-400 mb-4">
            Renseignez la date d'ouverture de votre PEA pour afficher les informations fiscales.
          </p>
          {saveError && (
            <div className="bg-red-500/10 border border-red-500/25 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">
              {saveError}
            </div>
          )}
          <form onSubmit={handleSaveDate} className="flex gap-3 items-end">
            <div>
              <label className={labelCls}>Date d'ouverture</label>
              <input
                type="date"
                value={openingDate}
                onChange={(e) => setOpeningDate(e.target.value)}
                className={inputCls + ' w-auto'}
                required
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-semibold rounded-xl px-4 py-2 text-sm transition-all duration-200"
            >
              {saving ? 'Sauvegarde...' : 'Enregistrer'}
            </button>
          </form>
        </Card>
      </div>
    )
  }

  const progressPct = Math.min((data.yearsOpen / 5) * 100, 100)
  const reached = data.hasReachedFiveYears

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-slate-100 font-semibold text-lg">Calendrier fiscal PEA</h2>

      <Card>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-slate-200">Progression vers 5 ans</p>
          <p className="text-sm text-slate-400">
            {data.yearsOpen?.toFixed(2)} / 5 ans
          </p>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
          <div
            className={`h-4 rounded-full transition-all duration-500 ${reached ? 'bg-emerald-500' : 'bg-indigo-500'}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        {reached && (
          <p className="text-xs text-emerald-400 mt-2 font-medium">Objectif 5 ans atteint — fiscalité allégée ✓</p>
        )}
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex flex-col gap-1 p-5">
          <p className={labelCls}>Date d'ouverture</p>
          <p className="text-base font-bold text-slate-100">{formatDateFR(data.openingDate)}</p>
        </Card>
        <Card className="flex flex-col gap-1 p-5">
          <p className={labelCls}>Objectif 5 ans</p>
          <p className="text-base font-bold text-slate-100">{formatDateFR(data.fiveYearDate)}</p>
          <p className={`text-xs mt-0.5 ${reached ? 'text-emerald-400' : 'text-slate-400'}`}>
            {reached ? 'Atteint ✓' : `dans ${data.daysToFiveYears} jours`}
          </p>
        </Card>
        <Card className="flex flex-col gap-1 p-5">
          <p className={labelCls}>Fiscalité actuelle</p>
          {reached ? (
            <>
              <p className="text-base font-bold text-emerald-400">17.2 %</p>
              <p className="text-xs text-slate-400">Prélèvements sociaux</p>
            </>
          ) : (
            <>
              <p className="text-base font-bold text-amber-400">30 %</p>
              <p className="text-xs text-slate-400">PFU (avant 5 ans)</p>
            </>
          )}
        </Card>
        <Card className="flex flex-col gap-1 p-5">
          <p className={labelCls}>Plafond restant</p>
          <p className="text-base font-bold text-slate-100">
            {data.maxContributionRemaining !== undefined ? fmt(data.maxContributionRemaining) : '—'}
          </p>
          <p className="text-xs text-slate-400">sur 150 000 €</p>
        </Card>
      </div>

      <Card>
        <h3 className="text-slate-200 font-medium mb-3">Règles fiscales du PEA</h3>
        <div className="flex flex-col gap-4">
          <div className="flex gap-3 items-start">
            <div className="w-2 h-2 rounded-full bg-red-400 mt-1.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-slate-200">Avant 5 ans</p>
              <p className="text-sm text-slate-400">
                Tout retrait entraîne la <strong className="text-slate-300">clôture du PEA</strong>. Les gains sont taxés à <strong className="text-slate-300">30 % (PFU)</strong> : 12.8 % d'impôt sur le revenu + 17.2 % de prélèvements sociaux.
              </p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-slate-200">Après 5 ans</p>
              <p className="text-sm text-slate-400">
                Les retraits partiels sont possibles <strong className="text-slate-300">sans clôture du PEA</strong>. Les gains ne sont taxés qu'à <strong className="text-slate-300">17.2 % (prélèvements sociaux uniquement)</strong>.
              </p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-slate-200">Plafond des versements</p>
              <p className="text-sm text-slate-400">
                Le PEA est plafonné à <strong className="text-slate-300">150 000 €</strong> de versements (hors plus-values). Ce plafond est personnel et ne se reconstitue pas après retrait.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

// ─── Main PeaPage ─────────────────────────────────────────────────────────────

export default function PeaPage() {
  const [activeTab, setActiveTab] = useState('historique')

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-slate-100">PEA</h1>

      <div className="flex gap-1 bg-slate-800/60 backdrop-blur-sm rounded-xl p-1 border border-slate-700/60 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-emerald-500 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'historique' && <HistoriqueSection />}
      {activeTab === 'dca' && <DcaSection />}
      {activeTab === 'allocation' && <AllocationSection />}
      {activeTab === 'fiscal' && <FiscalSection />}
    </div>
  )
}
