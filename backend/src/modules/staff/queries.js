const { getPool } = require('../../config/db');


const createStaffMember = async (full_name, email, password_hash, phone) => {
  const [result] = await getPool().query(
    `INSERT INTO users (role_id, full_name, email, password_hash, phone, is_active)
     VALUES (4, ?, ?, ?, ?, TRUE)`,
    [full_name, email, password_hash, phone || null]
  );
  return result.insertId;
};


const findAllStaff = async () => {
  const [rows] = await getPool().query(`
    SELECT u.user_id, u.full_name, u.email, u.phone, u.is_active, u.created_at,
           v.venue_name, uv.venue_id
    FROM users u
    LEFT JOIN user_venues uv ON uv.user_id = u.user_id
    LEFT JOIN venues v ON v.venue_id = uv.venue_id
    WHERE u.role_id = (SELECT role_id FROM roles WHERE role_name = 'Venue Staff')
    ORDER BY u.created_at DESC
  `);
  return rows;
};


const findStaffMemberById = async (user_id) => {
  const [rows] = await getPool().query(
    `SELECT u.user_id, u.full_name, u.email, u.phone, u.is_active, u.created_at,
            r.role_name
     FROM users u
     JOIN roles r ON r.role_id = u.role_id
     WHERE u.user_id = ? AND u.role_id = 4`,
    [user_id]
  );
  return rows[0] || null;
};


const setActiveStatus = async (user_id, is_active) => {
  await getPool().query(
    `UPDATE users SET is_active = ? WHERE user_id = ? AND role_id = 4`,
    [is_active, user_id]
  );
};


const assignStaffVenue = async (user_id, venue_id) => {
  const [result] = await getPool().query(
    `INSERT INTO user_venues (user_id, venue_id)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE assigned_at = CURRENT_TIMESTAMP`,
    [user_id, venue_id]
  );
  return result;
};


// Replaces checkOrganizerVenue — just confirms the venue exists and is active.
// Staff are venue-scoped, not event-scoped, so no session linkage check needed.
const findVenueById = async (venue_id) => {
  const [rows] = await getPool().query(
    `SELECT venue_id, venue_name, is_active FROM venues WHERE venue_id = ? LIMIT 1`,
    [venue_id]
  );
  return rows[0] || null;
};


// Organizers see staff at venues where they have scheduled sessions.
// Uses user_venues (actual staff assignments), not session-based joins for the staff list.
const findStaffByOrganizerVenues = async (organizer_id) => {
  const [rows] = await getPool().query(`
    SELECT u.user_id, u.full_name, u.email, u.phone, u.is_active, u.created_at,
           v.venue_name, uv.venue_id
    FROM users u
    LEFT JOIN user_venues uv ON uv.user_id = u.user_id
    LEFT JOIN venues v ON v.venue_id = uv.venue_id
    WHERE u.role_id = (SELECT role_id FROM roles WHERE role_name = 'Venue Staff')
      AND uv.venue_id IN (
        SELECT DISTINCT es.venue_id
        FROM event_sessions es
        JOIN parent_events pe ON pe.event_id = es.event_id
        WHERE pe.organizer_id = ?
      )
    ORDER BY u.created_at DESC
  `, [organizer_id]);
  return rows;
};


module.exports = {
  createStaffMember,
  findAllStaff,
  findStaffMemberById,
  setActiveStatus,
  assignStaffVenue,
  findVenueById,             
  findStaffByOrganizerVenues,
};