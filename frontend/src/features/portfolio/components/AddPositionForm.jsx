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

const inputCls = 'bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 text-sm placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors w-full'
const labelCls = 'text-xs text-gray-400 mb-1 block'

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

  // Fermer le dropdown si clic en dehors
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Debounced search
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
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
      <h3 className="text-gray-100 font-semibold mb-5">Ajouter une position</h3>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Champ de recherche avec autocomplete */}
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
              <div className="absolute right-3 top-2.5 text-gray-500 text-xs">...</div>
            )}
          </div>

          {/* Dropdown suggestions */}
          {showDropdown && suggestions.length > 0 && (
            <div className="absolute z-20 mt-1 w-full bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
              {suggestions.map((s) => (
                <button
                  key={s.symbol}
                  type="button"
                  onClick={() => selectSuggestion(s)}
                  className="w-full px-4 py-2.5 text-left hover:bg-gray-700 transition-colors flex items-center justify-between gap-3"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-emerald-400 font-mono text-sm font-semibold">{s.symbol}</span>
                    <span className="text-gray-300 text-sm truncate">{s.name}</span>
                  </span>
                  <span className="text-gray-600 text-xs shrink-0">{s.exchange}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Spinner fundamentals */}
        {fundamentalsLoading && (
          <p className="text-gray-500 text-sm">Chargement des données...</p>
        )}

        {/* Champs auto-remplis — visibles dès qu'on a un ticker */}
        {form.ticker && !fundamentalsLoading && (
          <>
            <div className="grid grid-cols-2 gap-4">
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
              <div className="col-span-2">
                <label className={labelCls}>Date d'achat</label>
                <input type="date" name="buyDate" value={form.buyDate} onChange={handleChange} className={inputCls} />
              </div>
            </div>

            {/* Description entreprise */}
            {description && (
              <div className="bg-gray-900 rounded-lg px-4 py-3 border border-gray-700">
                <p className={`text-gray-400 text-xs leading-relaxed ${!descExpanded ? 'line-clamp-3' : ''}`}>
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
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
            {submitError}
          </div>
        )}

        <div className="flex gap-3 mt-1">
          <button
            type="submit"
            disabled={!canSubmit}
            className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors"
          >
            {submitLoading ? 'Ajout...' : 'Ajouter la position'}
          </button>
          <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-200 text-sm px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
            Annuler
          </button>
        </div>
      </form>
    </div>
  )
}
