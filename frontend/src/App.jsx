import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { PortfolioProvider } from './context/PortfolioContext'
import Navbar from './shared/components/Navbar'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import PortfolioPage from './pages/PortfolioPage'
import AnalysePage from './pages/AnalysePage'
import ScreenerPage from './pages/ScreenerPage'
import AlertsPage from './pages/AlertsPage'
import PeaPage from './pages/PeaPage'

function PrivateRoute({ children }) {
  const { token } = useAuth()
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return children
}

function Layout() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}

function PrivateLayout() {
  return (
    <PrivateRoute>
      <Layout />
    </PrivateRoute>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PortfolioProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<Navigate to="/portfolio" replace />} />
            <Route element={<PrivateLayout />}>
              <Route path="/portfolio" element={<PortfolioPage />} />
              <Route path="/analyse" element={<AnalysePage />} />
              <Route path="/screener" element={<ScreenerPage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/pea" element={<PeaPage />} />
            </Route>
          </Routes>
        </PortfolioProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
