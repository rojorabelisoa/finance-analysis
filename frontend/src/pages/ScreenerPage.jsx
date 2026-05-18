import React, { useState } from 'react'
import screenerService from '../features/screener/services/screenerService'
import Card from '../shared/components/Card'

function fmt(v, decimals = 2) {
  if (v == null) return '—'
  return v.toFixed(decimals)
}

function fmtPct(v) {
  if (v == null) return '—'
  const pct = (v * 100).toFixed(1)
  return <span className={v >= 0 ? 'text-emerald-400' : 'text-red-400'}>{v >= 0 ? '+' : ''}{pct}%</span>
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
        <h1 className="text-2xl font-bold text-gray-100">Screener S&P 500</h1>
      </div>

      <Card>
        <p className="text-xs text-gray-500 mb-4">Premier chargement ~10-15s (données mises en cache 5 min)</p>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="text-xs text-gray-400 block mb-1">P/E max</label>
            <input
              type="number"
              value={filters.peMax}
              onChange={(e) => setFilters((f) => ({ ...f, peMax: e.target.value }))}
              placeholder="ex: 25"
              className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 text-sm w-28 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Croiss. CA min (%)</label>
            <input
              type="number"
              value={filters.revenueGrowthMin}
              onChange={(e) => setFilters((f) => ({ ...f, revenueGrowthMin: e.target.value }))}
              placeholder="ex: 5"
              className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 text-sm w-32 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Croiss. BPA min (%)</label>
            <input
              type="number"
              value={filters.epsGrowthMin}
              onChange={(e) => setFilters((f) => ({ ...f, epsGrowthMin: e.target.value }))}
              placeholder="ex: 5"
              className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 text-sm w-32 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            onClick={() => handleFilter(0)}
            disabled={loading}
            className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium rounded-lg px-5 py-2 text-sm transition-colors"
          >
            {loading ? 'Chargement...' : 'Filtrer'}
          </button>
        </div>
      </Card>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      {results && (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-400">{results.totalElements} résultat{results.totalElements > 1 ? 's' : ''}</p>
            <div className="flex gap-2 items-center">
              <button
                onClick={() => handleFilter(page - 1)}
                disabled={page === 0 || loading}
                className="text-xs bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-gray-200 rounded px-3 py-1"
              >Précédent</button>
              <span className="text-xs text-gray-500">Page {page + 1} / {Math.max(1, results.totalPages)}</span>
              <button
                onClick={() => handleFilter(page + 1)}
                disabled={page >= results.totalPages - 1 || loading}
                className="text-xs bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-gray-200 rounded px-3 py-1"
              >Suivant</button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-700">
                  <th className="pb-2 pr-4">Ticker</th>
                  <th className="pb-2 pr-4">Nom</th>
                  <th className="pb-2 pr-4 text-right">Prix</th>
                  <th className="pb-2 pr-4 text-right">P/E</th>
                  <th className="pb-2 pr-4 text-right">Croiss. CA</th>
                  <th className="pb-2 pr-4 text-right">Croiss. BPA</th>
                  <th className="pb-2 text-right">Market Cap</th>
                </tr>
              </thead>
              <tbody>
                {results.content.map((r) => (
                  <tr key={r.ticker} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-2 pr-4 font-mono text-emerald-400 font-semibold">{r.ticker}</td>
                    <td className="py-2 pr-4 text-gray-300 truncate max-w-[180px]">{r.name || '—'}</td>
                    <td className="py-2 pr-4 text-right text-gray-200">{r.price != null ? `${fmt(r.price)} ${r.currency || ''}` : '—'}</td>
                    <td className="py-2 pr-4 text-right text-gray-200">{fmt(r.peRatio)}</td>
                    <td className="py-2 pr-4 text-right">{fmtPct(r.revenueGrowth)}</td>
                    <td className="py-2 pr-4 text-right">{fmtPct(r.epsGrowth)}</td>
                    <td className="py-2 text-right text-gray-400">{fmtCap(r.marketCap)}</td>
                  </tr>
                ))}
                {results.content.length === 0 && (
                  <tr><td colSpan={7} className="py-8 text-center text-gray-500">Aucun résultat pour ces critères.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
