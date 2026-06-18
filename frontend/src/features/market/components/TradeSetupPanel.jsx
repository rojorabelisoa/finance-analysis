import React from 'react'

function fmt(v) {
  if (v === null || v === undefined) return '—'
  return Number(v).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const TREND_LABEL = {
  UPTREND: { text: 'Tendance haussière', cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25' },
  DOWNTREND: { text: 'Tendance baissière', cls: 'text-red-400 bg-red-500/10 border-red-500/25' },
  RANGE: { text: 'Range / consolidation', cls: 'text-amber-400 bg-amber-500/10 border-amber-500/25' },
  UNKNOWN: { text: 'Indéterminée', cls: 'text-slate-400 bg-slate-500/10 border-slate-500/25' },
}

const CONF_CLS = {
  ÉLEVÉE: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
  MOYENNE: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
  FAIBLE: 'text-slate-400 bg-slate-500/10 border-slate-500/25',
}

function SetupCard({ setup }) {
  const long = setup.direction === 'LONG'
  const wrap = long
    ? 'rounded-xl border p-4 bg-emerald-500/5 border-emerald-500/20'
    : 'rounded-xl border p-4 bg-red-500/5 border-red-500/20'
  return (
    <div className={wrap}>
      <div className="flex items-center justify-between mb-3">
        <span className={`text-sm font-bold ${long ? 'text-emerald-400' : 'text-red-400'}`}>
          {long ? '▲ LONG' : '▼ SHORT'}
        </span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${CONF_CLS[setup.confidence] || CONF_CLS.FAIBLE}`}>
          {setup.confidence}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center mb-3">
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">Entrée</p>
          <p className="text-sm font-semibold text-blue-400 tabular-nums">{fmt(setup.entry)}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">Stop</p>
          <p className="text-sm font-semibold text-red-400 tabular-nums">{fmt(setup.stopLoss)}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">Objectif</p>
          <p className="text-sm font-semibold text-emerald-400 tabular-nums">{fmt(setup.takeProfit)}</p>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500">Ratio R/R</span>
        <span className="font-mono font-semibold text-slate-200">{fmt(setup.riskReward)} : 1</span>
      </div>
      <p className="text-xs text-slate-400 mt-2 leading-relaxed">{setup.rationale}</p>
    </div>
  )
}

export default function TradeSetupPanel({ analysis }) {
  if (!analysis) return null
  const trend = TREND_LABEL[analysis.trend] || TREND_LABEL.UNKNOWN
  const setups = analysis.setups || []
  const obCount = (analysis.orderBlocks || []).filter((o) => !o.mitigated).length
  const fvgCount = (analysis.fairValueGaps || []).filter((f) => !f.filled).length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${trend.cls}`}>{trend.text}</span>
        <span className="text-xs text-slate-400 px-2.5 py-1 rounded-lg border border-slate-700/60 bg-slate-800/40">
          {(analysis.levels || []).length} niveaux S/R
        </span>
        <span className="text-xs text-slate-400 px-2.5 py-1 rounded-lg border border-slate-700/60 bg-slate-800/40">
          {obCount} order blocks actifs
        </span>
        <span className="text-xs text-slate-400 px-2.5 py-1 rounded-lg border border-slate-700/60 bg-slate-800/40">
          {fvgCount} FVG non comblés
        </span>
      </div>

      {setups.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {setups.map((s) => (
            <SetupCard key={`${s.direction}-${s.entry}`} setup={s} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">
          Aucun setup à ratio favorable détecté actuellement. Attendez une réaction du prix sur un niveau clé.
        </p>
      )}

      <p className="text-[11px] text-slate-600 leading-relaxed border-t border-slate-800 pt-3">
        Analyse algorithmique fournie à titre informatif uniquement — ce n'est pas un conseil en
        investissement. Les niveaux sont calculés automatiquement à partir de l'historique des prix
        et ne garantissent aucun résultat.
      </p>
    </div>
  )
}
