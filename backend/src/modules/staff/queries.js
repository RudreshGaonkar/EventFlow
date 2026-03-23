const db = require('../../config/db');

const createStaff = async (full_name, email, hashed_password, role, created_by) => {
  const [result] = await db.query(
    `INSERT INTO users (full_name, email, password, role, created_by)
     VALUES (?, ?, ?, ?, ?)`,
    [full_name, email, hashed_password, role, created_by]
  );
  return result.insertId;
};

const findStaffById = async (id) => {
  const [rows] = await db.query(
    `SELECT id, full_name, email, role, is_active, created_at
     FROM users
     WHERE id = ? AND role IN ('staff', 'scanner')`,
    [id]
  );
  return rows[0] || null;
};

const findAllStaff = async () => {
  const [rows] = await db.query(
    `SELECT id, full_name, email, role, is_active, created_at
     FROM users
     WHERE role IN ('staff', 'scanner')
     ORDER BY created_at DESC`
  );
  return rows;
};

const toggleStaffActive = async (id, is_active) => {
  await db.query(
    `UPDATE users SET is_active = ? WHERE id = ? AND role IN ('staff', 'scanner')`,
    [is_active, id]
  );
};

const updateStaffRole = async (id, role) => {
  await db.query(
    `UPDATE users SET role = ? WHERE id = ? AND role IN ('staff', 'scanner')`,
    [role, id]
  );
};

module.exports = {
  createStaff,
  findStaffById,
  findAllStaff,
  toggleStaffActive,
  updateStaffRole
};
