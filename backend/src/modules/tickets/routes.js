const router = require('express').Router();
const { param } = require('express-validator');
const { protect } = require('../../middleware/authMiddleware');
const { allowRoles } = require('../../middleware/roleMiddleware');
const { validate } = require('../../middleware/validate');
const { getMyTickets, getTicketDetail } = require('./service');

// Get all tickets for a booking
router.get(
  '/booking/:booking_id',
  protect,
  allowRoles('Attendee'),
  [param('booking_id').isInt({ min: 1 }).withMessage('Invalid booking ID')],
  validate,
  getMyTickets
);

// Get single ticket detail
router.get(
  '/:ticket_id',
  protect,
  allowRoles('Attendee'),
  [param('ticket_id').isInt({ min: 1 }).withMessage('Invalid ticket ID')],
  validate,
  getTicketDetail
);

module.exports = router;
