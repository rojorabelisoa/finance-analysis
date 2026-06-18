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
            <span className="text-xs font-mono tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
              {quote.ticker}
            </span>
            <h2 className="text-slate-100 font-semibold text-lg mt-2">{quote.name || quote.ticker}</h2>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-slate-100 tabular-nums">
              {formatNumber(quote.price)} <span className="text-sm font-normal text-slate-500">{quote.currency}</span>
            </div>
            <div className={`inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-lg text-sm font-semibold border ${changeBg} ${changeBorder} ${changeColor}`}>
              <span>{arrow}</span>
              <span>{formatNumber(quote.change)}</span>
              <span>({formatNumber(quote.changePercent)} %)</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700/60">
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Volume</p>
            <p className="text-sm text-slate-300 font-medium">{quote.volume ? Number(quote.volume).toLocaleString('fr-FR') : 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Capitalisation</p>
            <p className="text-sm text-slate-300 font-medium">{formatMarketCap(quote.marketCap)}</p>
          </div>
        </div>
      </div>
    </Card>
  )
}
