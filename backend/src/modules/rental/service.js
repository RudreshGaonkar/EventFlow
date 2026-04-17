const {
  getRentableVenues,
  checkOverlap,
  createRentalRequest,
  getRequestsForOwner,
  getRequestsForOrganizer,
  getRequestWithVenueOwner,
  updateRequestStatus,
} = require('./queries');

// ── GET /api/venues/rentable?start_time=&end_time= ────────────────────────────
const browseRentableVenues = async (req, res) => {
  try {
    const { start_time, end_time } = req.query;

    // If one is given both must be given
    if ((start_time && !end_time) || (!start_time && end_time)) {
      return res.status(400).json({
        success: false,
        message: 'Both start_time and end_time are required for filtered browsing.',
      });
    }

    const venues = await getRentableVenues(start_time, end_time);
    return res.status(200).json({ success: true, data: venues });
  } catch (err) {
    console.error('[Rental] browseRentableVenues:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch rentable venues.' });
  }
};

// ── POST /api/rental-requests ─────────────────────────────────────────────────
const submitRentalRequest = async (req, res) => {
  try {
    const organizer_id = req.user.user_id;
    const { venue_id, start_time, end_time, event_name } = req.body;

    if (!venue_id || !start_time || !end_time) {
      return res.status(400).json({ success: false, message: 'venue_id, start_time, and end_time are required.' });
    }

    if (new Date(end_time) <= new Date(start_time)) {
      return res.status(400).json({ success: false, message: 'end_time must be after start_time.' });
    }

    // Race condition guard: check for overlapping accepted requests at submit time
    const conflict = await checkOverlap(venue_id, start_time, end_time);
    if (conflict) {
      return res.status(409).json({
        success: false,
        message: 'This venue is already booked (including 5-hour cleanup buffer) for the requested time slot.',
      });
    }

    const request_id = await createRentalRequest(organizer_id, venue_id, start_time, end_time, event_name);
    return res.status(201).json({ success: true, data: { request_id } });
  } catch (err) {
    console.error('[Rental] submitRentalRequest:', err.message);
    return res.status(500).json({ success: false, message: 'Could not submit rental request.' });
  }
};

// ── GET /api/venue-owner/requests ─────────────────────────────────────────────
const getOwnerRequests = async (req, res) => {
  try {
    const requests = await getRequestsForOwner(req.user.user_id);
    return res.status(200).json({ success: true, data: requests });
  } catch (err) {
    console.error('[Rental] getOwnerRequests:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch rental requests.' });
  }
};

// ── GET /api/organizer/rental-requests ────────────────────────────────────────
const getOrganizerRequests = async (req, res) => {
  try {
    const requests = await getRequestsForOrganizer(req.user.user_id);
    return res.status(200).json({ success: true, data: requests });
  } catch (err) {
    console.error('[Rental] getOrganizerRequests:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch your rental requests.' });
  }
};

// ── PATCH /api/rental-requests/:id/status ────────────────────────────────────
const patchRequestStatus = async (req, res) => {
  try {
    const request_id = Number(req.params.id);
    const { status } = req.body;
    const owner_id   = req.user.user_id;

    const ALLOWED = ['Accepted', 'Rejected'];
    if (!ALLOWED.includes(status)) {
      return res.status(400).json({ success: false, message: `status must be one of: ${ALLOWED.join(', ')}` });
    }

    // Ownership guard
    const request = await getRequestWithVenueOwner(request_id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Rental request not found.' });
    }
    if (request.owner_id !== owner_id) {
      return res.status(403).json({ success: false, message: 'You do not own this venue.' });
    }
    if (request.status !== 'Pending') {
      return res.status(409).json({ success: false, message: `Request is already ${request.status}.` });
    }

    // Before accepting, re-check for overlapping accepted requests (another owner may have raced)
    if (status === 'Accepted') {
      const conflict = await checkOverlap(request.venue_id, request.start_time, request.end_time, request_id);
      if (conflict) {
        return res.status(409).json({
          success: false,
          message: 'Another request for this venue was accepted in the same time slot. Cannot double-accept.',
        });
      }
    }

    await updateRequestStatus(request_id, status);
    return res.status(200).json({ success: true, data: { request_id, status } });
  } catch (err) {
    console.error('[Rental] patchRequestStatus:', err.message);
    return res.status(500).json({ success: false, message: 'Could not update request status.' });
  }
};

module.exports = {
  browseRentableVenues,
  submitRentalRequest,
  getOwnerRequests,
  getOrganizerRequests,
  patchRequestStatus,
};
