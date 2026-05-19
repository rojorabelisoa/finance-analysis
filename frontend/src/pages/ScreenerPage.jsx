import React, { useState } from 'react'
import screenerService from '../features/screener/services/screenerService'
import Card from '../shared/components/Card'

const inputCls = 'bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-sm w-full focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all'

function fmt(v, decimals = 2) {
  if (v == null) return '—'
  return v.toFixed(decimals)
}

function fmtPct(v) {
  if (v == null) return '—'
  const pct = (v * 100).toFixed(1)
  return <span className={v >= 0 ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>{v >= 0 ? '+' : ''}{pct}%</span>
}

function fmtCap(v) {
  if (v == null) return '—'
  if (v >= 1e12) return `${(v / 1e12).toFixed(1)} T$`
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)} Md$`
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)} M$`
  return `${v}`
}

export default function ScreenerPage() {
  const [filters, setFilters] = useState({ peMax: 25, revenueGrowthMin: '', epsGrowthMin: '' })
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(0)
  const SIZE = 20

  async function handleFilter(p = 0) {
    setLoading(true)
    setError('')
    try {
      const data = await screenerService.screen(filters, p, SIZE)
      setResults(data)
      setPage(p)
    } catch {
      setError('Erreur lors du chargement. Réessaie.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">Screener S&P 500</h1>
      </div>

      <Card>
        <p className="text-xs text-slate-500 mb-4">Premier chargement ~10-15s (données mises en cache 5 min)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1.5">P/E max</label>
            <input
              type="number"
              value={filters.peMax}
              onChange={(e) => setFilters((f) => ({ ...f, peMax: e.target.value }))}
              placeholder="ex: 25"
              className={inputCls}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1.5">Croiss. CA min (%)</label>
            <input
              type="number"
              value={filters.revenueGrowthMin}
              onChange={(e) => setFilters((f) => ({ ...f, revenueGrowthMin: e.target.value }))}
              placeholder="ex: 5"
              className={inputCls}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1.5">Croiss. BPA min (%)</label>
            <input
              type="number"
              value={filters.epsGrowthMin}
              onChange={(e) => setFilters((f) => ({ ...f, epsGrowthMin: e.target.value }))}
              placeholder="ex: 5"
              className={inputCls}
            />
          </div>
          <button
            onClick={() => handleFilter(0)}
            disabled={loading}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-semibold rounded-xl px-5 py-2 text-sm transition-all duration-200"
          >
            {loading ? 'Chargement...' : 'Filtrer'}
          </button>
        </div>
      </Card>

      {error && (
        <div className="bg-red-500/10 border border-red-500/25 text-red-400 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      {results && (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-slate-400">
              <span className="font-semibold text-slate-200">{results.totalElements}</span> résultat{results.totalElements > 1 ? 's' : ''}
            </p>
            <div className="flex gap-2 items-center">
              <button
                onClick={() => handleFilter(page - 1)}
                disabled={page === 0 || loading}
                className="text-xs bg-slate-700/60 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-lg px-3 py-1.5 transition-colors"
              >Précédent</button>
              <span className="text-xs text-slate-500">Page {page + 1} / {Math.max(1, results.totalPages)}</span>
              <button
                onClick={() => handleFilter(page + 1)}
                disabled={page >= results.totalPages - 1 || loading}
                className="text-xs bg-slate-700/60 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-lg px-3 py-1.5 transition-colors"
              >Suivant</button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 font-medium uppercase tracking-widest border-b border-slate-700/60">
                  <th className="pb-3 pr-4 whitespace-nowrap">Ticker</th>
                  <th className="pb-3 pr-4 whitespace-nowrap">Nom</th>
                  <th className="pb-3 pr-4 text-right whitespace-nowrap">Prix</th>
                  <th className="pb-3 pr-4 text-right whitespace-nowrap">P/E</th>
                  <th className="pb-3 pr-4 text-right whitespace-nowrap">Croiss. CA</th>
                  <th className="pb-3 pr-4 text-right whitespace-nowrap">Croiss. BPA</th>
                  <th className="pb-3 text-right whitespace-nowrap">Market Cap</th>
                </tr>
              </thead>
              <tbody>
                {results.content.map((r) => (
                  <tr key={r.ticker} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                    <td className="py-2.5 pr-4 font-mono text-emerald-400 font-semibold text-xs tracking-wider whitespace-nowrap">{r.ticker}</td>
                    <td className="py-2.5 pr-4 text-slate-300 truncate max-w-[180px]">{r.name || '—'}</td>
                    <td className="py-2.5 pr-4 text-right text-slate-200 whitespace-nowrap tabular-nums">{r.price != null ? `${fmt(r.price)} ${r.currency || ''}` : '—'}</td>
                    <td className="py-2.5 pr-4 text-right text-slate-200 whitespace-nowrap tabular-nums">{fmt(r.peRatio)}</td>
                    <td className="py-2.5 pr-4 text-right whitespace-nowrap tabular-nums">{fmtPct(r.revenueGrowth)}</td>
                    <td className="py-2.5 pr-4 text-right whitespace-nowrap tabular-nums">{fmtPct(r.epsGrowth)}</td>
                    <td className="py-2.5 text-right text-slate-400 whitespace-nowrap tabular-nums">{fmtCap(r.marketCap)}</td>
                  </tr>
                ))}
                {results.content.length === 0 && (
                  <tr><td colSpan={7} className="py-8 text-center text-slate-500">Aucun résultat pour ces critères.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
