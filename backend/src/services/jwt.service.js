const jwt = require('jsonwebtoken')
const prisma = require('../lib/prisma')

function signAccess(payload) {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES
  })
}

function signRefresh(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES
  })
}

function verifyAccess(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET)
}

function verifyRefresh(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET)
}

async function issueTokenPair(userId, role, phone) {
  const payload = { userId, role, phone }
  const accessToken = signAccess(payload)
  const refreshToken = signRefresh(payload)

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  await prisma.refreshToken.create({
    data: { token: refreshToken, userId, role, expiresAt }
  })

  return { accessToken, refreshToken }
}

module.exports = { signAccess, signRefresh, verifyAccess, verifyRefresh, issueTokenPair }