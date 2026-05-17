import React from 'react'

const colorMap = {
  green: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  red: 'bg-red-500/20 text-red-400 border border-red-500/30',
  blue: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  gray: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
  orange: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  purple: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
}

export default function Badge({ color = 'gray', children }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorMap[color] || colorMap.gray}`}>
      {children}
    </span>
  )
}
