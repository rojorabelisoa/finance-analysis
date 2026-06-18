import React, { useMemo } from 'react'
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Customized,
} from 'recharts'

const BULL = '#10b981'
const BEAR = '#ef4444'

function fmt(v) {
  if (v === null || v === undefined) return '—'
  return Number(v).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function CandleTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null
  const c = payload[0].payload
  const up = c.close >= c.open
  return (
    <div className="bg-slate-900/95 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 shadow-xl">
      <div className="font-mono text-slate-400 mb-1">{c.date}</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
        <span className="text-slate-500">O</span><span className="tabular-nums">{fmt(c.open)}</span>
        <span className="text-slate-500">H</span><span className="tabular-nums">{fmt(c.high)}</span>
        <span className="text-slate-500">L</span><span className="tabular-nums">{fmt(c.low)}</span>
        <span className="text-slate-500">C</span>
        <span className={`tabular-nums font-semibold ${up ? 'text-emerald-400' : 'text-red-400'}`}>{fmt(c.close)}</span>
      </div>
    </div>
  )
}

export default function TechnicalChart({ analysis }) {
  const data = useMemo(
    () => (analysis?.candles || []).map((c, i) => ({ ...c, idx: i })),
    [analysis?.candles]
  )

  const timeToIdx = useMemo(() => {
    const m = new Map()
    data.forEach((c) => m.set(c.time, c.idx))
    return m
  }, [data])

  const yDomain = useMemo(() => {
    if (!data.length) return [0, 1]
    let min = Infinity
    let max = -Infinity
    for (const c of data) {
      if (c.low < min) min = c.low
      if (c.high > max) max = c.high
    }
    const pad = (max - min) * 0.06 || 1
    return [min - pad, max + pad]
  }, [data])

  if (!data.length) {
    return (
      <div className="text-center py-12 text-slate-600 text-sm">
        Pas de données historiques disponibles pour ce titre.
      </div>
    )
  }

  const n = data.length

  // Draws candles + every detected structure directly with the chart's scales.
  const renderOverlays = (props) => {
    const { xAxisMap, yAxisMap, offset } = props
    if (!xAxisMap || !yAxisMap || !offset) return null
    const xAxis = xAxisMap[Object.keys(xAxisMap)[0]]
    const yAxis = yAxisMap[Object.keys(yAxisMap)[0]]
    if (!xAxis?.scale || !yAxis?.scale) return null
    const xScale = xAxis.scale
    const yScale = yAxis.scale

    const left = offset.left
    const right = offset.left + offset.width
    const step = Math.abs(xScale(1) - xScale(0)) || 6
    const candleW = Math.max(1.5, step * 0.6)

    const elements = []

    // --- Order blocks (zones extending to the right edge) ---
    ;(analysis.orderBlocks || []).forEach((ob, i) => {
      const idx = timeToIdx.get(ob.time)
      if (idx === undefined || ob.top == null || ob.bottom == null) return
      const x0 = xScale(idx) - candleW / 2
      const yTop = yScale(ob.top)
      const yBot = yScale(ob.bottom)
      const bull = ob.direction === 'BULLISH'
      elements.push(
        <rect
          key={`ob-${i}`}
          x={x0}
          y={Math.min(yTop, yBot)}
          width={Math.max(0, right - x0)}
          height={Math.abs(yBot - yTop)}
          fill={bull ? 'rgba(16,185,129,0.10)' : 'rgba(239,68,68,0.10)'}
          stroke={bull ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'}
          strokeDasharray={ob.mitigated ? '2 3' : undefined}
          strokeWidth={1}
        />
      )
    })

    // --- Fair value gaps ---
    ;(analysis.fairValueGaps || []).forEach((fvg, i) => {
      if (fvg.filled || fvg.top == null || fvg.bottom == null) return
      const idx = timeToIdx.get(fvg.time)
      if (idx === undefined) return
      const x0 = xScale(idx) - candleW / 2
      const yTop = yScale(fvg.top)
      const yBot = yScale(fvg.bottom)
      const bull = fvg.direction === 'BULLISH'
      elements.push(
        <rect
          key={`fvg-${i}`}
          x={x0}
          y={Math.min(yTop, yBot)}
          width={Math.max(0, right - x0)}
          height={Math.abs(yBot - yTop)}
          fill={bull ? 'rgba(59,130,246,0.10)' : 'rgba(234,179,8,0.10)'}
        />
      )
    })

    // --- Support / resistance levels ---
    ;(analysis.levels || []).forEach((lvl, i) => {
      if (lvl.price == null) return
      const y = yScale(lvl.price)
      const color = lvl.type === 'SUPPORT' ? BULL : '#f59e0b'
      elements.push(
        <line
          key={`lvl-${i}`}
          x1={left}
          x2={right}
          y1={y}
          y2={y}
          stroke={color}
          strokeWidth={lvl.strength >= 0.6 ? 1.4 : 0.8}
          strokeOpacity={0.55}
        />
      )
      elements.push(
        <text key={`lvltxt-${i}`} x={left + 4} y={y - 3} fill={color} fontSize={9} opacity={0.8}>
          {lvl.type === 'SUPPORT' ? 'S' : 'R'} {fmt(lvl.price)}
        </text>
      )
    })

    // --- Trade setup lines (entry / SL / TP of the first setup) ---
    const setup = (analysis.setups || [])[0]
    if (setup) {
      const lines = [
        { p: setup.entry, c: '#3b82f6', label: `Entrée ${fmt(setup.entry)}` },
        { p: setup.stopLoss, c: BEAR, label: `SL ${fmt(setup.stopLoss)}`, dash: '4 3' },
        { p: setup.takeProfit, c: BULL, label: `TP ${fmt(setup.takeProfit)}`, dash: '4 3' },
      ]
      lines.forEach((ln, i) => {
        if (ln.p == null) return
        const y = yScale(ln.p)
        elements.push(
          <line key={`set-${i}`} x1={left} x2={right} y1={y} y2={y}
            stroke={ln.c} strokeWidth={1.2} strokeDasharray={ln.dash} strokeOpacity={0.9} />
        )
        elements.push(
          <text key={`settxt-${i}`} x={right - 4} y={y - 3} fill={ln.c} fontSize={9} textAnchor="end" fontWeight="600">
            {ln.label}
          </text>
        )
      })
    }

    // --- Candles (drawn last, on top of zones) ---
    for (const c of data) {
      const cx = xScale(c.idx)
      const up = c.close >= c.open
      const color = up ? BULL : BEAR
      const yHigh = yScale(c.high)
      const yLow = yScale(c.low)
      const yOpen = yScale(c.open)
      const yClose = yScale(c.close)
      const bodyTop = Math.min(yOpen, yClose)
      const bodyH = Math.max(1, Math.abs(yClose - yOpen))
      elements.push(
        <line key={`wick-${c.idx}`} x1={cx} x2={cx} y1={yHigh} y2={yLow} stroke={color} strokeWidth={1} />
      )
      elements.push(
        <rect key={`body-${c.idx}`} x={cx - candleW / 2} y={bodyTop} width={candleW} height={bodyH} fill={color} />
      )
    }

    return <g>{elements}</g>
  }

  const tickStep = Math.max(1, Math.floor(n / 8))
  const ticks = data.filter((_, i) => i % tickStep === 0).map((c) => c.idx)

  return (
    <div className="w-full" style={{ height: 420 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 12, bottom: 10, left: 4 }}>
          <XAxis
            type="number"
            dataKey="idx"
            domain={[-0.5, n - 0.5]}
            ticks={ticks}
            tickFormatter={(i) => (data[i] ? data[i].date?.slice(5) : '')}
            tick={{ fill: '#64748b', fontSize: 10 }}
            stroke="#334155"
          />
          <YAxis
            domain={yDomain}
            orientation="right"
            tick={{ fill: '#64748b', fontSize: 10 }}
            stroke="#334155"
            width={56}
            tickFormatter={(v) => fmt(v)}
          />
          <Tooltip content={<CandleTooltip />} />
          <Line dataKey="close" dot={false} stroke="transparent" isAnimationActive={false} />
          <Customized component={renderOverlays} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
