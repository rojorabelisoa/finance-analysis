import React from 'react'
import { useBackendHealth } from '../hooks/useBackendHealth'

const CONFIG = {
  checking: {
    dot: 'bg-slate-500 animate-pulse',
    label: null,
    title: 'Connexion au serveur...',
  },
  up: {
    dot: 'bg-emerald-500',
    label: null,
    title: 'Serveur opérationnel',
  },
  down: {
    dot: 'bg-red-500 animate-pulse',
    label: 'Serveur indisponible',
    title: 'Le backend ne répond pas — démarrage en cours ?',
  },
}

export default function BackendStatus() {
  const status = useBackendHealth()
  const { dot, label, title } = CONFIG[status]

  return (
    <div className="flex items-center gap-1.5 shrink-0" title={title}>
      <span className={`w-2 h-2 rounded-full inline-block ${dot}`} />
      {label && (
        <span className="text-xs text-red-400 font-medium hidden sm:inline">{label}</span>
      )}
    </div>
  )
}
