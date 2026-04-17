const router  = require('express').Router();
const { protect }    = require('../../middleware/authMiddleware');
const { allowRoles } = require('../../middleware/roleMiddleware');
const { verifyPayment, getBookingTickets } = require('./service');

// ── POST /api/payment/verify — Razorpay synchronous signature verification ─────
router.post('/verify', protect, verifyPayment);

// ── GET /api/payment/tickets/:booking_id ──────────────────────────────────────
router.get(
  '/tickets/:booking_id',
  protect,
  allowRoles('Attendee'),
  getBookingTickets
);

module.exports = router;