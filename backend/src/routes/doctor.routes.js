const router = require('express').Router()
const { protect, allowOnly } = require('../middleware/auth.middleware')
const prisma = require('../lib/prisma')

// GET /api/doctor/receptionists — list all receptionists of this doctor
router.get('/receptionists', protect, allowOnly('doctor'), async (req, res, next) => {
  try {
    const receptionists = await prisma.receptionist.findMany({
      where: { doctorId: req.user.userId },
      select: { id: true, phone: true, name: true, createdAt: true }
    })
    res.json({ receptionists })
  } catch (err) { next(err) }
});

// POST /api/doctor/receptionists — doctor registers a receptionist by phone
router.post('/receptionists', protect, allowOnly('doctor'), async (req, res, next) => {
  try {
    const { phone, name } = req.body

    if (!phone || !/^\+[1-9]\d{7,14}$/.test(phone)) {
      return res.status(400).json({ error: 'Valid phone number required (E.164 format)' })
    }

    // Check phone not already a patient or doctor
    const conflict = await prisma.patient.findUnique({ where: { phone } })
      || await prisma.doctor.findUnique({ where: { phone } })

    if (conflict) {
      return res.status(409).json({ error: 'This phone is already registered as a patient or doctor' })
    }

    const receptionist = await prisma.receptionist.create({
      data: { phone, name, doctorId: req.user.userId }
    })

    res.status(201).json({ success: true, receptionist })
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'This phone is already a receptionist' })
    }
    next(err)
  }
});

// DELETE /api/doctor/receptionists/:id — doctor removes a receptionist
router.delete('/receptionists/:id', protect, allowOnly('doctor'), async (req, res, next) => {
  try {
    const receptionist = await prisma.receptionist.findFirst({
      where: { id: req.params.id, doctorId: req.user.userId }
    })

    if (!receptionist) {
      return res.status(404).json({ error: 'Receptionist not found' })
    }

    await prisma.receptionist.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err) { next(err) }
});

module.exports = router