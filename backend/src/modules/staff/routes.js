const router = require('express').Router();
const { body, param } = require('express-validator');
const { protect } = require('../../middleware/authMiddleware');
const { allowRoles } = require('../../middleware/roleMiddleware');
const { validate } = require('../../middleware/validate');
const { addStaff, getAllStaff, getStaffById, toggleActive, assignVenue } = require('./service');

router.get('/', protect, allowRoles('System Admin'), getAllStaff);

router.get(
  '/:user_id',
  protect,
  allowRoles('System Admin'),
  [param('user_id').isInt({ min: 1 }).withMessage('Invalid user ID')],
  validate,
  getStaffById
);

router.post(
  '/',
  protect,
  allowRoles('System Admin', 'Event Organizer'),
  [
    body('full_name').trim().notEmpty().withMessage('Full name is required'),
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
    body('venue_id').optional().isInt({ min: 1 }).withMessage('Invalid venue ID'),
  ],
  validate,
  addStaff
);

router.patch(
  '/:user_id/active',
  protect,
  allowRoles('System Admin'),
  [
    param('user_id').isInt({ min: 1 }).withMessage('Invalid user ID'),
    body('is_active').isBoolean().withMessage('is_active must be a boolean'),
  ],
  validate,
  toggleActive
);

router.patch(
  '/:user_id/venue',
  protect,
  allowRoles('System Admin', 'Event Organizer'),
  [
    param('user_id').isInt({ min: 1 }).withMessage('Invalid user ID'),
    body('venue_id').isInt({ min: 1 }).withMessage('Valid venue ID is required'),
  ],
  validate,
  assignVenue
);

module.exports = router;