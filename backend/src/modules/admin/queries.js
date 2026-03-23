const { getPool } = require('../../config/db');

// ── States ──────────────────────────────────────────────────────────────────

const getAllStates = async () => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute('SELECT * FROM states ORDER BY state_name ASC');
    return rows;
  } catch (err) {
    throw new Error('DB error in getAllStates: ' + err.message);
  }
};

const createState = async (state_name, state_code) => {
  try {
    const pool = getPool();
    const [result] = await pool.execute(
      'INSERT INTO states (state_name, state_code) VALUES (?, ?)',
      [state_name, state_code.toUpperCase()]
    );
    return result.insertId;
  } catch (err) {
    throw new Error('DB error in createState: ' + err.message);
  }
};

const updateState = async (state_id, state_name, state_code) => {
  try {
    const pool = getPool();
    await pool.execute(
      'UPDATE states SET state_name = ?, state_code = ? WHERE state_id = ?',
      [state_name, state_code.toUpperCase(), state_id]
    );
  } catch (err) {
    throw new Error('DB error in updateState: ' + err.message);
  }
};

const deleteState = async (state_id) => {
  try {
    const pool = getPool();
    await pool.execute('DELETE FROM states WHERE state_id = ?', [state_id]);
  } catch (err) {
    throw new Error('DB error in deleteState: ' + err.message);
  }
};

// ── Cities ───────────────────────────────────────────────────────────────────

const getCitiesByState = async (state_id) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT * FROM cities WHERE state_id = ? ORDER BY city_name ASC',
      [state_id]
    );
    return rows;
  } catch (err) {
    throw new Error('DB error in getCitiesByState: ' + err.message);
  }
};

const getAllCities = async () => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT cities.*, states.state_name FROM cities JOIN states USING (state_id) ORDER BY state_name ASC, city_name ASC'
    );
    return rows;
  } catch (err) {
    throw new Error('DB error in getAllCities: ' + err.message);
  }
};

const createCity = async (state_id, city_name, city_multiplier) => {
  try {
    const pool = getPool();
    const [result] = await pool.execute(
      'INSERT INTO cities (state_id, city_name, city_multiplier) VALUES (?, ?, ?)',
      [state_id, city_name, city_multiplier || 1.00]
    );
    return result.insertId;
  } catch (err) {
    throw new Error('DB error in createCity: ' + err.message);
  }
};

const updateCity = async (city_id, city_name, city_multiplier) => {
  try {
    const pool = getPool();
    await pool.execute(
      'UPDATE cities SET city_name = ?, city_multiplier = ? WHERE city_id = ?',
      [city_name, city_multiplier, city_id]
    );
  } catch (err) {
    throw new Error('DB error in updateCity: ' + err.message);
  }
};

const updateCityMultiplier = async (city_id, city_multiplier) => {
  try {
    const pool = getPool();
    await pool.execute(
      'UPDATE cities SET city_multiplier = ? WHERE city_id = ?',
      [city_multiplier, city_id]
    );
  } catch (err) {
    throw new Error('DB error in updateCityMultiplier: ' + err.message);
  }
};

const deleteCity = async (city_id) => {
  try {
    const pool = getPool();
    await pool.execute('DELETE FROM cities WHERE city_id = ?', [city_id]);
  } catch (err) {
    throw new Error('DB error in deleteCity: ' + err.message);
  }
};

// ── Venues ───────────────────────────────────────────────────────────────────

const getAllVenues = async () => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT venues.*, cities.city_name, states.state_name FROM venues JOIN cities USING (city_id) JOIN states USING (state_id) ORDER BY state_name ASC, city_name ASC, venue_name ASC'
    );
    return rows;
  } catch (err) {
    throw new Error('DB error in getAllVenues: ' + err.message);
  }
};

const getVenuesByCity = async (city_id) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT * FROM venues WHERE city_id = ? ORDER BY venue_name ASC',
      [city_id]
    );
    return rows;
  } catch (err) {
    throw new Error('DB error in getVenuesByCity: ' + err.message);
  }
};

const createVenue = async (city_id, venue_name, address, total_capacity) => {
  try {
    const pool = getPool();
    const [result] = await pool.execute(
      'INSERT INTO venues (city_id, venue_name, address, total_capacity) VALUES (?, ?, ?, ?)',
      [city_id, venue_name, address || null, total_capacity]
    );
    return result.insertId;
  } catch (err) {
    throw new Error('DB error in createVenue: ' + err.message);
  }
};

const updateVenue = async (venue_id, venue_name, address, total_capacity) => {
  try {
    const pool = getPool();
    await pool.execute(
      'UPDATE venues SET venue_name = ?, address = ?, total_capacity = ? WHERE venue_id = ?',
      [venue_name, address || null, total_capacity, venue_id]
    );
  } catch (err) {
    throw new Error('DB error in updateVenue: ' + err.message);
  }
};

const softDeleteVenue = async (venue_id) => {
  try {
    const pool = getPool();
    await pool.execute(
      'UPDATE venues SET is_active = FALSE WHERE venue_id = ?',
      [venue_id]
    );
  } catch (err) {
    throw new Error('DB error in softDeleteVenue: ' + err.message);
  }
};

// ── Users / Role Management ──────────────────────────────────────────────────

const getAllUsers = async () => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT user_id, full_name, email, phone, role_name, is_active, created_at FROM users JOIN roles USING (role_id) ORDER BY created_at DESC'
    );
    return rows;
  } catch (err) {
    throw new Error('DB error in getAllUsers: ' + err.message);
  }
};

const updateUserRole = async (user_id, role_id) => {
  try {
    const pool = getPool();
    await pool.execute(
      'UPDATE users SET role_id = ? WHERE user_id = ?',
      [role_id, user_id]
    );
  } catch (err) {
    throw new Error('DB error in updateUserRole: ' + err.message);
  }
};

const getAllRoles = async () => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute('SELECT * FROM roles ORDER BY role_id ASC');
    return rows;
  } catch (err) {
    throw new Error('DB error in getAllRoles: ' + err.message);
  }
};

module.exports = {
  getAllStates, createState, updateState, deleteState,
  getAllCities, getCitiesByState, createCity, updateCity, updateCityMultiplier, deleteCity,
  getAllVenues, getVenuesByCity, createVenue, updateVenue, softDeleteVenue,
  getAllUsers, updateUserRole, getAllRoles
};
