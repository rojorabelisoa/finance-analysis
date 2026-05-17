import React from 'react'
import Badge from '../../../shared/components/Badge'

function toEur(price, currency, fxRates) {
  if (!price || isNaN(price)) return null
  if (currency === 'EUR') return price
  const rate = fxRates?.[currency]
  if (!rate) return null
  return price / rate
}

function formatEur(value) {
  if (value === null || value === undefined || isNaN(value)) return '—'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
}

function formatPct(value) {
  if (value === null || value === undefined || isNaN(value)) return '—'
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)} %`
}

const typeColor = { stock: 'blue', etf: 'purple' }
const marketColor = { US: 'blue', EU: 'green', WORLD: 'orange' }

export default function PositionTable({ positions, quotes, fxRates, onDelete }) {
  if (!positions || positions.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        Aucune position. Ajoutez votre première position.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-700">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-800 border-b border-gray-700 text-gray-400 text-xs uppercase tracking-wide">
            <th className="text-left px-4 py-3 font-medium">Ticker</th>
            <th className="text-left px-4 py-3 font-medium">Nom</th>
            <th className="text-left px-4 py-3 font-medium">Type</th>
            <th className="text-left px-4 py-3 font-medium">Marché</th>
            <th className="text-right px-4 py-3 font-medium">Actions</th>
            <th className="text-right px-4 py-3 font-medium">Prix achat</th>
            <th className="text-right px-4 py-3 font-medium">Valeur (EUR)</th>
            <th className="text-right px-4 py-3 font-medium">P&amp;L (€)</th>
            <th className="text-right px-4 py-3 font-medium">P&amp;L (%)</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {positions.map((pos) => {
            const quote = quotes?.[pos.ticker]
            const currentPriceNative = quote?.price ?? null
            const currentPriceEur = toEur(currentPriceNative, pos.currency, fxRates)
            const avgPriceEur = toEur(pos.avgPrice, pos.currency, fxRates)

            const currentValueEur = currentPriceEur !== null ? currentPriceEur * pos.shares : null
            const costEur = avgPriceEur !== null ? avgPriceEur * pos.shares : null
            const plEur = currentValueEur !== null && costEur !== null ? currentValueEur - costEur : null
            const plPct = plEur !== null && costEur ? (plEur / costEur) * 100 : null

            const plColor = plEur === null ? '' : plEur >= 0 ? 'text-emerald-400' : 'text-red-400'

            return (
              <tr key={pos.id} className="border-b border-gray-700/50 hover:bg-gray-800/50 transition-colors">
                <td className="px-4 py-3">
                  <span className="font-mono font-semibold text-emerald-400">{pos.ticker}</span>
                </td>
                <td className="px-4 py-3 text-gray-300 max-w-[160px] truncate">{pos.name || '—'}</td>
                <td className="px-4 py-3">
                  <Badge color={typeColor[pos.type] || 'gray'}>{pos.type?.toUpperCase()}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge color={marketColor[pos.market] || 'gray'}>{pos.market}</Badge>
                </td>
                <td className="px-4 py-3 text-right text-gray-300">{pos.shares}</td>
                <td className="px-4 py-3 text-right text-gray-300">
                  {pos.avgPrice} <span className="text-gray-500 text-xs">{pos.currency}</span>
                </td>
                <td className="px-4 py-3 text-right text-gray-300">{formatEur(currentValueEur)}</td>
                <td className={`px-4 py-3 text-right font-medium ${plColor}`}>{formatEur(plEur)}</td>
                <td className={`px-4 py-3 text-right font-medium ${plColor}`}>{formatPct(plPct)}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => onDelete(pos.id)}
                    className="text-gray-600 hover:text-red-400 transition-colors text-xs px-2 py-1 rounded hover:bg-red-500/10"
                    title="Supprimer"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
