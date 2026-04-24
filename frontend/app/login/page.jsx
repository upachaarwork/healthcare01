'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { sendOtp } from '../../lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('+91')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSendOtp() {
    setError('')
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
      setError('Enter a valid phone number with country code e.g. +919876543210')
      return
    }
    setLoading(true)
    try {
      await sendOtp(phone)
      // Pass phone to verify page via query param
      router.push(`/verify?phone=${encodeURIComponent(phone)}`)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--surface)' }}>

      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-16"
        style={{ background: 'var(--ink)' }}>
        <div>
          <span className="font-display text-2xl" style={{ color: 'var(--teal)' }}>
            HealthQueue
          </span>
        </div>
        <div>
          <p className="font-display text-5xl leading-tight" style={{ color: 'var(--white)' }}>
            No more waiting<br />
            <em>in the dark.</em>
          </p>
          <p className="mt-6 text-lg" style={{ color: 'var(--muted)', maxWidth: 380 }}>
            Real-time queue management for modern clinics.
            Know your turn before you even leave home.
          </p>
        </div>
        <div className="flex gap-8">
          {['Patients', 'Doctors', 'Clinics'].map(s => (
            <div key={s}>
              <div className="text-2xl font-semibold" style={{ color: 'var(--white)' }}>
                {s === 'Patients' ? '10k+' : s === 'Doctors' ? '500+' : '120+'}
              </div>
              <div className="text-sm" style={{ color: 'var(--muted)' }}>{s}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden mb-10">
            <span className="font-display text-2xl" style={{ color: 'var(--teal)' }}>
              HealthQueue
            </span>
          </div>

          <h1 className="font-display text-3xl mb-2" style={{ color: 'var(--ink)' }}>
            Welcome back
          </h1>
          <p className="mb-10" style={{ color: 'var(--muted)' }}>
            Enter your phone number to continue
          </p>

          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--ink)' }}>
            Phone number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
            placeholder="+919876543210"
            className="w-full px-4 py-3 rounded-xl text-base outline-none transition-all"
            style={{
              border: '1.5px solid #e2e8f0',
              background: 'var(--white)',
              color: 'var(--ink)',
            }}
          />

          {error && (
            <p className="mt-3 text-sm" style={{ color: 'var(--error)' }}>{error}</p>
          )}

          <button
            onClick={handleSendOtp}
            disabled={loading}
            className="w-full mt-6 py-3 rounded-xl font-semibold text-base transition-all"
            style={{
              background: loading ? '#99f6e4' : 'var(--teal)',
              color: 'var(--white)',
              cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: '0.01em'
            }}
          >
            {loading ? 'Sending OTP…' : 'Get OTP →'}
          </button>

          <p className="mt-8 text-xs text-center" style={{ color: 'var(--muted)' }}>
            Receptionists: your doctor registers you. No signup needed.
          </p>
        </div>
      </div>

    </div>
  )
}