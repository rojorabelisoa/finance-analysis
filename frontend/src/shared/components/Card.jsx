import React from 'react'

export default function Card({ children, className = '' }) {
  return (
    <div className={`bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/60 shadow-glass ${className}`}>
      {children}
    </div>
  )
}
