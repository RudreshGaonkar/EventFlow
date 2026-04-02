const router  = require('express').Router();
const { protect }        = require('../../middleware/authMiddleware');
const { allowRoles }     = require('../../middleware/roleMiddleware');
const { handleWebhook, getBookingTickets } = require('./service');

// ⚠️ Webhook — raw body already applied in app.js for this path
router.post('/webhook', handleWebhook);

// Get tickets for a confirmed booking
router.get(
  '/tickets/:booking_id',
  protect,
  allowRoles('Attendee'),
  getBookingTickets
);

module.exports = router;