const router = require('express').Router();
const { body, param } = require('express-validator');
const { protect }       = require('../../middleware/authMiddleware');
const { allowRoles }    = require('../../middleware/roleMiddleware');
const { bookingLimiter }= require('../../middleware/rateLimiter');
const { validate }      = require('../../middleware/validate');
const {
  createBooking,getJobStatus,
  getMyBookings,
  getBookingDetail,
  cancelMyBooking,
} = require('./service');

// ── Create booking + Stripe Checkout Session ──────────────────────────────────
router.post(
  '/',
  protect,
  allowRoles('Attendee'),
  bookingLimiter,
  [
    body('session_id').isInt({ min: 1 }).withMessage('Valid session is required'),
    body('seat_ids').isArray({ min: 1, max: 10 }).withMessage('Select between 1 and 10 seats'),
    body('seat_ids.*').isInt({ min: 1 }).withMessage('Each seat ID must be a valid integer'),
  ],
  validate,
  createBooking
);

// ── All bookings for logged in user ───────────────────────────────────────────
router.get(
  '/my',
  protect,
  allowRoles('Attendee'),
  getMyBookings
);

router.get(
  '/status/:job_id',
  protect,
  allowRoles('Attendee'),
  [param('job_id').isUUID().withMessage('Invalid job ID')],
  validate,
  getJobStatus
);

// ── Single booking detail ─────────────────────────────────────────────────────
router.get(
  '/:booking_id',
  protect,
  allowRoles('Attendee'),
  [param('booking_id').isInt({ min: 1 }).withMessage('Invalid booking ID')],
  validate,
  getBookingDetail
);

// ── Cancel booking ────────────────────────────────────────────────────────────
router.patch(
  '/:booking_id/cancel',
  protect,
  allowRoles('Attendee'),
  [param('booking_id').isInt({ min: 1 }).withMessage('Invalid booking ID')],
  validate,
  cancelMyBooking
);

module.exports = router;