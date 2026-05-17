import React from 'react'
import RegisterForm from '../features/auth/components/RegisterForm'

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        <div className="text-center">
          <div className="text-4xl mb-3">📈</div>
          <h1 className="text-2xl font-bold text-gray-100">Finance Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Créez votre espace personnel</p>
        </div>
        <div className="w-full bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-gray-100 mb-6">Créer un compte</h2>
          <RegisterForm />
        </div>
      </div>
    </div>
  )
}
