'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { redirectIfNotAuth, logout, getRole } from '../../../lib/auth'

export default function PatientDashboard() {
  const router = useRouter()
  useEffect(() => {
    redirectIfNotAuth(router)
    if (getRole() !== 'patient') router.replace('/login')
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="font-display text-4xl mb-4" style={{ color: 'var(--ink)' }}>
          Patient Dashboard
        </h1>
        <p style={{ color: 'var(--muted)' }}>Queue management coming soon.</p>
        <button onClick={logout} className="mt-8 px-6 py-2 rounded-xl text-sm font-medium"
          style={{ background: 'var(--ink)', color: 'var(--white)' }}>
          Logout
        </button>
      </div>
    </div>
  )
}