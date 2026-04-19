const { getPool } = require('../../config/db');

const findVenuesByOwner = async (owner_id) => {
  const [rows] = await getPool().query(
    `SELECT v.*, c.city_name, s.state_name
     FROM venues v
     JOIN cities c ON c.city_id = v.city_id
     JOIN states s ON s.state_id = c.state_id
     WHERE v.owner_id = ?
     ORDER BY v.venue_id DESC`,
    [owner_id]
  );
  return rows;
};

const insertVenue = async (owner_id, fields) => {
  const [r] = await getPool().query(
    `INSERT INTO venues (city_id, owner_id, venue_name, address, total_capacity, is_rentable, status, is_active)
     VALUES (?, ?, ?, ?, ?, ?, 'Pending', 0)`,
    [fields.city_id, owner_id, fields.venue_name, fields.address || null, fields.total_capacity, fields.is_rentable ? 1 : 0]
  );
  return r.insertId;
};

const modifyVenue = async (venue_id, owner_id, fields) => {
  const [check] = await getPool().query(
    `SELECT venue_id FROM venues WHERE venue_id = ? AND owner_id = ?`,
    [venue_id, owner_id]
  );
  if (!check.length) throw new Error('FORBIDDEN');

  const allowed = ['venue_name', 'address', 'total_capacity', 'city_id', 'is_rentable'];
  const cols = [], vals = [];
  for (const k of allowed) {
    if (fields[k] !== undefined) { cols.push(`${k} = ?`); vals.push(fields[k]); }
  }
  if (!cols.length) return;
  vals.push(venue_id);
  await getPool().query(`UPDATE venues SET ${cols.join(', ')} WHERE venue_id = ?`, vals);
};

// ── Seat Management ───────────────────────────────────────────────────────────

const findSeatsByVenue = async (venue_id, owner_id) => {
  const [check] = await getPool().query(
    `SELECT venue_id FROM venues WHERE venue_id = ? AND owner_id = ?`,
    [venue_id, owner_id]
  );
  if (!check.length) throw new Error('FORBIDDEN');

  const [rows] = await getPool().query(
    `SELECT s.seat_id, s.seat_row, s.seat_number, s.seat_label, s.is_active,
            st.tier_name, st.base_price, st.tier_id
     FROM seats s
     JOIN seat_tiers st ON st.tier_id = s.tier_id
     WHERE s.venue_id = ?
     ORDER BY s.seat_row, s.seat_number`,
    [venue_id]
  );
  return rows;
};

const insertSeatsForRow = async (venue_id, owner_id, fields) => {
  // fields: { tier_id, seat_row, seat_count }
  const [check] = await getPool().query(
    `SELECT venue_id FROM venues WHERE venue_id = ? AND owner_id = ?`,
    [venue_id, owner_id]
  );
  if (!check.length) throw new Error('FORBIDDEN');

  const { tier_id, seat_row, seat_count } = fields;
  const row = seat_row.toUpperCase();
  const count = parseInt(seat_count);
  if (count < 1 || count > 50) throw new Error('Seat count must be 1–50');

  const values = [];
  for (let n = 1; n <= count; n++) {
    values.push([venue_id, tier_id, row, n, `${row}-${n}`]);
  }

  await getPool().query(
    `INSERT IGNORE INTO seats (venue_id, tier_id, seat_row, seat_number, seat_label)
     VALUES ?`,
    [values]
  );

  // Retroactive Sync: Add newly fully active seats to future sessions
  await getPool().query(
    `INSERT IGNORE INTO session_seats (session_id, seat_id, status)
     SELECT es.session_id, s.seat_id, 'Available'
     FROM event_sessions es
     JOIN seats s ON s.venue_id = es.venue_id
     WHERE es.venue_id = ? AND es.show_date >= CURDATE() AND s.is_active = 1`,
    [venue_id]
  );

  // Sync total_capacity
  await getPool().query(
    `UPDATE venues SET total_capacity = (
       SELECT COUNT(*) FROM seats WHERE venue_id = ? AND is_active = 1
     ) WHERE venue_id = ?`,
    [venue_id, venue_id]
  );

  // Sync total_seats on future sessions
  await getPool().query(
    `UPDATE event_sessions SET total_seats = (
       SELECT COUNT(*) FROM session_seats WHERE session_id = event_sessions.session_id
     ) WHERE venue_id = ? AND show_date >= CURDATE()`,
    [venue_id]
  );
};

const toggleSeat = async (seat_id, owner_id, is_active) => {
  const [check] = await getPool().query(
    `SELECT s.seat_id, s.venue_id FROM seats s
     JOIN venues v ON v.venue_id = s.venue_id
     WHERE s.seat_id = ? AND v.owner_id = ?`,
    [seat_id, owner_id]
  );
  if (!check.length) throw new Error('FORBIDDEN');
  const venue_id = check[0].venue_id;

  await getPool().query(
    `UPDATE seats SET is_active = ? WHERE seat_id = ?`,
    [is_active ? 1 : 0, seat_id]
  );

  if (!is_active) {
    // If deactivating, delete from future sessions ONLY IF status is 'Available'
    await getPool().query(
      `DELETE ss FROM session_seats ss
       JOIN event_sessions es ON es.session_id = ss.session_id
       WHERE ss.seat_id = ? AND es.show_date >= CURDATE() AND ss.status = 'Available'`,
      [seat_id]
    );
  } else {
    // If activating, add to future sessions
    // INSERT IGNORE avoids duplicates if it somehow exists
    await getPool().query(
      `INSERT IGNORE INTO session_seats (session_id, seat_id, status)
       SELECT es.session_id, ?, 'Available'
       FROM event_sessions es
       WHERE es.venue_id = ? AND es.show_date >= CURDATE()`,
      [seat_id, venue_id]
    );
  }

  // Sync total_capacity
  await getPool().query(
    `UPDATE venues SET total_capacity = (
       SELECT COUNT(*) FROM seats WHERE venue_id = ? AND is_active = 1
     ) WHERE venue_id = ?`,
    [venue_id, venue_id]
  );

  // Sync total_seats on future sessions
  await getPool().query(
    `UPDATE event_sessions SET total_seats = (
       SELECT COUNT(*) FROM session_seats WHERE session_id = event_sessions.session_id
     ) WHERE venue_id = ? AND show_date >= CURDATE()`,
    [venue_id]
  );
};

// ── Admin approval ────────────────────────────────────────────────────────────

const findPendingVenues = async () => {
  const [rows] = await getPool().query(
    `SELECT v.*, c.city_name, s.state_name,
            u.full_name AS owner_name, u.email AS owner_email
     FROM venues v
     JOIN cities c ON c.city_id = v.city_id
     JOIN states s ON s.state_id = c.state_id
     LEFT JOIN users u ON u.user_id = v.owner_id
     WHERE v.status = 'Pending'
     ORDER BY v.venue_id DESC`
  );
  return rows;
};

const approveVenue = async (venue_id) => {
  await getPool().query(
    `UPDATE venues SET status = 'Active', is_active = 1 WHERE venue_id = ?`,
    [venue_id]
  );
};

const rejectVenue = async (venue_id) => {
  await getPool().query(
    `UPDATE venues SET status = 'Inactive', is_active = 0 WHERE venue_id = ?`,
    [venue_id]
  );
};

// ── Staff ─────────────────────────────────────────────────────────────────────

const findStaffByOwner = async (owner_id) => {
  const [rows] = await getPool().query(
    `SELECT u.user_id, u.full_name, u.email, u.phone, u.is_active,
            v.venue_name, uv.venue_id
     FROM users u
     LEFT JOIN user_venues uv ON uv.user_id = u.user_id
     LEFT JOIN venues v ON v.venue_id = uv.venue_id
     WHERE u.role_id = (SELECT role_id FROM roles WHERE role_name = 'Venue Staff')
       AND uv.venue_id IN (SELECT venue_id FROM venues WHERE owner_id = ?)
     ORDER BY u.created_at DESC`,
    [owner_id]
  );
  return rows;
};

const findAllCities = async () => {
  const [rows] = await getPool().query(
    `SELECT c.city_id, c.city_name, s.state_name
     FROM cities c
     JOIN states s ON s.state_id = c.state_id
     ORDER BY s.state_name, c.city_name`
  );
  return rows;
};

module.exports = {
  findVenuesByOwner, insertVenue, modifyVenue,
  findSeatsByVenue, insertSeatsForRow, toggleSeat,
  findPendingVenues, approveVenue, rejectVenue,
  findStaffByOwner, findAllCities,
};