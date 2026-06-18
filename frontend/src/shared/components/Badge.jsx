import React from 'react'

const colorMap = {
  green: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
  red: 'bg-red-500/15 text-red-400 border border-red-500/25',
  blue: 'bg-blue-500/15 text-blue-400 border border-blue-500/25',
  gray: 'bg-slate-500/15 text-slate-400 border border-slate-500/25',
  orange: 'bg-orange-500/15 text-orange-400 border border-orange-500/25',
  purple: 'bg-purple-500/15 text-purple-400 border border-purple-500/25',
}

export default function Badge({ color = 'gray', children }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorMap[color] || colorMap.gray}`}>
      {children}
    </span>
  )
}
