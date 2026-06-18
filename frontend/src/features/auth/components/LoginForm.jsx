import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import authService from '../services/authService'

const inputCls = 'bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all w-full'

export default function LoginForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await authService.login(username, password)
      login(data.token, data.username)
      navigate('/portfolio')
    } catch (err) {
      setError(err.response?.data?.message || 'Identifiants incorrects. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/25 text-red-400 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Nom d'utilisateur</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          autoComplete="username"
          className={inputCls}
          placeholder="votre_pseudo"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Mot de passe</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className={inputCls}
          placeholder="••••••••"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl px-4 py-2.5 text-sm transition-all duration-200 mt-1"
      >
        {loading ? 'Connexion...' : 'Se connecter'}
      </button>
      <p className="text-center text-sm text-slate-500">
        Pas de compte ?{' '}
        <Link to="/register" className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
          S'inscrire
        </Link>
      </p>
    </form>
  )
}
