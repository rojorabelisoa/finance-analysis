import React from 'react'
import Card from '../../../shared/components/Card'

function formatNumber(value, decimals = 2) {
  if (value === null || value === undefined) return 'N/A'
  return Number(value).toLocaleString('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

function formatMarketCap(value) {
  if (value === null || value === undefined) return 'N/A'
  if (value >= 1e12) return (value / 1e12).toFixed(2) + ' B€'
  if (value >= 1e9) return (value / 1e9).toFixed(2) + ' Md'
  if (value >= 1e6) return (value / 1e6).toFixed(2) + ' M'
  return String(value)
}

export default function QuoteCard({ quote }) {
  if (!quote) return null

  const changePositive = quote.change >= 0
  const changeColor = changePositive ? 'text-emerald-400' : 'text-red-400'
  const changeBg = changePositive ? 'bg-emerald-500/10' : 'bg-red-500/10'
  const changeBorder = changePositive ? 'border-emerald-500/20' : 'border-red-500/20'
  const arrow = changePositive ? '▲' : '▼'

  return (
    <Card>
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
              {quote.ticker}
            </span>
            <h2 className="text-gray-100 font-semibold text-lg mt-2">{quote.name || quote.ticker}</h2>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-100">
              {formatNumber(quote.price)} <span className="text-sm font-normal text-gray-500">{quote.currency}</span>
            </div>
            <div className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-sm font-medium border ${changeBg} ${changeBorder} ${changeColor}`}>
              <span>{arrow}</span>
              <span>{formatNumber(quote.change)}</span>
              <span>({formatNumber(quote.changePercent)} %)</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-700">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Volume</p>
            <p className="text-sm text-gray-300">{quote.volume ? Number(quote.volume).toLocaleString('fr-FR') : 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Capitalisation</p>
            <p className="text-sm text-gray-300">{formatMarketCap(quote.marketCap)}</p>
          </div>
        </div>
      </div>
    </Card>
  )
}
