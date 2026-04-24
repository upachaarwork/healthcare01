'use client'
import { useState, useRef, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { verifyOtp, sendOtp, redirectByRole } from '../../lib/auth'

function VerifyForm() {
  const router = useRouter()
  const params = useSearchParams()
  const phone = params.get('phone') || ''

  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendTimer, setResendTimer] = useState(30)
  const inputs = useRef([])

  // Countdown for resend
  useEffect(() => {
    if (resendTimer <= 0) return
    const t = setTimeout(() => setResendTimer(r => r - 1), 1000)
    return () => clearTimeout(t)
  }, [resendTimer])

  function handleDigit(index, value) {
    if (!/^\d?$/.test(value)) return
    const next = [...otp]
    next[index] = value
    setOtp(next)
    if (value && index < 5) inputs.current[index + 1]?.focus()
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
  }

  // Handle paste of full OTP
  function handlePaste(e) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text.length === 6) {
      setOtp(text.split(''))
      inputs.current[5]?.focus()
    }
  }

  async function handleVerify() {
    const code = otp.join('')
    if (code.length !== 6) {
      setError('Enter the complete 6-digit OTP')
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = await verifyOtp(phone, code)
      redirectByRole(data.role, data.needsProfile, router)
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP. Try again.')
      setOtp(['', '', '', '', '', ''])
      inputs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    try {
      await sendOtp(phone)
      setResendTimer(30)
      setError('')
      setOtp(['', '', '', '', '', ''])
      inputs.current[0]?.focus()
    } catch {
      setError('Failed to resend OTP')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8"
      style={{ background: 'var(--surface)' }}>
      <div className="w-full max-w-sm">

        <button onClick={() => router.push('/login')}
          className="mb-10 text-sm flex items-center gap-1"
          style={{ color: 'var(--muted)' }}>
          ← Back
        </button>

        <h1 className="font-display text-3xl mb-2" style={{ color: 'var(--ink)' }}>
          Check your phone
        </h1>
        <p className="mb-2" style={{ color: 'var(--muted)' }}>
          We sent a 6-digit code to
        </p>
        <p className="font-semibold mb-10" style={{ color: 'var(--ink)' }}>{phone}</p>

        {/* OTP input boxes */}
        <div className="flex gap-3 mb-6" onPaste={handlePaste}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={el => inputs.current[i] = el}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleDigit(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className="w-12 h-14 text-center text-xl font-semibold rounded-xl outline-none transition-all"
              style={{
                border: digit ? '2px solid var(--teal)' : '1.5px solid #e2e8f0',
                background: 'var(--white)',
                color: 'var(--ink)',
              }}
            />
          ))}
        </div>

        {error && (
          <p className="mb-4 text-sm" style={{ color: 'var(--error)' }}>{error}</p>
        )}

        <button
          onClick={handleVerify}
          disabled={loading}
          className="w-full py-3 rounded-xl font-semibold text-base transition-all"
          style={{
            background: loading ? '#99f6e4' : 'var(--teal)',
            color: 'var(--white)',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Verifying…' : 'Verify OTP →'}
        </button>

        <div className="mt-6 text-center text-sm" style={{ color: 'var(--muted)' }}>
          {resendTimer > 0
            ? `Resend OTP in ${resendTimer}s`
            : <button onClick={handleResend}
                style={{ color: 'var(--teal)', fontWeight: 600 }}>
                Resend OTP
              </button>
          }
        </div>

      </div>
    </div>
  )
}

// useSearchParams requires Suspense in Next.js 14
export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  )
}