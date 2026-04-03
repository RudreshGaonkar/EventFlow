const { getPool } = require('../../config/db');
const {
  searchEvents,
  getEventDetail,
  getSessionsByEvent,
  getCitiesWithEvents,
  getStates,
} = require('./queries');

// ── Helper: resolve state_id ──────────────────────────────────────────────────
// Priority: 1. query param  2. logged-in user's home state  3. 0 (national only)
const resolveStateId = async (queryStateId, user) => {
  if (queryStateId) return queryStateId;

  if (user?.user_id) {
    const [[row]] = await getPool().query(
      `SELECT home_state_id FROM users WHERE user_id = ?`,
      [user.user_id]
    );
    if (row?.home_state_id) return row.home_state_id;
  }

  return 0; // 0 = show only national events to guests with no state
};

// ── GET /api/browse/events ────────────────────────────────────────────────────
const browseEvents = async (req, res) => {
  try {
    const { search, city_id, state_id, event_type, genre } = req.query;

    // req.user is set only if auth middleware ran — browse is public so may be undefined
    const resolved_state_id = await resolveStateId(state_id, req.user);

    const events = await searchEvents({
      search,
      city_id,
      state_id: resolved_state_id,
      event_type,
      genre,
    });

    return res.status(200).json({ success: true, data: events });
  } catch (err) {
    console.error('[Browse] browseEvents:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch events' });
  }
};

// ── GET /api/browse/events/:event_id ──────────────────────────────────────────
const eventDetail = async (req, res) => {
  try {
    const event = await getEventDetail(req.params.event_id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    return res.status(200).json({ success: true, data: event });
  } catch (err) {
    console.error('[Browse] eventDetail:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch event' });
  }
};

// ── GET /api/browse/events/:event_id/sessions ─────────────────────────────────
const eventSessions = async (req, res) => {
  try {
    const sessions = await getSessionsByEvent(req.params.event_id);
    return res.status(200).json({ success: true, data: sessions });
  } catch (err) {
    console.error('[Browse] eventSessions:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch sessions' });
  }
};

// ── GET /api/browse/cities ────────────────────────────────────────────────────
const citiesWithEvents = async (req, res) => {
  try {
    const cities = await getCitiesWithEvents();
    return res.status(200).json({ success: true, data: cities });
  } catch (err) {
    console.error('[Browse] citiesWithEvents:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch cities' });
  }
};

// ── GET /api/browse/states ────────────────────────────────────────────────────
const statesList = async (req, res) => {
  try {
    const states = await getStates();
    return res.status(200).json({ success: true, data: states });
  } catch (err) {
    console.error('[Browse] statesList:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch states' });
  }
};

module.exports = {
  browseEvents,
  eventDetail,
  eventSessions,
  citiesWithEvents,
  statesList,
};