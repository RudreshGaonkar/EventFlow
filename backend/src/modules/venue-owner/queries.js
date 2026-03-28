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
    `INSERT INTO venues (city_id, owner_id, venue_name, address, total_capacity, status, is_active)
     VALUES (?, ?, ?, ?, ?, 'Pending', 0)`,
    [fields.city_id, owner_id, fields.venue_name, fields.address || null, fields.total_capacity]
  );
  return r.insertId;
};

const modifyVenue = async (venue_id, owner_id, fields) => {
  const [check] = await getPool().query(
    `SELECT venue_id FROM venues WHERE venue_id = ? AND owner_id = ?`,
    [venue_id, owner_id]
  );
  if (!check.length) throw new Error('FORBIDDEN');

  const allowed = ['venue_name', 'address', 'total_capacity', 'city_id'];
  const cols = [], vals = [];
  for (const k of allowed) {
    if (fields[k] !== undefined) { cols.push(`${k} = ?`); vals.push(fields[k]); }
  }
  if (!cols.length) return;
  vals.push(venue_id);
  await getPool().query(`UPDATE venues SET ${cols.join(', ')} WHERE venue_id = ?`, vals);
};

// ── Admin approval queries ────────────────────────────────────────────────────

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

// ── Staff for venue owner ─────────────────────────────────────────────────────

const findStaffByOwner = async (owner_id) => {
  const [rows] = await getPool().query(
    `SELECT u.user_id, u.full_name, u.email, u.phone, u.is_active,
            v.venue_name, uv.venue_id
     FROM users u
     LEFT JOIN user_venues uv ON uv.user_id = u.user_id
     LEFT JOIN venues v ON v.venue_id = uv.venue_id
     WHERE u.role_id = (SELECT role_id FROM roles WHERE role_name = 'Venue Staff')
       AND uv.venue_id IN (
         SELECT venue_id FROM venues WHERE owner_id = ?
       )
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
  findPendingVenues, approveVenue, rejectVenue,
  findStaffByOwner, findAllCities,
};