import React from 'react'
import RegisterForm from '../features/auth/components/RegisterForm'

export default function RegisterPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'radial-gradient(ellipse at 50% -20%, rgba(52,211,153,0.07) 0%, #020617 60%)' }}
    >
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-2xl shadow-glow-green">
            📈
          </div>
          <h1 className="text-2xl font-bold text-slate-50">Finance Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1.5">Créez votre espace personnel</p>
        </div>
        <div className="w-full bg-slate-800/60 backdrop-blur-sm border border-slate-700/60 rounded-2xl p-7 shadow-glass">
          <h2 className="text-lg font-semibold text-slate-100 mb-6">Créer un compte</h2>
          <RegisterForm />
        </div>
      </div>
    </div>
  )
}
