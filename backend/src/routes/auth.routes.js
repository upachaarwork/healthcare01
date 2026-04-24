const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { sendOtp, verifyOtp, completeDoctorProfile, refresh, logout } =
 require('../controllers/auth.controller');



// Public routes
router.post('/send-otp', sendOtp)
router.post('/verify-otp', verifyOtp)
router.post('/refresh', refresh)

// Protected routes
router.post('/logout', protect, logout)
router.post('/doctor/complete-profile', protect, completeDoctorProfile)

module.exports = router