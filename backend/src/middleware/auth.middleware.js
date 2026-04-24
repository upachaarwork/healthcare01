const { verifyAccess } = require("../services/jwt.service");

// Protect any route — just add this middleware
function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyAccess(token)
    req.user = decoded   // { userId, role, phone }
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
};

// Restrict route to specific roles
// Usage: allowOnly('doctor'), allowOnly('doctor', 'receptionist')
function allowOnly(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ error: 'Access denied' })
    }
    next()
  }
};

module.exports = { protect, allowOnly }