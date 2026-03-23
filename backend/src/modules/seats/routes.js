const router = require('express').Router();
const { body, param } = require('express-validator');
const { protect } = require('../../middleware/authMiddleware');
const { allowRoles } = require('../../middleware/roleMiddleware');
const { validate } = require('../../middleware/validate');
const {
  getTiers,
  getVenueSeats,
  addSeat,
  addBulkSeats,
  getSessionSeatMap
} = require('./service');

// Seat tiers — anyone logged in can view
router.get('/tiers', protect, getTiers);

// Physical seats per venue — admin and organizer only
router.get(
  '/venue/:venue_id',
  protect,
  allowRoles('System Admin', 'Event Organizer'),
  [param('venue_id').isInt({ min: 1 }).withMessage('Invalid venue ID')],
  validate,
  getVenueSeats
);

// Add single seat to a venue
router.post(
  '/venue/:venue_id/seat',
  protect,
  allowRoles('System Admin'),
  [
    param('venue_id').isInt({ min: 1 }).withMessage('Invalid venue ID'),
    body('tier_id').isInt({ min: 1 }).withMessage('Valid tier is required'),
    body('seat_row').trim().notEmpty().isLength({ min: 1, max: 2 }).withMessage('Seat row must be 1-2 characters'),
    body('seat_number').isInt({ min: 1 }).withMessage('Seat number must be at least 1'),
  ],
  validate,
  addSeat
);

// Bulk add seats to a venue
router.post(
  '/venue/:venue_id/seats/bulk',
  protect,
  allowRoles('System Admin'),
  [
    param('venue_id').isInt({ min: 1 }).withMessage('Invalid venue ID'),
    body('seats').isArray({ min: 1 }).withMessage('Seats must be a non-empty array'),
    body('seats.*.tier_id').isInt({ min: 1 }).withMessage('Each seat needs a valid tier'),
    body('seats.*.seat_row').trim().notEmpty().withMessage('Each seat needs a row'),
    body('seats.*.seat_number').isInt({ min: 1 }).withMessage('Each seat needs a number'),
  ],
  validate,
  addBulkSeats
);

// Session seat map — attendees, organizers, staff all need this
router.get(
  '/session/:session_id',
  protect,
  [param('session_id').isInt({ min: 1 }).withMessage('Invalid session ID')],
  validate,
  getSessionSeatMap
);

module.exports = router;
