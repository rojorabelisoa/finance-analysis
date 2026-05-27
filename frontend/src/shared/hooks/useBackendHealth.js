import { useState, useEffect } from 'react'
import axios from 'axios'

export function useBackendHealth(intervalMs = 20000) {
  const [status, setStatus] = useState('checking')

  useEffect(() => {
    let cancelled = false

    async function check() {
      try {
        await axios.get('/api/health', { timeout: 5000 })
        if (!cancelled) setStatus('up')
      } catch {
        if (!cancelled) setStatus('down')
      }
    }

    check()
    const id = setInterval(check, intervalMs)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [intervalMs])

  return status
}
