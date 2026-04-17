const router = require('express').Router();
const { protect }    = require('../../middleware/authMiddleware');
const { allowRoles } = require('../../middleware/roleMiddleware');
const {
  browseRentableVenues,
  submitRentalRequest,
  getOwnerRequests,
  getOrganizerRequests,
  patchRequestStatus,
} = require('./service');

const organizer   = [protect, allowRoles('Event Organizer')];
const venueOwner  = [protect, allowRoles('Venue Owner')];

// ── Public (protected): browse available venues for a time slot ───────────────
// GET /api/rental/venues?start_time=2025-08-01T10:00:00&end_time=2025-08-01T18:00:00
router.get('/venues', protect, browseRentableVenues);

// ── Organizer: submit & view their own requests ───────────────────────────────
router.post('/requests',          ...organizer, submitRentalRequest);
router.get ('/organizer/requests', ...organizer, getOrganizerRequests);

// ── Venue Owner: view incoming requests, accept/reject ────────────────────────
router.get  ('/owner/requests',           ...venueOwner, getOwnerRequests);
router.patch('/requests/:id/status',      ...venueOwner, patchRequestStatus);

module.exports = router;
