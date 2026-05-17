import React from 'react'
import Card from '../../../shared/components/Card'

function fmt(value, suffix = '') {
  if (value === null || value === undefined || value === '') return 'N/A'
  return `${value}${suffix}`
}

function fmtPct(value) {
  if (value === null || value === undefined || value === '') return 'N/A'
  const num = parseFloat(value)
  if (isNaN(num)) return 'N/A'
  const color = num >= 0 ? 'text-emerald-400' : 'text-red-400'
  return <span className={color}>{num >= 0 ? '+' : ''}{num.toFixed(2)} %</span>
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
          <MetricRow label="P/E (TTM)" value={fmt(fundamentals.pe)} />
          <MetricRow label="Forward P/E" value={fmt(fundamentals.forwardPe)} />
          <MetricRow label="PEG" value={fmt(fundamentals.peg)} />
          <MetricRow label="EPS (TTM)" value={fmt(fundamentals.eps)} />
          <MetricRow label="Croissance EPS" value={fmtPct(fundamentals.epsGrowth)} />
        </div>
        <div>
          <MetricRow label="Croissance CA" value={fmtPct(fundamentals.revenueGrowth)} />
          <MetricRow label="Dividende" value={fmt(fundamentals.dividendYield, ' %')} />
          <MetricRow label="Plus haut 52 semaines" value={fmt(fundamentals.high52w)} />
          <MetricRow label="Plus bas 52 semaines" value={fmt(fundamentals.low52w)} />
          <MetricRow label="Secteur" value={fmt(fundamentals.sector)} />
        </div>
      </div>
    </Card>
  )
}
