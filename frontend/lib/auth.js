import api from './api'

export async function sendOtp(phone) {
  const { data } = await api.post('/auth/send-otp', { phone })
  return data   // { success, role, isNewUser }
}

export async function verifyOtp(phone, otp) {
  const { data } = await api.post('/auth/verify-otp', { phone, otp })
  if (data.accessToken) {
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('role', data.role)
    localStorage.setItem('userId', data.userId)
  }
  return data   // { success, role, needsProfile, accessToken }
}

export async function logout() {
  await api.post('/auth/logout')
  localStorage.clear()
  window.location.href = '/login'
}

export function getRole() {
  return localStorage.getItem('role')
}

export function isLoggedIn() {
  return !!localStorage.getItem('accessToken')
}

// Call this at the top of every dashboard page
export function redirectIfNotAuth(router) {
  if (typeof window === 'undefined') return
  if (!isLoggedIn()) router.replace('/login')
}

// Role-based redirect after login
export function redirectByRole(role, needsProfile, router) {
  if (role === 'doctor' && needsProfile) {
    router.replace('/doctor/onboarding')
  } else if (role === 'doctor') {
    router.replace('/doctor/dashboard')
  } else if (role === 'receptionist') {
    router.replace('/receptionist/dashboard')
  } else {
    router.replace('/patient/dashboard')
  }
}