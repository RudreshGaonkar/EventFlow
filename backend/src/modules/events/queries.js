const { getPool } = require('../../config/db');

// Parent Events

const getAllEvents = async () => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT e.*, u.full_name AS organizer_name FROM parent_events e JOIN users u ON e.organizer_id = u.user_id WHERE e.is_active = TRUE ORDER BY e.created_at DESC'
    );
    return rows;
  } catch (err) {
    throw new Error('DB error in getAllEvents: ' + err.message);
  }
};

const getEventById = async (event_id) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT e.*, u.full_name AS organizer_name FROM parent_events e JOIN users u ON e.organizer_id = u.user_id WHERE e.event_id = ?',
      [event_id]
    );
    return rows[0] || null;
  } catch (err) {
    throw new Error('DB error in getEventById: ' + err.message);
  }
};

const createEvent = async (
  organizer_id, event_type, title, description,
  rating, duration_mins, age_limit, language, genre,
  poster_url, poster_public_id, trailer_url,
  // ── Registration fields ──
  registration_mode = 'booking',
  participation_type = 'solo',
  max_participants = null,
  min_team_size = 1,
  max_team_size = 1,
  registration_fee = 0,
  event_scope = 'national',
  listing_days_ahead = null,        // auto-set below if not provided
) => {
  try {
    const pool = getPool();

    // Auto-set listing window: registration events get 30 days, booking gets 5
    const days = listing_days_ahead ??
      (registration_mode === 'booking' ? 5 : 30);

    const [result] = await pool.execute(
      `INSERT INTO parent_events (
        organizer_id, event_type, title, description,
        rating, duration_mins, age_limit, language, genre,
        poster_url, poster_public_id, trailer_url,
        registration_mode, participation_type,
        max_participants, min_team_size, max_team_size,
        registration_fee, event_scope, listing_days_ahead
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        organizer_id,
        event_type,
        title,
        description || null,
        rating || null,
        duration_mins || null,
        age_limit || null,
        language || null,
        genre || null,
        poster_url || null,
        poster_public_id || null,
        trailer_url || null,
        registration_mode,
        participation_type,
        max_participants,
        min_team_size,
        max_team_size,
        registration_fee,
        event_scope,
        days,
      ]
    );
    return result.insertId;
  } catch (err) {
    throw new Error('DB error in createEvent: ' + err.message);
  }
};

const updateEvent = async (
  event_id, title, description,
  rating, duration_mins, age_limit, language, genre,
  poster_url, poster_public_id, trailer_url,
  // ── Registration fields ──
  registration_mode = 'booking',
  participation_type = 'solo',
  max_participants = null,
  min_team_size = 1,
  max_team_size = 1,
  registration_fee = 0,
  event_scope = 'national',
  listing_days_ahead = null,
) => {
  try {
    const pool = getPool();

    const days = listing_days_ahead ??
      (registration_mode === 'booking' ? 5 : 30);

    await pool.execute(
      `UPDATE parent_events SET
        title               = ?,
        description         = ?,
        rating              = ?,
        duration_mins       = ?,
        age_limit           = ?,
        language            = ?,
        genre               = ?,
        poster_url          = ?,
        poster_public_id    = ?,
        trailer_url         = ?,
        registration_mode   = ?,
        participation_type  = ?,
        max_participants    = ?,
        min_team_size       = ?,
        max_team_size       = ?,
        registration_fee    = ?,
        event_scope         = ?,
        listing_days_ahead  = ?
      WHERE event_id = ?`,
      [
        title,
        description || null,
        rating || null,
        duration_mins || null,
        age_limit || null,
        language || null,
        genre || null,
        poster_url || null,
        poster_public_id || null,
        trailer_url || null,
        registration_mode,
        participation_type,
        max_participants,
        min_team_size,
        max_team_size,
        registration_fee,
        event_scope,
        days,
        event_id,
      ]
    );
  } catch (err) {
    throw new Error('DB error in updateEvent: ' + err.message);
  }
};

const softDeleteEvent = async (event_id) => {
  try {
    const pool = getPool();
    await pool.execute(
      'UPDATE parent_events SET is_active = FALSE WHERE event_id = ?',
      [event_id]
    );
  } catch (err) {
    throw new Error('DB error in softDeleteEvent: ' + err.message);
  }
};

// People (Cast and Crew)

const getAllPeople = async () => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT * FROM people ORDER BY real_name ASC'
    );
    return rows;
  } catch (err) {
    throw new Error('DB error in getAllPeople: ' + err.message);
  }
};

const createPerson = async (real_name, photo_url, photo_public_id, bio) => {
  try {
    const pool = getPool();
    const [result] = await pool.execute(
      'INSERT INTO people (real_name, photo_url, photo_public_id, bio) VALUES (?, ?, ?, ?)',
      [real_name, photo_url || null, photo_public_id || null, bio || null]
    );
    return result.insertId;
  } catch (err) {
    throw new Error('DB error in createPerson: ' + err.message);
  }
};

const updatePerson = async (person_id, real_name, photo_url, photo_public_id, bio) => {
  try {
    const pool = getPool();
    await pool.execute(
      'UPDATE people SET real_name = ?, photo_url = ?, photo_public_id = ?, bio = ? WHERE person_id = ?',
      [real_name, photo_url || null, photo_public_id || null, bio || null, person_id]
    );
  } catch (err) {
    throw new Error('DB error in updatePerson: ' + err.message);
  }
};

// Event People (Cast and Crew assignments)

const getEventPeople = async (event_id) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT ep.*, p.real_name, p.photo_url, p.bio FROM event_people ep JOIN people p ON ep.person_id = p.person_id WHERE ep.event_id = ? ORDER BY ep.billing_order ASC',
      [event_id]
    );
    return rows;
  } catch (err) {
    throw new Error('DB error in getEventPeople: ' + err.message);
  }
};

const addPersonToEvent = async (event_id, person_id, role_type, character_name, designation, billing_order) => {
  try {
    const pool = getPool();
    const [result] = await pool.execute(
      'INSERT INTO event_people (event_id, person_id, role_type, character_name, designation, billing_order) VALUES (?, ?, ?, ?, ?, ?)',
      [event_id, person_id, role_type, character_name || null, designation || null, billing_order || null]
    );
    return result.insertId;
  } catch (err) {
    throw new Error('DB error in addPersonToEvent: ' + err.message);
  }
};

const removePersonFromEvent = async (event_person_id) => {
  try {
    const pool = getPool();
    await pool.execute(
      'DELETE FROM event_people WHERE event_person_id = ?',
      [event_person_id]
    );
  } catch (err) {
    throw new Error('DB error in removePersonFromEvent: ' + err.message);
  }
};

// Sessions

const getSessionsByEvent = async (event_id) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT es.*, v.venue_name, c.city_name, s.state_name FROM event_sessions es JOIN venues v ON es.venue_id = v.venue_id JOIN cities c ON v.city_id = c.city_id JOIN states s ON c.state_id = s.state_id WHERE es.event_id = ? ORDER BY es.show_date ASC, es.show_time ASC',
      [event_id]
    );
    return rows;
  } catch (err) {
    throw new Error('DB error in getSessionsByEvent: ' + err.message);
  }
};

const createSession = async (
  event_id, venue_id, show_date, show_time, demand_multiplier,
  requires_registration = 0,
  session_max_participants = null,
) => {
  try {
    const pool = getPool();
    const [result] = await pool.execute(
      `INSERT INTO event_sessions
         (event_id, venue_id, show_date, show_time, demand_multiplier,
          requires_registration, session_max_participants)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        event_id, venue_id, show_date, show_time,
        demand_multiplier || 1.00,
        requires_registration ? 1 : 0,
        session_max_participants || null,
      ]
    );
    return result.insertId;
  } catch (err) {
    throw new Error('DB error in createSession: ' + err.message);
  }
};

const updateSessionMultiplier = async (session_id, demand_multiplier) => {
  try {
    const pool = getPool();
    await pool.execute(
      'UPDATE event_sessions SET demand_multiplier = ? WHERE session_id = ?',
      [demand_multiplier, session_id]
    );
  } catch (err) {
    throw new Error('DB error in updateSessionMultiplier: ' + err.message);
  }
};

const updateSessionStatus = async (session_id, status) => {
  try {
    const pool = getPool();
    await pool.execute(
      'UPDATE event_sessions SET status = ? WHERE session_id = ?',
      [status, session_id]
    );
  } catch (err) {
    throw new Error('DB error in updateSessionStatus: ' + err.message);
  }
};

// Reviews

const getReviewsByEvent = async (eventid) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      `SELECT r.review_id, r.user_id, r.event_id, r.session_id,
              r.rating, r.review_text, r.edit_count, r.created_at,
              u.full_name
       FROM reviews r
       JOIN users u ON r.user_id = u.user_id
       WHERE r.event_id = ?
       ORDER BY r.created_at DESC`,
      [eventid]
    );
    return rows;
  } catch (err) { throw new Error(`DB error in getReviewsByEvent: ${err.message}`); }
};

const getReviewsBySession = async (sessionid) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      `SELECT r.review_id, r.user_id, r.event_id, r.session_id,
              r.rating, r.review_text, r.edit_count, r.created_at,
              u.full_name
       FROM reviews r
       JOIN users u ON r.user_id = u.user_id
       WHERE r.session_id = ?
       ORDER BY r.created_at DESC`,
      [sessionid]
    );
    return rows;
  } catch (err) { throw new Error(`DB error in getReviewsBySession: ${err.message}`); }
};

const createReview = async (userid, eventid, sessionid, rating, reviewtext) => {
  try {
    const pool = getPool();
    const [result] = await pool.execute(
      `INSERT INTO reviews (user_id, event_id, session_id, rating, review_text)
       VALUES (?, ?, ?, ?, ?)`,
      [userid, eventid ?? null, sessionid ?? null, rating, reviewtext ?? null]
    );
    return result.insertId;
  } catch (err) { throw new Error(`DB error in createReview: ${err.message}`); }
};

const getAvailableSessions = async (state_id) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT * FROM vw_session_availability WHERE state_id = ? ORDER BY show_date ASC, show_time ASC',
      [state_id]
    );
    return rows;
  } catch (err) {
    throw new Error('DB error in getAvailableSessions: ' + err.message);
  }
};

const getReviewScores = async (event_id) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT * FROM vw_review_scores WHERE target_id = ? AND level = ?',
      [event_id, 'parent_event']
    );
    return rows[0] || null;
  } catch (err) {
    throw new Error('DB error in getReviewScores: ' + err.message);
  }
};

// Check if user is eligible to review (confirmed booking/registration + event/session is past)
const checkReviewEligibility = async (userid, eventid, sessionid) => {
  try {
    const pool = getPool();

    if (eventid) {
      // Via confirmed booking for a past/completed session of this event
      const [r1] = await pool.execute(
        `SELECT 1 FROM bookings b
         JOIN event_sessions es ON es.session_id = b.session_id
         WHERE b.user_id = ? AND es.event_id = ?
           AND b.booking_status = 'Confirmed'
           AND (es.show_date < CURDATE() OR es.status = 'Completed')
         LIMIT 1`,
        [userid, eventid]
      );
      if (r1.length > 0) return true;

      // Via confirmed registration for this event
      const [r2] = await pool.execute(
        `SELECT 1 FROM event_registrations
         WHERE user_id = ? AND event_id = ? AND status = 'Confirmed'
         LIMIT 1`,
        [userid, eventid]
      );
      return r2.length > 0;
    }

    if (sessionid) {
      // Via confirmed booking for this specific past/completed session
      const [r1] = await pool.execute(
        `SELECT 1 FROM bookings b
         JOIN event_sessions es ON es.session_id = b.session_id
         WHERE b.user_id = ? AND b.session_id = ?
           AND b.booking_status = 'Confirmed'
           AND (es.show_date < CURDATE() OR es.status = 'Completed')
         LIMIT 1`,
        [userid, sessionid]
      );
      if (r1.length > 0) return true;

      // Via confirmed registration for this specific past/completed session
      const [r2] = await pool.execute(
        `SELECT 1 FROM event_registrations er
         JOIN event_sessions es ON es.session_id = er.session_id
         WHERE er.user_id = ? AND er.session_id = ?
           AND er.status = 'Confirmed'
           AND (es.show_date < CURDATE() OR es.status = 'Completed')
         LIMIT 1`,
        [userid, sessionid]
      );
      return r2.length > 0;
    }

    return false;
  } catch (err) {
    throw new Error(`DB error in checkReviewEligibility: ${err.message}`);
  }
};

// Get the current user's review for a specific event or session
const getMyReview = async (userid, eventid, sessionid) => {
  try {
    const pool = getPool();
    if (eventid) {
      const [rows] = await pool.execute(
        'SELECT * FROM reviews WHERE user_id = ? AND event_id = ?',
        [userid, eventid]
      );
      return rows[0] || null;
    }
    if (sessionid) {
      const [rows] = await pool.execute(
        'SELECT * FROM reviews WHERE user_id = ? AND session_id = ?',
        [userid, sessionid]
      );
      return rows[0] || null;
    }
    return null;
  } catch (err) { throw new Error(`DB error in getMyReview: ${err.message}`); }
};

// Fetch a single review by ID (for ownership + edit_count checks)
const getReviewById = async (reviewid) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT * FROM reviews WHERE reviewid = ?',
      [reviewid]
    );
    return rows[0] || null;
  } catch (err) {
    throw new Error(`DB error in getReviewById: ${err.message}`);
  }
};

// Update review text/rating and increment edit counter
const updateReview = async (reviewid, rating, reviewtext) => {
  try {
    const pool = getPool();
    await pool.execute(
      `UPDATE reviews SET rating = ?, review_text = ?, edit_count = edit_count + 1
       WHERE review_id = ?`,
      [rating, reviewtext ?? null, reviewid]
    );
  } catch (err) { throw new Error(`DB error in updateReview: ${err.message}`); }
};

module.exports = {
  getAllEvents, getEventById, createEvent, updateEvent, softDeleteEvent,
  getAllPeople, createPerson, updatePerson,
  getEventPeople, addPersonToEvent, removePersonFromEvent,
  getSessionsByEvent, createSession, updateSessionMultiplier, updateSessionStatus,
  getReviewsByEvent, getReviewsBySession, createReview,
  getAvailableSessions, getReviewScores, checkReviewEligibility, getMyReview, getReviewById, updateReview,
};
