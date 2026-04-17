const { getPool } = require('../../config/db');

// ── GET /api/venues/rentable ──────────────────────────────────────────────────
// Returns venues that are rentable and NOT blocked by an accepted request
// that overlaps with [start_time, end_time + 5h buffer].
const getRentableVenues = async (start_time, end_time) => {
  const pool = getPool();

  // Build overlap filter only when caller provides a time range
  let overlapFilter = '';
  const params = [];

  if (start_time && end_time) {
    overlapFilter = `
      AND v.venue_id NOT IN (
        SELECT venue_id
        FROM venue_rental_requests
        WHERE status = 'Accepted'
          AND ? < DATE_ADD(end_time, INTERVAL 5 HOUR)
          AND ? > start_time
      )
    `;
    params.push(start_time, end_time);
  }

  const [rows] = await pool.query(
    `SELECT
       v.venue_id, v.venue_name, v.address,
       v.total_capacity, v.is_rentable,
       c.city_id, c.city_name,
       s.state_id, s.state_name,
       u.full_name AS owner_name
     FROM venues v
     JOIN cities c ON c.city_id  = v.city_id
     JOIN states s ON s.state_id = c.state_id
     LEFT JOIN users u ON u.user_id = v.owner_id
     WHERE v.is_rentable = TRUE
       AND v.is_active   = TRUE
       AND v.status      = 'Active'
       ${overlapFilter}
     ORDER BY v.venue_name`,
    params
  );
  return rows;
};

// ── POST /api/rental-requests ─────────────────────────────────────────────────
// Check for overlapping Accepted requests before inserting a new one.
const checkOverlap = async (venue_id, start_time, end_time, exclude_id = null) => {
  const pool = getPool();
  const params = [venue_id, start_time, end_time];
  let excludeClause = '';
  if (exclude_id) {
    excludeClause = ' AND request_id != ?';
    params.push(exclude_id);
  }

  const [[{ cnt }]] = await pool.query(
    `SELECT COUNT(*) AS cnt
     FROM venue_rental_requests
     WHERE venue_id  = ?
       AND status    = 'Accepted'
       AND ? < DATE_ADD(end_time, INTERVAL 5 HOUR)
       AND ? > start_time
       ${excludeClause}`,
    params
  );
  return Number(cnt) > 0;
};

const createRentalRequest = async (organizer_id, venue_id, start_time, end_time, event_name) => {
  const pool = getPool();
  const [result] = await pool.execute(
    `INSERT INTO venue_rental_requests
       (organizer_id, venue_id, start_time, end_time, event_name)
     VALUES (?, ?, ?, ?, ?)`,
    [organizer_id, venue_id, start_time, end_time, event_name || null]
  );
  return result.insertId;
};

// ── GET /api/venue-owner/requests ─────────────────────────────────────────────
const getRequestsForOwner = async (owner_id) => {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT
       vr.request_id, vr.start_time, vr.end_time,
       vr.event_name, vr.status, vr.created_at,
       v.venue_id, v.venue_name,
       u.user_id AS organizer_id, u.full_name AS organizer_name,
       u.email   AS organizer_email
     FROM venue_rental_requests vr
     JOIN venues v ON v.venue_id  = vr.venue_id
     JOIN users  u ON u.user_id   = vr.organizer_id
     WHERE v.owner_id = ?
     ORDER BY vr.created_at DESC`,
    [owner_id]
  );
  return rows;
};

// ── GET /api/organizer/rental-requests ────────────────────────────────────────
const getRequestsForOrganizer = async (organizer_id) => {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT
       vr.request_id, vr.start_time, vr.end_time,
       vr.event_name, vr.status, vr.created_at,
       v.venue_id, v.venue_name, v.address,
       c.city_name, s.state_name,
       u.full_name AS owner_name
     FROM venue_rental_requests vr
     JOIN venues v ON v.venue_id  = vr.venue_id
     JOIN cities c ON c.city_id   = v.city_id
     JOIN states s ON s.state_id  = c.state_id
     LEFT JOIN users u ON u.user_id = v.owner_id
     WHERE vr.organizer_id = ?
     ORDER BY vr.created_at DESC`,
    [organizer_id]
  );
  return rows;
};

// ── PATCH /api/rental-requests/:id/status ────────────────────────────────────
// Verifies ownership before updating status.
const getRequestWithVenueOwner = async (request_id) => {
  const pool = getPool();
  const [[row]] = await pool.execute(
    `SELECT vr.*, v.owner_id
     FROM venue_rental_requests vr
     JOIN venues v ON v.venue_id = vr.venue_id
     WHERE vr.request_id = ?`,
    [request_id]
  );
  return row || null;
};

const updateRequestStatus = async (request_id, status) => {
  const pool = getPool();
  await pool.execute(
    `UPDATE venue_rental_requests SET status = ? WHERE request_id = ?`,
    [status, request_id]
  );
};

module.exports = {
  getRentableVenues,
  checkOverlap,
  createRentalRequest,
  getRequestsForOwner,
  getRequestsForOrganizer,
  getRequestWithVenueOwner,
  updateRequestStatus,
};
