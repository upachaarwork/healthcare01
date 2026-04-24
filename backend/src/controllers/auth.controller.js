const prisma = require("../lib/prisma");
const { sendOTP, verifyOTP } = require("../services/otp.service");
const { issueTokenPair, verifyRefresh } = require("../services/jwt.service");


//  utility --

// Generates PAT-000001 style IDs
async function generatePatientId() {
  const count = await prisma.patient.count()
  const padded = String(count + 1).padStart(6, '0')
  return `PAT-${padded}`
}

// Detect role from phone number before OTP is sent
async function detectRole(phone) {
  const doctor = await prisma.doctor.findUnique({ where: { phone } })
  if (doctor) return 'doctor'

  const receptionist = await prisma.receptionist.findUnique({ where: { phone } })
  if (receptionist) return 'receptionist'

  // Default: patient (they self-register)
  return 'patient'
}

// ─── STEP 1: Send OTP ────────────────────────────────────────────────────────

async function sendOtp(req, res, next) {
  try {
    const { phone } = req.body

    if (!phone || !/^\+[1-9]\d{7,14}$/.test(phone)) {
      return res.status(400).json({ error: 'Invalid phone number. Use E.164 format e.g. +919876543210' })
    }

    const role = await detectRole(phone)

    // Receptionists can only log in, not self-register
    // detectRole returns 'receptionist' only if doctor pre-registered them
    // If phone is unknown → role = 'patient' (new patient flow)

    await sendOTP(phone, role)

    return res.json({
      success: true,
      message: 'OTP sent',
      // Tell frontend what kind of user this is so it can show the right UI
      isNewUser: role === 'patient'
        ? !(await prisma.patient.findUnique({ where: { phone } }))
        : false,
      role
    })
  } catch (err) {
    next(err)
  }
}

// ─── STEP 2: Verify OTP ──────────────────────────────────────────────────────

async function verifyOtp(req, res, next) {
  try {
    const { phone, otp } = req.body

    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP are required' })
    }

    const result = await verifyOTP(phone, otp)

    if (!result.valid) {
      return res.status(400).json({ error: result.reason })
    }

    const { role } = result
    let userId
    let needsProfile = false

    // ── Patient ──────────────────────────────────────────────────────────────
    if (role === 'patient') {
      let patient = await prisma.patient.findUnique({ where: { phone } })

      if (!patient) {
        // New patient → auto create with unique ID
        const patientId = await generatePatientId()
        patient = await prisma.patient.create({
          data: { phone, patientId }
        })
      }

      userId = patient.id

    // ── Doctor ───────────────────────────────────────────────────────────────
    } else if (role === 'doctor') {
      const doctor = await prisma.doctor.findUnique({ where: { phone } })

      if (!doctor) {
        return res.status(404).json({ error: 'Doctor not found. Contact admin.' })
      }

      userId = doctor.id
      // If doctor hasn't completed their profile yet
      needsProfile = !doctor.name || !doctor.registrationNo

    // ── Receptionist ─────────────────────────────────────────────────────────
    } else if (role === 'receptionist') {
      const receptionist = await prisma.receptionist.findUnique({ where: { phone } })

      if (!receptionist) {
        return res.status(403).json({ error: 'Not authorized. Ask your doctor to register you.' })
      }

      userId = receptionist.id
    }

    // Issue JWT pair
    const { accessToken, refreshToken } = await issueTokenPair(userId, role, phone)

    // Refresh token → httpOnly cookie (not accessible by JS → safer)
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000   // 7 days
    })

    return res.json({
      success: true,
      accessToken,
      role,
      needsProfile,   // frontend uses this to redirect to onboarding
      userId
    })
  } catch (err) {
    next(err)
  }
}

// ─── STEP 3: Doctor completes profile (first time only) ──────────────────────

async function completeDoctorProfile(req, res, next) {
  try {
    const { name, registrationNo, specialty, clinicName } = req.body
    const { userId, role } = req.user

    if (role !== 'doctor') {
      return res.status(403).json({ error: 'Only doctors can access this' })
    }

    if (!name || !registrationNo || !specialty) {
      return res.status(400).json({ error: 'name, registrationNo and specialty are required' })
    }

    const doctor = await prisma.doctor.update({
      where: { id: userId },
      data: { name, registrationNo, specialty, clinicName, isVerified: true }
    })

    return res.json({ success: true, doctor })
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Registration number already exists' })
    }
    next(err)
  }
}

// ─── Refresh access token ─────────────────────────────────────────────────────

async function refresh(req, res, next) {
  try {
    const token = req.cookies.refreshToken

    if (!token) return res.status(401).json({ error: 'No refresh token' })

    const decoded = verifyRefresh(token)

    // Check it exists in DB (allows server-side logout/revocation)
    const stored = await prisma.refreshToken.findUnique({ where: { token } })
    if (!stored || stored.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Refresh token expired or revoked' })
    }

    const { issueTokenPair: issue } = require('../services/jwt.service')
    const { accessToken, refreshToken: newRefresh } = await issue(
      decoded.userId, decoded.role, decoded.phone
    )

    // Rotate: delete old, set new
    await prisma.refreshToken.delete({ where: { token } })

    res.cookie('refreshToken', newRefresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })

    return res.json({ accessToken })
  } catch (err) {
    next(err)
  }
}

// ─── Logout ───────────────────────────────────────────────────────────────────

async function logout(req, res, next) {
  try {
    const token = req.cookies.refreshToken
    if (token) {
      await prisma.refreshToken.deleteMany({ where: { token } })
    }
    res.clearCookie('refreshToken')
    return res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

module.exports = { sendOtp, verifyOtp, completeDoctorProfile, refresh, logout }
