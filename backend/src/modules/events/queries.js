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

const createEvent = async (organizer_id, event_type, title, description, rating, duration_mins, age_limit, language, genre, poster_url, poster_public_id, trailer_url) => {
  try {
    const pool = getPool();
    const [result] = await pool.execute(
      'INSERT INTO parent_events (organizer_id, event_type, title, description, rating, duration_mins, age_limit, language, genre, poster_url, poster_public_id, trailer_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [organizer_id, event_type, title, description || null, rating || null, duration_mins || null, age_limit || null, language || null, genre || null, poster_url || null, poster_public_id || null, trailer_url || null]
    );
    return result.insertId;
  } catch (err) {
    throw new Error('DB error in createEvent: ' + err.message);
  }
};

const updateEvent = async (event_id, title, description, rating, duration_mins, age_limit, language, genre, poster_url, poster_public_id, trailer_url) => {
  try {
    const pool = getPool();
    await pool.execute(
      'UPDATE parent_events SET title = ?, description = ?, rating = ?, duration_mins = ?, age_limit = ?, language = ?, genre = ?, poster_url = ?, poster_public_id = ?, trailer_url = ? WHERE event_id = ?',
      [title, description || null, rating || null, duration_mins || null, age_limit || null, language || null, genre || null, poster_url || null, poster_public_id || null, trailer_url || null, event_id]
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

const createSession = async (event_id, venue_id, show_date, show_time, demand_multiplier) => {
  try {
    const pool = getPool();
    const [result] = await pool.execute(
      'INSERT INTO event_sessions (event_id, venue_id, show_date, show_time, demand_multiplier) VALUES (?, ?, ?, ?, ?)',
      [event_id, venue_id, show_date, show_time, demand_multiplier || 1.00]
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

const getReviewsByEvent = async (event_id) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT r.*, u.full_name FROM reviews r JOIN users u ON r.user_id = u.user_id WHERE r.event_id = ? ORDER BY r.created_at DESC',
      [event_id]
    );
    return rows;
  } catch (err) {
    throw new Error('DB error in getReviewsByEvent: ' + err.message);
  }
};

const getReviewsBySession = async (session_id) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT r.*, u.full_name FROM reviews r JOIN users u ON r.user_id = u.user_id WHERE r.session_id = ? ORDER BY r.created_at DESC',
      [session_id]
    );
    return rows;
  } catch (err) {
    throw new Error('DB error in getReviewsBySession: ' + err.message);
  }
};

const createReview = async (user_id, event_id, session_id, rating, review_text) => {
  try {
    const pool = getPool();
    const [result] = await pool.execute(
      'INSERT INTO reviews (user_id, event_id, session_id, rating, review_text) VALUES (?, ?, ?, ?, ?)',
      [user_id, event_id || null, session_id || null, rating, review_text || null]
    );
    return result.insertId;
  } catch (err) {
    throw new Error('DB error in createReview: ' + err.message);
  }
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

module.exports = {
  getAllEvents, getEventById, createEvent, updateEvent, softDeleteEvent,
  getAllPeople, createPerson, updatePerson,
  getEventPeople, addPersonToEvent, removePersonFromEvent,
  getSessionsByEvent, createSession, updateSessionMultiplier, updateSessionStatus,
  getReviewsByEvent, getReviewsBySession, createReview,
  getAvailableSessions, getReviewScores
};
