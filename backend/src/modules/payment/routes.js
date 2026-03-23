const router = require('express').Router();
const { body, param } = require('express-validator');
const { protect } = require('../../middleware/authMiddleware');
const { allowRoles } = require('../../middleware/roleMiddleware');
const { validate } = require('../../middleware/validate');
const { verifyPayment, handlePaymentFailure, getPaymentStatus } = require('./service');

// Verify payment after Razorpay checkout success
router.post(
  '/verify',
  protect,
  allowRoles('Attendee'),
  [
    body('razorpay_order_id').notEmpty().withMessage('Razorpay order ID is required'),
    body('razorpay_payment_id').notEmpty().withMessage('Razorpay payment ID is required'),
    body('razorpay_signature').notEmpty().withMessage('Razorpay signature is required'),
    body('booking_id').isInt({ min: 1 }).withMessage('Valid booking ID is required'),
  ],
  validate,
  verifyPayment
);

// Called by frontend when Razorpay checkout fails or is dismissed
router.post(
  '/failure',
  protect,
  allowRoles('Attendee'),
  [
    body('booking_id').isInt({ min: 1 }).withMessage('Valid booking ID is required'),
  ],
  validate,
  handlePaymentFailure
);

// Get payment status for a booking
router.get(
  '/status/:booking_id',
  protect,
  allowRoles('Attendee'),
  [param('booking_id').isInt({ min: 1 }).withMessage('Invalid booking ID')],
  validate,
  getPaymentStatus
);

module.exports = router;
