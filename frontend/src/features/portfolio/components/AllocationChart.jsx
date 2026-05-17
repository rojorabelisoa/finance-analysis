import React from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import Card from '../../../shared/components/Card'

const TYPE_COLORS = {
  stock: '#34d399',
  etf: '#818cf8',
  other: '#fb923c',
}

const MARKET_COLORS = {
  US: '#38bdf8',
  EU: '#34d399',
  WORLD: '#c084fc',
  OTHER: '#fb923c',
}

const FALLBACK_COLORS = ['#34d399', '#818cf8', '#38bdf8', '#c084fc', '#fb923c', '#f472b6']

function buildData(positions, keyFn, colorMap) {
  const map = {}
  positions.forEach((pos) => {
    const key = keyFn(pos) || 'Autre'
    if (!map[key]) map[key] = 0
    map[key] += pos.valueEur || 0
  })
  return Object.entries(map).map(([name, value], i) => ({
    name,
    value: Math.round(value * 100) / 100,
    color: colorMap[name] || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
  }))
}

function formatEur(value) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null
  const entry = payload[0]
  const total = payload[0]?.payload?.total || 1
  const pct = ((entry.value / total) * 100).toFixed(1)
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm shadow-xl">
      <p className="text-gray-100 font-medium">{entry.name}</p>
      <p className="text-emerald-400">{formatEur(entry.value)}</p>
      <p className="text-gray-400">{pct} %</p>
    </div>
  )
}

function MiniPie({ data, title }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  const dataWithTotal = data.map((d) => ({ ...d, total }))

  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-sm font-medium text-gray-400 text-center">{title}</h4>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={dataWithTotal}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
            dataKey="value"
          >
            {dataWithTotal.map((entry, index) => (
              <Cell key={index} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => <span className="text-gray-400 text-xs">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function AllocationChart({ positions }) {
  if (!positions || positions.length === 0) return null

  const typeData = buildData(
    positions,
    (p) => {
      if (p.type === 'stock') return 'Action'
      if (p.type === 'etf') return 'ETF'
      return 'Autre'
    },
    { Action: TYPE_COLORS.stock, ETF: TYPE_COLORS.etf, Autre: TYPE_COLORS.other }
  )

  const marketData = buildData(
    positions,
    (p) => p.market || 'Autre',
    MARKET_COLORS
  )

  return (
    <Card>
      <h3 className="text-gray-100 font-semibold mb-6">Allocation</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <MiniPie data={typeData} title="Par type" />
        <MiniPie data={marketData} title="Par marché" />
      </div>
    </Card>
  )
}
