const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  try {
    // Read from Authorization header: "Bearer <token>"
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : req.cookies?.token; // fallback to cookie if present

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authenticated — no token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired — please log in again' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    return res.status(500).json({ success: false, message: 'Authentication error' });
  }
};

const optionalAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) return next(); // guest — no token, just continue

  try {
    const token = header.split(' ')[1];
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    // invalid/expired token — treat as guest
    req.user = null;
  }
  next();
};

module.exports = { protect ,optionalAuth};