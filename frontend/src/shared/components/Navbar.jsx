import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

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
    `text-sm font-medium transition-colors ${isActive ? 'text-emerald-400' : 'text-gray-300 hover:text-gray-100'}`

  const links = user ? (
    <>
      <NavLink to="/portfolio" className={linkCls} onClick={() => setOpen(false)}>Portfolio</NavLink>
      <NavLink to="/analyse" className={linkCls} onClick={() => setOpen(false)}>Analyse</NavLink>
      <NavLink to="/screener" className={linkCls} onClick={() => setOpen(false)}>Screener</NavLink>
      <NavLink to="/alerts" className={linkCls} onClick={() => setOpen(false)}>Alertes</NavLink>
      <NavLink to="/pea" className={linkCls} onClick={() => setOpen(false)}>PEA</NavLink>
      <span className="text-gray-500 text-sm">{user}</span>
      <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-red-400 transition-colors">
        Déconnexion
      </button>
    </>
  ) : null

  return (
    <nav className="bg-gray-800 border-b border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2 text-emerald-400 font-bold text-lg shrink-0">
            <span>📈</span>
            <span>Finance</span>
          </NavLink>

          {/* Desktop links */}
          {user && (
            <div className="hidden md:flex items-center gap-6">
              {links}
            </div>
          )}

          {/* Mobile hamburger */}
          {user && (
            <button
              className="md:hidden text-gray-300 hover:text-gray-100 p-2"
              onClick={() => setOpen((v) => !v)}
              aria-label="Menu"
            >
              {open ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          )}
        </div>

        {/* Mobile menu dropdown */}
        {user && open && (
          <div className="md:hidden flex flex-col gap-4 py-4 border-t border-gray-700">
            {links}
          </div>
        )}
      </div>
    </nav>
  )
}
