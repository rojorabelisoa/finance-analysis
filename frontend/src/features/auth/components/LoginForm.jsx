import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import authService from '../services/authService'

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
      setError(
        err.response?.data?.message || 'Identifiants incorrects. Veuillez réessayer.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-gray-400">Nom d'utilisateur</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          autoComplete="username"
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 text-sm placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors"
          placeholder="votre_pseudo"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-gray-400">Mot de passe</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 text-sm placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors"
          placeholder="••••••••"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg px-4 py-2.5 text-sm transition-colors"
      >
        {loading ? 'Connexion...' : 'Se connecter'}
      </button>
      <p className="text-center text-sm text-gray-500">
        Pas de compte ?{' '}
        <Link to="/register" className="text-emerald-400 hover:text-emerald-300 transition-colors">
          S'inscrire
        </Link>
      </p>
    </form>
  )
}
