const db = require('../../config/db');

const createStaffMember = async (full_name, email, password_hash, phone) => {
  // role_id 4 = Venue Staff (from your roles table seed)
  const [result] = await db.query(
    `INSERT INTO users (role_id, full_name, email, password_hash, phone, is_active)
     VALUES (4, ?, ?, ?, ?, TRUE)`,
    [full_name, email, password_hash, phone || null]
  );
  return result.insertId;
};

const findAllStaff = async () => {
  const [rows] = await db.query(
    `SELECT u.user_id, u.full_name, u.email, u.phone, u.is_active, u.created_at,
            r.role_name
     FROM users u
     JOIN roles r ON r.role_id = u.role_id
     WHERE u.role_id = 4
     ORDER BY u.created_at DESC`
  );
  return rows;
};

const findStaffMemberById = async (user_id) => {
  const [rows] = await db.query(
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
  await db.query(
    `UPDATE users SET is_active = ? WHERE user_id = ? AND role_id = 4`,
    [is_active, user_id]
  );
};

module.exports = {
  createStaffMember,
  findAllStaff,
  findStaffMemberById,
  setActiveStatus
};
