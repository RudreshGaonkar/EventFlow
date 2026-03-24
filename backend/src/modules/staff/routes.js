const router = require('express').Router();
const { body, param } = require('express-validator');
const { protect } = require('../../middleware/authMiddleware');
const { allowRoles } = require('../../middleware/roleMiddleware');
const { validate } = require('../../middleware/validate');
const { addStaff, getAllStaff, getStaffById, toggleActive } = require('./service');

router.use(protect, allowRoles('System Admin'));

router.post(
  '/',
  [
    body('full_name').trim().notEmpty().withMessage('Full name is required'),
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
  ],
  validate,
  addStaff
);

router.get('/', getAllStaff);

router.get(
  '/:user_id',
  [param('user_id').isInt({ min: 1 }).withMessage('Invalid user ID')],
  validate,
  getStaffById
);

router.patch(
  '/:user_id/active',
  [
    param('user_id').isInt({ min: 1 }).withMessage('Invalid user ID'),
    body('is_active').isBoolean().withMessage('is_active must be a boolean'),
  ],
  validate,
  toggleActive
);

module.exports = router;
