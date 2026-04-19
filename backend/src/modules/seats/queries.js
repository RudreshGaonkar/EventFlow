const { getPool } = require('../../config/db');

// Seat Tiers

const getAllTiers = async () => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT * FROM seat_tiers ORDER BY base_price DESC'
    );
    return rows;
  } catch (err) {
    throw new Error('DB error in getAllTiers: ' + err.message);
  }
};

// Physical Seats per Venue

const getSeatsByVenue = async (venue_id) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT s.*, st.tier_name, st.base_price FROM seats s JOIN seat_tiers st ON s.tier_id = st.tier_id WHERE s.venue_id = ? AND s.is_active = TRUE ORDER BY s.seat_row ASC, s.seat_number ASC',
      [venue_id]
    );
    return rows;
  } catch (err) {
    throw new Error('DB error in getSeatsByVenue: ' + err.message);
  }
};

const createSeat = async (venue_id, tier_id, seat_row, seat_number, seat_label) => {
  try {
    const pool = getPool();
    const [result] = await pool.execute(
      'INSERT INTO seats (venue_id, tier_id, seat_row, seat_number, seat_label) VALUES (?, ?, ?, ?, ?)',
      [venue_id, tier_id, seat_row, seat_number, seat_label]
    );
    return result.insertId;
  } catch (err) {
    throw new Error('DB error in createSeat: ' + err.message);
  }
};

// Bulk create seats for a venue (called when venue is fully set up)
const bulkCreateSeats = async (seats) => {
  try {
    const pool = getPool();
    const values = seats.map(s => [s.venue_id, s.tier_id, s.seat_row, s.seat_number, s.seat_label]);
    await pool.query(
      'INSERT INTO seats (venue_id, tier_id, seat_row, seat_number, seat_label) VALUES ?',
      [values]
    );
  } catch (err) {
    throw new Error('DB error in bulkCreateSeats: ' + err.message);
  }
};

// Session Seats

const getSessionSeats = async (session_id) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT ss.session_seat_id, ss.status, ss.locked_until, s.seat_label, s.seat_row, s.seat_number, st.tier_name, st.base_price FROM session_seats ss JOIN seats s ON ss.seat_id = s.seat_id JOIN seat_tiers st ON s.tier_id = st.tier_id WHERE ss.session_id = ? ORDER BY s.seat_row ASC, s.seat_number ASC',
      [session_id]
    );
    return rows;
  } catch (err) {
    throw new Error('DB error in getSessionSeats: ' + err.message);
  }
};

// Create session_seats rows when a new session is created
const createSessionSeats = async (session_id, venue_id) => {
  try {
    const pool = getPool();
    // Copy all active seats from venue into session_seats for this session
    const [result] = await pool.execute(
      'INSERT INTO session_seats (session_id, seat_id) SELECT ?, seat_id FROM seats WHERE venue_id = ? AND is_active = TRUE',
      [session_id, venue_id]
    );
    // Update total_seats count on the session
    await pool.execute(
      'UPDATE event_sessions SET total_seats = ? WHERE session_id = ?',
      [result.affectedRows, session_id]
    );
    return result.affectedRows;
  } catch (err) {
    throw new Error('DB error in createSessionSeats: ' + err.message);
  }
};

// Release expired locked seats back to Available
const releaseExpiredLocks = async () => {
  try {
    const pool = getPool();
    const [result] = await pool.execute(
      'UPDATE session_seats SET status = ?, locked_until = NULL WHERE status = ? AND locked_until < NOW()',
      ['Available', 'Locked']
    );
    return result.affectedRows;
  } catch (err) {
    throw new Error('DB error in releaseExpiredLocks: ' + err.message);
  }
};

// Get session with venue info — needed to calculate final price
const getSessionWithVenue = async (session_id) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      `SELECT es.*, pe.event_type,
              v.venue_id, v.venue_name, v.layout_type,
              c.city_multiplier, c.city_name, s.state_name
       FROM event_sessions es
       JOIN parent_events pe ON pe.event_id = es.event_id
       JOIN venues        v  ON v.venue_id  = es.venue_id
       JOIN cities        c  ON c.city_id   = v.city_id
       JOIN states        s  ON s.state_id  = c.state_id
       WHERE es.session_id = ?`,
      [session_id]
    );
    return rows[0] || null;
  } catch (err) {
    throw new Error('DB error in getSessionWithVenue: ' + err.message);
  }
};

// Zoned layout: aggregate available session_seats per tier for Concert / Sport events.
// Uses JS-side grouping to avoid hitting JSON_ARRAYAGG group-concat length limits
// on venues with many seats.
const getZonedSeatingLayout = async (session_id) => {
  try {
    const pool = getPool();

    // Fetch all available seats for the session, joined with pricing data.
    // The final_price is computed inline so no second round-trip is needed.
    const [rows] = await pool.execute(
      `SELECT
         ss.session_seat_id,
         st.tier_id,
         st.tier_name,
         ROUND(st.base_price * c.city_multiplier * es.demand_multiplier, 2) AS final_price
       FROM session_seats ss
       JOIN seats          s   ON s.seat_id      = ss.seat_id
       JOIN seat_tiers     st  ON st.tier_id     = s.tier_id
       JOIN event_sessions es  ON es.session_id  = ss.session_id
       JOIN venues         v   ON v.venue_id     = es.venue_id
       JOIN cities         c   ON c.city_id      = v.city_id
       WHERE ss.session_id = ?
         AND ss.status     = 'Available'
       ORDER BY st.tier_id ASC`,
      [session_id]
    );

    // Group rows by tier in JavaScript — avoids any DB-level aggregation limits.
    const tierMap = new Map();
    for (const row of rows) {
      if (!tierMap.has(row.tier_id)) {
        tierMap.set(row.tier_id, {
          tier_id:             row.tier_id,
          tier:                row.tier_name,
          price:               parseFloat(row.final_price),
          available_count:     0,
          available_seat_ids:  [],
        });
      }
      const zone = tierMap.get(row.tier_id);
      zone.available_count++;
      zone.available_seat_ids.push(row.session_seat_id);
    }

    return {
      layout_type: 'ZONED',
      zones: Array.from(tierMap.values()),
    };
  } catch (err) {
    throw new Error('DB error in getZonedSeatingLayout: ' + err.message);
  }
};

module.exports = {
  getAllTiers,
  getSeatsByVenue,
  createSeat,
  bulkCreateSeats,
  getSessionSeats,
  getZonedSeatingLayout,
  createSessionSeats,
  releaseExpiredLocks,
  getSessionWithVenue
};
