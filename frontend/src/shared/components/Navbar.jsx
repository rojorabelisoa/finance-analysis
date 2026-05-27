import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import BackendStatus from './BackendStatus'

export default function Navbar() {
  const { username: user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login')
    setOpen(false)
  }

  const linkCls = ({ isActive }) =>
    `text-sm font-medium transition-all duration-200 px-3 py-1.5 rounded-lg ${
      isActive
        ? 'text-emerald-400 bg-emerald-500/10'
        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-700/50'
    }`

  const links = user ? (
    <>
      <NavLink to="/portfolio" className={linkCls} onClick={() => setOpen(false)}>Portfolio</NavLink>
      <NavLink to="/analyse" className={linkCls} onClick={() => setOpen(false)}>Analyse</NavLink>
      <NavLink to="/screener" className={linkCls} onClick={() => setOpen(false)}>Screener</NavLink>
      <NavLink to="/alerts" className={linkCls} onClick={() => setOpen(false)}>Alertes</NavLink>
      <NavLink to="/pea" className={linkCls} onClick={() => setOpen(false)}>PEA</NavLink>
      <div className="h-4 w-px bg-slate-700 mx-1 hidden md:block" />
      <span className="text-slate-500 text-sm font-medium px-2 hidden md:block">{user}</span>
      <button
        onClick={handleLogout}
        className="text-sm text-slate-400 hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-all duration-200"
      >
        Déconnexion
      </button>
    </>
  ) : null

  return (
    <nav className="bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50 sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <NavLink to="/" className="flex items-center gap-2 shrink-0 group">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-sm group-hover:bg-emerald-500/25 transition-colors">
              📈
            </div>
            <span className="font-bold text-slate-100 text-sm tracking-tight" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
              Finance
            </span>
          </NavLink>

          {user && (
            <div className="hidden md:flex items-center gap-1">
              {links}
            </div>
          )}

          <BackendStatus />

          {user && (
            <button
              className="md:hidden text-slate-400 hover:text-slate-100 p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
              onClick={() => setOpen((v) => !v)}
              aria-label="Menu"
            >
              {open ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          )}
        </div>

        {user && open && (
          <div className="md:hidden flex flex-col gap-1 py-3 border-t border-slate-700/50">
            {links}
            <div className="flex items-center gap-2 px-3 pt-2 border-t border-slate-700/50 mt-1">
              <span className="text-slate-500 text-xs">{user}</span>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
