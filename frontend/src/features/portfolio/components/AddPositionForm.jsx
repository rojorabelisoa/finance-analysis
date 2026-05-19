import React, { useState, useEffect, useRef } from 'react'
import marketService from '../../market/services/marketService'

const EMPTY_FORM = {
  ticker: '',
  name: '',
  type: 'stock',
  market: 'US',
  sector: '',
  shares: '',
  avgPrice: '',
  currency: 'USD',
  buyDate: '',
}

const inputCls = 'bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-sm placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all w-full'
const labelCls = 'text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block'

export default function AddPositionForm({ onSubmit, onCancel }) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [description, setDescription] = useState('')
  const [descExpanded, setDescExpanded] = useState(false)
  const [fundamentalsLoading, setFundamentalsLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const debounceRef = useRef(null)
  const wrapperRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.trim().length < 2) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      setSuggestionsLoading(true)
      try {
        const results = await marketService.searchTicker(query.trim().toUpperCase())
        setSuggestions(Array.isArray(results) ? results : [])
        setShowDropdown(true)
      } catch {
        setSuggestions([])
      } finally {
        setSuggestionsLoading(false)
      }
    }, 400)
    return () => clearTimeout(debounceRef.current)
  }, [query])

  async function selectSuggestion(suggestion) {
    setShowDropdown(false)
    setQuery(suggestion.symbol)
    setFundamentalsLoading(true)
    setDescription('')
    try {
      const f = await marketService.getFundamentals(suggestion.symbol)
      setForm((prev) => ({
        ...prev,
        ticker: suggestion.symbol,
        name: f.name || suggestion.name || '',
        type: f.type || suggestion.type || 'stock',
        market: f.market || 'US',
        sector: f.sector || '',
        currency: f.currency || 'USD',
      }))
      setDescription(f.description || '')
    } catch {
      setForm((prev) => ({
        ...prev,
        ticker: suggestion.symbol,
        name: suggestion.name || '',
        type: suggestion.type || 'stock',
      }))
    } finally {
      setFundamentalsLoading(false)
    }
  }

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitError('')
    setSubmitLoading(true)
    try {
      await onSubmit({
        ticker: form.ticker,
        name: form.name,
        type: form.type,
        market: form.market,
        sector: form.sector,
        shares: parseFloat(form.shares),
        avgPrice: parseFloat(form.avgPrice),
        currency: form.currency,
        buyDate: form.buyDate || null,
      })
    } catch (err) {
      setSubmitError(err.message || "Erreur lors de l'ajout.")
    } finally {
      setSubmitLoading(false)
    }
  }

  const canSubmit = form.ticker && form.name && form.shares && form.avgPrice && !submitLoading && !fundamentalsLoading

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-700/60 p-6 shadow-glass">
      <h3 className="text-slate-100 font-semibold mb-5">Ajouter une position</h3>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div ref={wrapperRef} className="relative">
          <label className={labelCls}>Rechercher (ticker, ISIN ou nom)</label>
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
              placeholder="ex: AAPL, IWDA.AS, Apple, FR0000131104"
              className={inputCls}
              autoComplete="off"
            />
            {suggestionsLoading && (
              <div className="absolute right-3 top-2.5 text-slate-500 text-xs">...</div>
            )}
          </div>

          {showDropdown && suggestions.length > 0 && (
            <div className="absolute z-20 mt-1 w-full bg-slate-900 border border-slate-700/60 rounded-xl shadow-glass overflow-hidden">
              {suggestions.map((s) => (
                <button
                  key={s.symbol}
                  type="button"
                  onClick={() => selectSuggestion(s)}
                  className="w-full px-4 py-2.5 text-left hover:bg-slate-800 transition-colors flex items-center justify-between gap-3"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-emerald-400 font-mono text-xs font-semibold tracking-wider">{s.symbol}</span>
                    <span className="text-slate-300 text-sm truncate">{s.name}</span>
                  </span>
                  <span className="text-slate-600 text-xs shrink-0">{s.exchange}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {fundamentalsLoading && (
          <p className="text-slate-500 text-sm">Chargement des données...</p>
        )}

        {form.ticker && !fundamentalsLoading && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Ticker</label>
                <input name="ticker" value={form.ticker} onChange={handleChange} className={inputCls} required />
              </div>
              <div>
                <label className={labelCls}>Nom</label>
                <input name="name" value={form.name} onChange={handleChange} className={inputCls} required />
              </div>
              <div>
                <label className={labelCls}>Type</label>
                <select name="type" value={form.type} onChange={handleChange} className={inputCls}>
                  <option value="stock">Action</option>
                  <option value="etf">ETF</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Marché</label>
                <select name="market" value={form.market} onChange={handleChange} className={inputCls}>
                  <option value="US">US</option>
                  <option value="EU">EU</option>
                  <option value="WORLD">WORLD</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Secteur</label>
                <input name="sector" value={form.sector} onChange={handleChange} placeholder="ex: Technologie" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Devise</label>
                <select name="currency" value={form.currency} onChange={handleChange} className={inputCls}>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CHF">CHF</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Nombre d'actions</label>
                <input type="number" name="shares" value={form.shares} onChange={handleChange} placeholder="ex: 10" min="0.0001" step="any" className={inputCls} required />
              </div>
              <div>
                <label className={labelCls}>Prix moyen d'achat</label>
                <input type="number" name="avgPrice" value={form.avgPrice} onChange={handleChange} placeholder="ex: 150.50" min="0" step="any" className={inputCls} required />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Date d'achat</label>
                <input type="date" name="buyDate" value={form.buyDate} onChange={handleChange} className={inputCls} />
              </div>
            </div>

            {description && (
              <div className="bg-slate-900/60 rounded-xl px-4 py-3 border border-slate-700/40">
                <p className={`text-slate-400 text-xs leading-relaxed ${!descExpanded ? 'line-clamp-3' : ''}`}>
                  {description}
                </p>
                {description.length > 200 && (
                  <button type="button" onClick={() => setDescExpanded((v) => !v)} className="text-emerald-500 text-xs mt-1 hover:underline">
                    {descExpanded ? 'Réduire' : 'Voir plus'}
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {submitError && (
          <div className="bg-red-500/10 border border-red-500/25 text-red-400 text-sm rounded-xl px-4 py-3">
            {submitError}
          </div>
        )}

        <div className="flex gap-3 mt-1">
          <button
            type="submit"
            disabled={!canSubmit}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl px-4 py-2 text-sm transition-all duration-200"
          >
            {submitLoading ? 'Ajout...' : 'Ajouter la position'}
          </button>
          <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-200 text-sm px-4 py-2 rounded-xl hover:bg-slate-700/50 transition-colors">
            Annuler
          </button>
        </div>
      </form>
    </div>
  )
}
