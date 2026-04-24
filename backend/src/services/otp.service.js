const redis = require('../lib/redis')
const twilio = require('twilio')

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

const OTP_TTL = 3600         // 5 minutes in seconds
const MAX_ATTEMPTS = 5

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

async function sendOTP(phone, role) {
  const otp = generateOTP()
  const key = `otp:${phone}`

  console.log("Saving OTP:", key);
  await redis.setex(key, OTP_TTL, JSON.stringify({ otp, role, attempts: 0 }))
  console.log("Saved OTP");

  // In development, log instead of sending SMS (saves Twilio credits)
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEV OTP] Phone: ${phone} | OTP: ${otp} | Role: ${role}`)
    return { success: true }
  }

  await client.messages.create({
    body: `Your HealthQueue OTP is: ${otp}. Valid for 5 minutes.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone
  })

  return { success: true }
}

async function verifyOTP(phone, inputOtp) {
  const key = `otp:${phone}`
  const raw = await redis.get(key)

  if (!raw) return { valid: false, reason: 'OTP expired or not found' }

  const data = JSON.parse(raw)

  if (data.attempts >= MAX_ATTEMPTS) {
    await redis.del(key)
    return { valid: false, reason: 'Too many attempts' }
  }

  if (data.otp !== inputOtp) {
    data.attempts += 1
    await redis.setex(key, OTP_TTL, JSON.stringify(data))
    return { valid: false, reason: 'Incorrect OTP' }
  }

  await redis.del(key)   // OTP used — delete immediately
  return { valid: true, role: data.role }
}

module.exports = { sendOTP, verifyOTP }