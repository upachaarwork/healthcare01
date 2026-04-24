'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '../../../lib/api'

const SPECIALTIES = [
  'General Physician', 'Cardiologist', 'Dermatologist',
  'Orthopedic', 'Pediatrician', 'ENT', 'Gynecologist',
  'Neurologist', 'Ophthalmologist', 'Psychiatrist', 'Other'
]

export default function DoctorOnboarding() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '', registrationNo: '', specialty: '', clinicName: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit() {
    if (!form.name || !form.registrationNo || !form.specialty) {
      setError('Name, registration number and specialty are required')
      return
    }
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/doctor/complete-profile', form)
      router.replace('/doctor/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const Field = ({ label, field, placeholder, type = 'text' }) => (
    <div className="mb-5">
      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--ink)' }}>
        {label}
      </label>
      <input
        type={type}
        value={form[field]}
        onChange={e => set(field, e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl text-base outline-none"
        style={{ border: '1.5px solid #e2e8f0', background: 'var(--white)', color: 'var(--ink)' }}
      />
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center p-8"
      style={{ background: 'var(--surface)' }}>
      <div className="w-full max-w-md">
        <span className="font-display text-xl" style={{ color: 'var(--teal)' }}>HealthQueue</span>
        <h1 className="font-display text-3xl mt-4 mb-2" style={{ color: 'var(--ink)' }}>
          Complete your profile
        </h1>
        <p className="mb-10" style={{ color: 'var(--muted)' }}>
          This is a one-time setup. Your patients will see this information.
        </p>

        <Field label="Full name" field="name" placeholder="Dr. Arjun Sharma" />
        <Field label="Medical registration number" field="registrationNo" placeholder="MCI-12345" />

        <div className="mb-5">
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--ink)' }}>
            Specialty
          </label>
          <select
            value={form.specialty}
            onChange={e => set('specialty', e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-base outline-none"
            style={{ border: '1.5px solid #e2e8f0', background: 'var(--white)', color: 'var(--ink)' }}
          >
            <option value="">Select specialty</option>
            {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <Field label="Clinic name (optional)" field="clinicName" placeholder="City Care Clinic" />

        {error && <p className="mb-4 text-sm" style={{ color: 'var(--error)' }}>{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3 rounded-xl font-semibold text-base"
          style={{
            background: loading ? '#99f6e4' : 'var(--teal)',
            color: 'var(--white)',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Saving…' : 'Go to Dashboard →'}
        </button>
      </div>
    </div>
  )
}