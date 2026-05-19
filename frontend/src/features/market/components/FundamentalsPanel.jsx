import React from 'react'
import Card from '../../../shared/components/Card'

function fmt(value, decimals = 2) {
  if (value === null || value === undefined || value === '') return 'N/A'
  return Number(value).toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function fmtPct(value) {
  if (value === null || value === undefined || value === '') return 'N/A'
  const num = parseFloat(value) * 100
  if (isNaN(num)) return 'N/A'
  const color = num >= 0 ? 'text-emerald-400' : 'text-red-400'
  return <span className={color}>{num >= 0 ? '+' : ''}{num.toFixed(2)} %</span>
}

function fmtDividend(value) {
  if (value === null || value === undefined) return 'N/A'
  return (parseFloat(value) * 100).toFixed(2) + ' %'
}

function MetricRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-700 last:border-0">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-sm text-gray-100 font-medium">{value}</span>
    </div>
  )
}

export default function FundamentalsPanel({ fundamentals }) {
  if (!fundamentals) return null

  return (
    <Card>
      <h3 className="text-gray-100 font-semibold mb-4">Fondamentaux</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
        <div>
          <MetricRow label="P/E (TTM)" value={fmt(fundamentals.peRatio)} />
          <MetricRow label="Forward P/E" value={fmt(fundamentals.forwardPe)} />
          <MetricRow label="PEG" value={fmt(fundamentals.pegRatio)} />
          <MetricRow label="EPS (TTM)" value={fmt(fundamentals.eps)} />
          <MetricRow label="Croissance EPS" value={fmtPct(fundamentals.epsGrowth)} />
        </div>
        <div>
          <MetricRow label="Croissance CA" value={fmtPct(fundamentals.revenueGrowth)} />
          <MetricRow label="Dividende" value={fmtDividend(fundamentals.dividendYield)} />
          <MetricRow label="Plus haut 52 semaines" value={fmt(fundamentals.week52High)} />
          <MetricRow label="Plus bas 52 semaines" value={fmt(fundamentals.week52Low)} />
          <MetricRow label="Secteur" value={fundamentals.sector || 'N/A'} />
        </div>
      </div>
    </Card>
  )
}
