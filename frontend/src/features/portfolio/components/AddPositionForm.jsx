import React, { useState } from 'react'
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

export default function AddPositionForm({ onSubmit, onCancel }) {
  const [step, setStep] = useState(1)
  const [query, setQuery] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')

  async function handleSearch(e) {
    e.preventDefault()
    if (!query.trim()) return
    setSearchLoading(true)
    setSearchError('')
    try {
      let ticker = query.trim().toUpperCase()
      const isIsin = /^[A-Z]{2}[A-Z0-9]{10}$/.test(ticker)
      if (isIsin) {
        const results = await marketService.searchTicker(query.trim())
        if (results && results.length > 0) {
          ticker = results[0].ticker || results[0].symbol || ticker
        }
      }
      const fundamentals = await marketService.getFundamentals(ticker)
      setForm({
        ticker: ticker,
        name: fundamentals.name || '',
        type: fundamentals.type || 'stock',
        market: fundamentals.market || 'US',
        sector: fundamentals.sector || '',
        shares: '',
        avgPrice: '',
        currency: fundamentals.currency || 'USD',
        buyDate: '',
      })
      setStep(2)
    } catch {
      setSearchError('Titre introuvable. Vérifiez le ticker ou l\'ISIN.')
    } finally {
      setSearchLoading(false)
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
        buyDate: form.buyDate,
      })
    } catch (err) {
      setSubmitError(err.message || 'Erreur lors de l\'ajout.')
    } finally {
      setSubmitLoading(false)
    }
  }

  const inputClass =
    'bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 text-sm placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors w-full'
  const labelClass = 'text-xs text-gray-400 mb-1 block'

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
      <h3 className="text-gray-100 font-semibold mb-5">Ajouter une position</h3>

      {step === 1 && (
        <form onSubmit={handleSearch} className="flex flex-col gap-4">
          {searchError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
              {searchError}
            </div>
          )}
          <div>
            <label className={labelClass}>Ticker ou ISIN</label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ex: AAPL ou US0378331005"
              className={inputClass}
              required
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={searchLoading}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors"
            >
              {searchLoading ? 'Recherche...' : 'Rechercher'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-200 text-sm px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {submitError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
              {submitError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Ticker</label>
              <input
                name="ticker"
                value={form.ticker}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Nom</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Type</label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="stock">Action</option>
                <option value="etf">ETF</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Marché</label>
              <select
                name="market"
                value={form.market}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="US">US</option>
                <option value="EU">EU</option>
                <option value="WORLD">WORLD</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Secteur</label>
              <input
                name="sector"
                value={form.sector}
                onChange={handleChange}
                placeholder="ex: Technologie"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Devise</label>
              <select
                name="currency"
                value={form.currency}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="CHF">CHF</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Nombre d'actions</label>
              <input
                type="number"
                name="shares"
                value={form.shares}
                onChange={handleChange}
                placeholder="ex: 10"
                min="0.0001"
                step="any"
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Prix moyen d'achat</label>
              <input
                type="number"
                name="avgPrice"
                value={form.avgPrice}
                onChange={handleChange}
                placeholder="ex: 150.50"
                min="0"
                step="any"
                className={inputClass}
                required
              />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Date d'achat</label>
              <input
                type="date"
                name="buyDate"
                value={form.buyDate}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>
          <div className="flex gap-3 mt-2">
            <button
              type="submit"
              disabled={submitLoading}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors"
            >
              {submitLoading ? 'Ajout...' : 'Ajouter la position'}
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-gray-400 hover:text-gray-200 text-sm px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Retour
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-200 text-sm px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
