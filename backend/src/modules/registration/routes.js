const express = require('express');
const router  = express.Router();

const { protect }        = require('../../middleware/authMiddleware');
const { allowRoles } = require('../../middleware/roleMiddleware');
const {
  register,
  getMyRegistrations,
  getRegistration,
  getEventRegistrations,
  cancelReg,
} = require('./service');

// ── All routes below require auth ─────────────────────────────────────────────
router.use(protect);

// POST  /api/registration/:event_id
router.post('/:event_id', register);

// GET   /api/registration/my                     ← specific first
router.get('/my', getMyRegistrations);

// GET   /api/registration/event/:event_id        ← specific before wildcard
router.get(
  '/event/:event_id',
  allowRoles('Event Organizer', 'Admin'),
  getEventRegistrations
);

// GET   /api/registration/:registration_id       ← wildcard last
router.get('/:registration_id', getRegistration);

// DELETE /api/registration/:registration_id
router.delete('/:registration_id', cancelReg);

module.exports = router;