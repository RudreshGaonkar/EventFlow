const router = require('express').Router();
const { body } = require('express-validator');
const { protect } = require('../../middleware/authMiddleware');
const { allowRoles } = require('../../middleware/roleMiddleware');
const { validate } = require('../../middleware/validate');
const { scanTicket } = require('./service');

router.post(
  '/validate',
  protect,
  allowRoles('Venue Staff'),
  [
    body('ticket_uuid')
      .trim()
      .notEmpty().withMessage('Ticket UUID is required')
      .isUUID().withMessage('Invalid ticket UUID format')
  ],
  validate,
  scanTicket
);

module.exports = router;
