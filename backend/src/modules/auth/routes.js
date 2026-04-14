const router = require('express').Router();
const { body } = require('express-validator');
const { authLimiter } = require('../../middleware/rateLimiter');
const { protect } = require('../../middleware/authMiddleware');
const { validate } = require('../../middleware/validate');
const { registerUser, loginUser, logoutUser, getProfile, updateProfile, getStates, changePassword, updateAvatar, getRoleRequestStatus, requestRole } = require('./service');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
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

// GET /auth/states
router.get('/states', protect, getStates);

// PATCH /auth/profile
router.patch('/profile', protect,
  body('fullname').optional().trim().notEmpty().isLength({ max: 100 }),
  body('phone').optional().trim().isLength({ max: 15 }),
  body('homestateid').optional({ nullable: true }).isInt({ min: 1 }),
  validate,
  updateProfile
);

// PATCH /auth/change-password
router.patch('/change-password', protect,
  body('currentPassword').notEmpty().withMessage('Current password required'),
  body('newPassword').isLength({ min: 8 }).withMessage('Min 8 characters'),
  validate,
  changePassword
);

// PATCH /auth/avatar
router.patch('/avatar', protect, upload.single('avatar'), updateAvatar);

// GET /auth/role-request-status
router.get('/role-request-status', protect, getRoleRequestStatus);

// POST /auth/request-role
router.post('/request-role', protect,
  body('role').isIn(['Event Organizer', 'Venue Owner']),
  validate,
  requestRole
);

module.exports = router;
