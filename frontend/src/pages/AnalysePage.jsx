import React, { useState } from 'react'
import marketService from '../features/market/services/marketService'
import QuoteCard from '../features/market/components/QuoteCard'
import FundamentalsPanel from '../features/market/components/FundamentalsPanel'
import TechnicalChart from '../features/market/components/TechnicalChart'
import TradeSetupPanel from '../features/market/components/TradeSetupPanel'
import Card from '../shared/components/Card'

export default function AnalysePage() {
  const [query, setQuery] = useState('')
  const [quote, setQuote] = useState(null)
  const [fundamentals, setFundamentals] = useState(null)
  const [technical, setTechnical] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSearch(e) {
    e.preventDefault()
    const raw = query.trim().toUpperCase()
    if (!raw) return
    setError('')
    setLoading(true)
    setQuote(null)
    setFundamentals(null)
    setTechnical(null)
    try {
      let resolvedTicker = raw
      const isIsin = /^[A-Z]{2}[A-Z0-9]{10}$/.test(raw)
      if (isIsin) {
        const results = await marketService.searchTicker(raw)
        if (results && results.length > 0) {
          resolvedTicker = results[0].ticker || results[0].symbol || raw
        }
      }
      const [quoteData, fundamentalsData, technicalData] = await Promise.all([
        marketService.getQuote(resolvedTicker),
        marketService.getFundamentals(resolvedTicker),
        marketService.getTechnical(resolvedTicker).catch(() => null),
      ])
      setQuote(quoteData)
      setFundamentals(fundamentalsData)
      setTechnical(technicalData)
    } catch {
      setError("Titre introuvable. Vérifiez le ticker ou l'ISIN.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-slate-100">Analyse</h1>

      <Card>
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ticker ou ISIN — ex: AAPL, MSFT, FR0010315770"
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl px-5 py-2.5 text-sm transition-all duration-200 whitespace-nowrap"
          >
            {loading ? 'Recherche...' : 'Analyser'}
          </button>
        </form>
      </Card>

      {error && (
        <div className="bg-red-500/10 border border-red-500/25 text-red-400 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {quote && <QuoteCard quote={quote} />}

      {technical && technical.candles && technical.candles.length > 0 && (
        <Card>
          <h3 className="text-slate-100 font-semibold mb-1">Analyse technique — action sur les prix</h3>
          <p className="text-xs text-slate-500 mb-4">
            Support/résistance, order blocks, fair value gaps et points d'entrée détectés automatiquement.
          </p>
          <TechnicalChart analysis={technical} />
          <div className="mt-5">
            <TradeSetupPanel analysis={technical} />
          </div>
        </Card>
      )}

      {fundamentals && <FundamentalsPanel fundamentals={fundamentals} />}

      {fundamentals?.description && (
        <Card>
          <h3 className="text-slate-100 font-semibold mb-3">À propos</h3>
          <p className="text-slate-400 text-sm leading-relaxed">{fundamentals.description}</p>
        </Card>
      )}

      {!quote && !loading && !error && (
        <div className="text-center py-16 text-slate-600 text-sm">
          Entrez un ticker ou un ISIN pour analyser un titre.
        </div>
      )}
    </div>
  )
}
