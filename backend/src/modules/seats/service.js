const { getClient } = require('../../config/redis');
const {
  getAllTiers,
  getSeatsByVenue,
  createSeat,
  bulkCreateSeats,
  getSessionSeats,
  createSessionSeats,
  releaseExpiredLocks,
  getSessionWithVenue
} = require('./queries');

// Cache TTL in seconds — 30 seconds as per SRS
const SEAT_CACHE_TTL = 30;

const getTiers = async (req, res) => {
  try {
    const tiers = await getAllTiers();
    return res.status(200).json({ success: true, data: tiers });
  } catch (err) {
    console.error('[Seats] getTiers error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch tiers' });
  }
};

const getVenueSeats = async (req, res) => {
  try {
    const { venue_id } = req.params;
    const seats = await getSeatsByVenue(venue_id);
    return res.status(200).json({ success: true, data: seats });
  } catch (err) {
    console.error('[Seats] getVenueSeats error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch seats' });
  }
};

const addSeat = async (req, res) => {
  try {
    const { venue_id, tier_id, seat_row, seat_number } = req.body;
    const seat_label = seat_row.toUpperCase() + '-' + seat_number;
    const seat_id = await createSeat(venue_id, tier_id, seat_row.toUpperCase(), seat_number, seat_label);
    return res.status(201).json({ success: true, message: 'Seat created', data: { seat_id, seat_label } });
  } catch (err) {
    console.error('[Seats] addSeat error:', err.message);
    if (err.message.includes('Duplicate')) {
      return res.status(409).json({ success: false, message: 'Seat label already exists in this venue' });
    }
    return res.status(500).json({ success: false, message: 'Could not create seat' });
  }
};

const addBulkSeats = async (req, res) => {
  try {
    const { venue_id, seats } = req.body;

    // Build seat objects with generated labels
    const seatRows = seats.map(s => ({
      venue_id: parseInt(venue_id),
      tier_id: s.tier_id,
      seat_row: s.seat_row.toUpperCase(),
      seat_number: s.seat_number,
      seat_label: s.seat_row.toUpperCase() + '-' + s.seat_number
    }));

    await bulkCreateSeats(seatRows);
    return res.status(201).json({ success: true, message: seats.length + ' seats created' });
  } catch (err) {
    console.error('[Seats] addBulkSeats error:', err.message);
    if (err.message.includes('Duplicate')) {
      return res.status(409).json({ success: false, message: 'One or more seat labels already exist' });
    }
    return res.status(500).json({ success: false, message: 'Could not create seats' });
  }
};

// Get seat map for a session — checks Redis cache first
const getSessionSeatMap = async (req, res) => {
  try {
    const { session_id } = req.params;
    const cacheKey = 'seats:avail:' + session_id;
    const redis = getClient();

    // Try cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.status(200).json({ success: true, data: JSON.parse(cached), source: 'cache' });
    }

    // Cache miss — fetch from DB
    const seats = await getSessionSeats(session_id);
    const session = await getSessionWithVenue(session_id);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // Calculate final price per seat
    const seatsWithPrice = seats.map(seat => ({
      ...seat,
      final_price: parseFloat(
        (seat.base_price * session.city_multiplier * session.demand_multiplier).toFixed(2)
      )
    }));

    const payload = { seats: seatsWithPrice, session };

    // Store in Redis cache with TTL
    await redis.set(cacheKey, JSON.stringify(payload), 'EX', SEAT_CACHE_TTL);

    return res.status(200).json({ success: true, data: payload, source: 'db' });
  } catch (err) {
    console.error('[Seats] getSessionSeatMap error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch seat map' });
  }
};

// Called by events/service.js after a session is created
const initSessionSeats = async (session_id, venue_id) => {
  try {
    const count = await createSessionSeats(session_id, venue_id);
    console.log('[Seats] Created ' + count + ' session seats for session ' + session_id);
    return count;
  } catch (err) {
    throw new Error('Could not init session seats: ' + err.message);
  }
};

// Called by cleanup cron — not an HTTP handler
const cleanupExpiredLocks = async () => {
  try {
    const released = await releaseExpiredLocks();
    if (released > 0) {
      console.log('[Seats] Released ' + released + ' expired seat locks');
    }
    return released;
  } catch (err) {
    console.error('[Seats] cleanupExpiredLocks error:', err.message);
  }
};

// Invalidate seat cache for a session — called by booking consumer after confirming
const invalidateSeatCache = async (session_id) => {
  try {
    const redis = getClient();
    await redis.del('seats:avail:' + session_id);
  } catch (err) {
    console.error('[Seats] invalidateSeatCache error:', err.message);
  }
};

module.exports = {
  getTiers,
  getVenueSeats,
  addSeat,
  addBulkSeats,
  getSessionSeatMap,
  initSessionSeats,
  cleanupExpiredLocks,
  invalidateSeatCache
};
