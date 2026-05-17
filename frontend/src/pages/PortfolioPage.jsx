import React, { useEffect, useState, useCallback } from 'react'
import { usePortfolio } from '../context/PortfolioContext'
import marketService from '../features/market/services/marketService'
import AddPositionForm from '../features/portfolio/components/AddPositionForm'
import PositionTable from '../features/portfolio/components/PositionTable'
import AllocationChart from '../features/portfolio/components/AllocationChart'
import Card from '../shared/components/Card'

function MetricCard({ label, value, sub, valueColor }) {
  return (
    <Card className="flex flex-col gap-1">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold ${valueColor || 'text-gray-100'}`}>{value}</p>
      {sub && <p className="text-sm text-gray-500">{sub}</p>}
    </Card>
  )
}

function formatEur(value) {
  if (value === null || value === undefined || isNaN(value)) return '—'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
}

function formatPct(value) {
  if (value === null || value === undefined || isNaN(value)) return '—'
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)} %`
}

const FX_PAIRS = { USD: 'EURUSD=X', GBP: 'EURGBP=X', CHF: 'EURCHF=X' }

export default function PortfolioPage() {
  const { positions, loading, error, fetchPositions, addPosition, removePosition } = usePortfolio()
  const [showForm, setShowForm] = useState(false)
  const [quotes, setQuotes] = useState({})
  const [fxRates, setFxRates] = useState({})
  const [quotesLoading, setQuotesLoading] = useState(false)

  useEffect(() => {
    fetchPositions()
  }, [])

  const fetchMarketData = useCallback(async (posList) => {
    if (!posList || posList.length === 0) return
    setQuotesLoading(true)
    try {
      const tickers = [...new Set(posList.map((p) => p.ticker))]
      const currencies = [...new Set(posList.map((p) => p.currency).filter((c) => c !== 'EUR'))]

      const [quotesResults, fxResults] = await Promise.allSettled([
        Promise.allSettled(tickers.map((t) => marketService.getQuote(t).then((q) => ({ ticker: t, data: q })))),
        Promise.allSettled(currencies.map((c) => marketService.getQuote(FX_PAIRS[c] || c).then((q) => ({ currency: c, data: q })))),
      ])

      if (quotesResults.status === 'fulfilled') {
        const q = {}
        quotesResults.value.forEach((r) => {
          if (r.status === 'fulfilled') q[r.value.ticker] = r.value.data
        })
        setQuotes(q)
      }

      if (fxResults.status === 'fulfilled') {
        const fx = {}
        fxResults.value.forEach((r) => {
          if (r.status === 'fulfilled') fx[r.value.currency] = r.value.data?.price || 1
        })
        setFxRates(fx)
      }
    } finally {
      setQuotesLoading(false)
    }
  }, [])

  useEffect(() => {
    if (positions.length > 0) fetchMarketData(positions)
  }, [positions, fetchMarketData])

  function toEur(price, currency) {
    if (!price || isNaN(price)) return null
    if (currency === 'EUR') return price
    const rate = fxRates[currency]
    if (!rate) return null
    return price / rate
  }

  const enriched = positions.map((pos) => {
    const quote = quotes[pos.ticker]
    const currentPriceEur = toEur(quote?.price, pos.currency)
    const avgPriceEur = toEur(pos.avgPrice, pos.currency)
    return {
      ...pos,
      valueEur: currentPriceEur !== null ? currentPriceEur * pos.shares : null,
      costEur: avgPriceEur !== null ? avgPriceEur * pos.shares : null,
    }
  })

  const totalValue = enriched.reduce((s, p) => (p.valueEur !== null ? s + p.valueEur : s), 0)
  const totalCost = enriched.reduce((s, p) => (p.costEur !== null ? s + p.costEur : s), 0)
  const totalPl = totalCost > 0 ? totalValue - totalCost : null
  const totalPlPct = totalCost > 0 && totalPl !== null ? (totalPl / totalCost) * 100 : null

  const plColor = totalPl === null ? 'text-gray-100' : totalPl >= 0 ? 'text-emerald-400' : 'text-red-400'

  async function handleAddPosition(data) {
    await addPosition(data)
    setShowForm(false)
  }

  async function handleDelete(id) {
    if (window.confirm('Supprimer cette position ?')) {
      await removePosition(id)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-100">Portefeuille</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchMarketData(positions)}
            disabled={quotesLoading || positions.length === 0}
            className="text-sm text-gray-400 hover:text-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {quotesLoading ? 'Chargement...' : 'Rafraîchir'}
          </button>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              + Ajouter une position
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Valeur totale"
          value={formatEur(totalValue)}
          valueColor="text-gray-100"
        />
        <MetricCard
          label="Coût total"
          value={formatEur(totalCost)}
          valueColor="text-gray-100"
        />
        <MetricCard
          label="P&L total"
          value={formatEur(totalPl)}
          sub={formatPct(totalPlPct)}
          valueColor={plColor}
        />
        <MetricCard
          label="Positions"
          value={positions.length}
          valueColor="text-gray-100"
        />
      </div>

      {showForm && (
        <AddPositionForm
          onSubmit={handleAddPosition}
          onCancel={() => setShowForm(false)}
        />
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500 text-sm">Chargement...</div>
      ) : (
        <PositionTable
          positions={positions}
          quotes={quotes}
          fxRates={fxRates}
          onDelete={handleDelete}
        />
      )}

      {enriched.length > 0 && (
        <AllocationChart positions={enriched} />
      )}
    </div>
  )
}
