const {
  findVenuesByOwner, insertVenue, modifyVenue,
  findSeatsByVenue, insertSeatsForRow, toggleSeat,
  findPendingVenues, approveVenue, rejectVenue,
  findStaffByOwner, findAllCities,
} = require('./queries');

const getMyVenues = async (req, res) => {
  try {
    const venues = await findVenuesByOwner(req.user.user_id);
    return res.status(200).json({ success: true, data: venues });
  } catch (err) {
    console.error('[VenueOwner] getMyVenues:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch venues' });
  }
};

const createVenue = async (req, res) => {
  try {
    const id = await insertVenue(req.user.user_id, req.body);
    return res.status(201).json({ success: true, message: 'Venue submitted for approval', data: { venue_id: id } });
  } catch (err) {
    console.error('[VenueOwner] createVenue:', err.message);
    return res.status(500).json({ success: false, message: 'Could not create venue' });
  }
};

const updateVenue = async (req, res) => {
  try {
    await modifyVenue(req.params.venue_id, req.user.user_id, req.body);
    return res.status(200).json({ success: true, message: 'Venue updated' });
  } catch (err) {
    if (err.message === 'FORBIDDEN')
      return res.status(403).json({ success: false, message: 'Not your venue' });
    console.error('[VenueOwner] updateVenue:', err.message);
    return res.status(500).json({ success: false, message: 'Could not update venue' });
  }
};

// ── Seats ─────────────────────────────────────────────────────────────────────

const getSeats = async (req, res) => {
  try {
    const seats = await findSeatsByVenue(req.params.venue_id, req.user.user_id);
    return res.status(200).json({ success: true, data: seats });
  } catch (err) {
    if (err.message === 'FORBIDDEN')
      return res.status(403).json({ success: false, message: 'Not your venue' });
    console.error('[VenueOwner] getSeats:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch seats' });
  }
};

const addSeats = async (req, res) => {
  try {
    await insertSeatsForRow(req.params.venue_id, req.user.user_id, req.body);
    return res.status(201).json({ success: true, message: 'Seats added' });
  } catch (err) {
    if (err.message === 'FORBIDDEN')
      return res.status(403).json({ success: false, message: 'Not your venue' });
    console.error('[VenueOwner] addSeats:', err.message);
    return res.status(500).json({ success: false, message: err.message || 'Could not add seats' });
  }
};

const patchSeat = async (req, res) => {
  try {
    await toggleSeat(req.params.seat_id, req.user.user_id, req.body.is_active);
    return res.status(200).json({ success: true, message: 'Seat updated' });
  } catch (err) {
    if (err.message === 'FORBIDDEN')
      return res.status(403).json({ success: false, message: 'Not your seat' });
    console.error('[VenueOwner] patchSeat:', err.message);
    return res.status(500).json({ success: false, message: 'Could not update seat' });
  }
};

// ── Staff & Admin ─────────────────────────────────────────────────────────────

const getMyStaff = async (req, res) => {
  try {
    const staff = await findStaffByOwner(req.user.user_id);
    return res.status(200).json({ success: true, data: staff });
  } catch (err) {
    console.error('[VenueOwner] getMyStaff:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch staff' });
  }
};

const getPendingVenues = async (req, res) => {
  try {
    const venues = await findPendingVenues();
    return res.status(200).json({ success: true, data: venues });
  } catch (err) {
    console.error('[VenueOwner] getPendingVenues:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch pending venues' });
  }
};

const approvePendingVenue = async (req, res) => {
  try {
    await approveVenue(req.params.venue_id);
    return res.status(200).json({ success: true, message: 'Venue approved' });
  } catch (err) {
    console.error('[VenueOwner] approvePendingVenue:', err.message);
    return res.status(500).json({ success: false, message: 'Could not approve venue' });
  }
};

const rejectPendingVenue = async (req, res) => {
  try {
    await rejectVenue(req.params.venue_id);
    return res.status(200).json({ success: true, message: 'Venue rejected' });
  } catch (err) {
    console.error('[VenueOwner] rejectPendingVenue:', err.message);
    return res.status(500).json({ success: false, message: 'Could not reject venue' });
  }
};

const getCities = async (req, res) => {
  try {
    const cities = await findAllCities();
    return res.status(200).json({ success: true, data: cities });
  } catch (err) {
    console.error('[VenueOwner] getCities:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch cities' });
  }
};

module.exports = {
  getMyVenues, createVenue, updateVenue,
  getSeats, addSeats, patchSeat,
  getMyStaff,
  getPendingVenues, approvePendingVenue, rejectPendingVenue,
  getCities,
};