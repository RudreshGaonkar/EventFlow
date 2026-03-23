const rateLimit = require('express-rate-limit');

// For login and register routes
// Max 10 attempts per IP in 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many attempts — please try again after 15 minutes',
  },
  standardHeaders:  true,
  legacyHeaders:    false,
});

// For booking routes
// Max 20 booking requests per IP in 1 minute
const bookingLimiter = rateLimit({
  windowMs:1 * 60 * 1000,
  max:20,
  message: {
    success: false,
    message: 'Too many booking requests — please slow down',
  },
  standardHeaders:  true,
  legacyHeaders:false,
});

// For general API routes
// Max 100 requests per IP in 1 minute
const generalLimiter = rateLimit({
  windowMs:1 * 60 * 1000,
  max:100,
  message: {
    success: false,
    message: 'Too many requests — please slow down',
  },
  standardHeaders:  true,
  legacyHeaders:   false,
});

module.exports = { authLimiter, bookingLimiter, generalLimiter };
