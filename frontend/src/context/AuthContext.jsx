import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext(null)

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      localStorage.setItem('token', action.payload.token)
      localStorage.setItem('username', action.payload.username)
      return { token: action.payload.token, username: action.payload.username }
    case 'LOGOUT':
      localStorage.removeItem('token')
      localStorage.removeItem('username')
      return { token: null, username: null }
    default:
      return state
  }
}

function AuthProviderInner({ children }) {
  const [state, dispatch] = useReducer(authReducer, {
    token: localStorage.getItem('token'),
    username: localStorage.getItem('username'),
  })
  const navigate = useNavigate()

  function login(token, username) {
    dispatch({ type: 'LOGIN', payload: { token, username } })
  }

  function logout() {
    dispatch({ type: 'LOGOUT' })
    navigate('/login', { replace: true })
  }

  useEffect(() => {
    function handleForceLogout() {
      dispatch({ type: 'LOGOUT' })
      navigate('/login', { replace: true })
    }
    window.addEventListener('finance:logout', handleForceLogout)
    return () => window.removeEventListener('finance:logout', handleForceLogout)
  }, [navigate])

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function AuthProvider({ children }) {
  return <AuthProviderInner>{children}</AuthProviderInner>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
