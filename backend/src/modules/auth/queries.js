const { getPool } = require('../../config/db');

const findUserByEmail = async (email) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT user_id, role_id, role_name, full_name, email, password_hash, is_active FROM users JOIN roles USING (role_id) WHERE email = ?',
      [email]
    );
    return rows[0] || null;
  } catch (err) {
    throw new Error('DB error in findUserByEmail: ' + err.message);
  }
};

const findUserById = async (userId) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT user_id, role_id, role_name, full_name, email, phone, home_state_id, is_active, created_at FROM users JOIN roles USING (role_id) WHERE user_id = ?',
      [userId]
    );
    return rows[0] || null;
  } catch (err) {
    throw new Error('DB error in findUserById: ' + err.message);
  }
};

const createUser = async (full_name, email, password_hash, phone, home_state_id, requested_role) => {
  try {
    const pool = getPool();
    const [result] = await pool.execute(
      'INSERT INTO users (role_id, full_name, email, password_hash, phone, home_state_id, requested_role) VALUES (3, ?, ?, ?, ?, ?, ?)',
      [full_name, email, password_hash, phone || null, home_state_id || null, requested_role || 'Attendee']
    );
    return result.insertId;
  } catch (err) {
    throw new Error('DB error in createUser: ' + err.message);
  }
};

const updateHomeState = async (userId, home_state_id) => {
  try {
    const pool = getPool();
    await pool.execute(
      'UPDATE users SET home_state_id = ? WHERE user_id = ?',
      [home_state_id, userId]
    );
  } catch (err) {
    throw new Error('DB error in updateHomeState: ' + err.message);
  }
};

module.exports = { findUserByEmail, findUserById, createUser, updateHomeState };
