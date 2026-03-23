const router = require('express').Router();
const { body } = require('express-validator');
const { authLimiter } = require('../../middleware/rateLimiter');
const { protect } = require('../../middleware/authMiddleware');
const { validate } = require('../../middleware/validate');
const { registerUser, loginUser, logoutUser, getProfile, updateProfile } = require('./service');

// Register
router.post(
  '/register',
  authLimiter,
  [
    body('full_name').trim().notEmpty().withMessage('Full name is required'),
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
    body('home_state_id').optional().isInt({ min: 1 }).withMessage('Invalid state'),
  ],
  validate,
  registerUser
);

// Login
router.post(
  '/login',
  authLimiter,
  [
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  loginUser
);

// Logout
router.post('/logout', protect, logoutUser);

// Get own profile
router.get('/profile', protect, getProfile);

// Update home state
router.patch(
  '/profile',
  protect,
  [
    body('home_state_id').isInt({ min: 1 }).withMessage('Valid state is required'),
  ],
  validate,
  updateProfile
);

module.exports = router;
