const bcrypt = require('bcryptjs');
const {
  getAllStates, createState, updateState, deleteState,
  getAllCities, getCitiesByState, createCity, updateCity, updateCityMultiplier, deleteCity,
  getAllVenues, getVenuesByCity, createVenue, updateVenue, softDeleteVenue,
  getAllUsers, updateUserRole, addUserRole, removeUserRole, getAllRoles,
  insertUser,
} = require('./queries');

const getStates = async (req, res) => {
  try {
    const states = await getAllStates();
    return res.status(200).json({ success: true, data: states });
  } catch (err) {
    console.error('[Admin] getStates error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch states' });
  }
};

const addState = async (req, res) => {
  try {
    const { state_name, state_code } = req.body;
    const id = await createState(state_name, state_code);
    return res.status(201).json({ success: true, message: 'State created', data: { state_id: id } });
  } catch (err) {
    console.error('[Admin] addState error:', err.message);
    if (err.message.includes('Duplicate')) {
      return res.status(409).json({ success: false, message: 'State code already exists' });
    }
    return res.status(500).json({ success: false, message: 'Could not create state' });
  }
};

const editState = async (req, res) => {
  try {
    const { state_id } = req.params;
    const { state_name, state_code } = req.body;
    await updateState(state_id, state_name, state_code);
    return res.status(200).json({ success: true, message: 'State updated' });
  } catch (err) {
    console.error('[Admin] editState error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not update state' });
  }
};

const removeState = async (req, res) => {
  try {
    const { state_id } = req.params;
    await deleteState(state_id);
    return res.status(200).json({ success: true, message: 'State deleted' });
  } catch (err) {
    console.error('[Admin] removeState error:', err.message);
    if (err.message.includes('foreign key')) {
      return res.status(409).json({ success: false, message: 'Cannot delete — cities exist under this state' });
    }
    return res.status(500).json({ success: false, message: 'Could not delete state' });
  }
};

const getCities = async (req, res) => {
  try {
    const { state_id } = req.query;
    const cities = state_id ? await getCitiesByState(state_id) : await getAllCities();
    return res.status(200).json({ success: true, data: cities });
  } catch (err) {
    console.error('[Admin] getCities error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch cities' });
  }
};

const addCity = async (req, res) => {
  try {
    const { state_id, city_name, city_multiplier } = req.body;
    const id = await createCity(state_id, city_name, city_multiplier);
    return res.status(201).json({ success: true, message: 'City created', data: { city_id: id } });
  } catch (err) {
    console.error('[Admin] addCity error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not create city' });
  }
};

const editCity = async (req, res) => {
  try {
    const { city_id } = req.params;
    const { city_name, city_multiplier } = req.body;
    await updateCity(city_id, city_name, city_multiplier);
    return res.status(200).json({ success: true, message: 'City updated' });
  } catch (err) {
    console.error('[Admin] editCity error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not update city' });
  }
};

const editCityMultiplier = async (req, res) => {
  try {
    const { city_id } = req.params;
    const { city_multiplier } = req.body;
    await updateCityMultiplier(city_id, city_multiplier);
    return res.status(200).json({ success: true, message: 'City multiplier updated' });
  } catch (err) {
    console.error('[Admin] editCityMultiplier error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not update multiplier' });
  }
};

const removeCity = async (req, res) => {
  try {
    const { city_id } = req.params;
    await deleteCity(city_id);
    return res.status(200).json({ success: true, message: 'City deleted' });
  } catch (err) {
    console.error('[Admin] removeCity error:', err.message);
    if (err.message.includes('foreign key')) {
      return res.status(409).json({ success: false, message: 'Cannot delete — venues exist under this city' });
    }
    return res.status(500).json({ success: false, message: 'Could not delete city' });
  }
};

const getVenues = async (req, res) => {
  try {
    const { city_id } = req.query;
    const venues = city_id ? await getVenuesByCity(city_id) : await getAllVenues();
    return res.status(200).json({ success: true, data: venues });
  } catch (err) {
    console.error('[Admin] getVenues error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch venues' });
  }
};

const addVenue = async (req, res) => {
  try {
    const { city_id, venue_name, address, total_capacity } = req.body;
    const id = await createVenue(city_id, venue_name, address, total_capacity);
    return res.status(201).json({ success: true, message: 'Venue created', data: { venue_id: id } });
  } catch (err) {
    console.error('[Admin] addVenue error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not create venue' });
  }
};

const editVenue = async (req, res) => {
  try {
    const { venue_id } = req.params;
    const { venue_name, address, total_capacity } = req.body;
    await updateVenue(venue_id, venue_name, address, total_capacity);
    return res.status(200).json({ success: true, message: 'Venue updated' });
  } catch (err) {
    console.error('[Admin] editVenue error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not update venue' });
  }
};

const deactivateVenue = async (req, res) => {
  try {
    const { venue_id } = req.params;
    await softDeleteVenue(venue_id);
    return res.status(200).json({ success: true, message: 'Venue deactivated' });
  } catch (err) {
    console.error('[Admin] deactivateVenue error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not deactivate venue' });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await getAllUsers();
    return res.status(200).json({ success: true, data: users });
  } catch (err) {
    console.error('[Admin] getUsers error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch users' });
  }
};

const grantRole = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { role_id } = req.body;
    if (parseInt(user_id) === req.user.user_id) {
      return res.status(400).json({ success: false, message: 'You cannot change your own role' });
    }
    await updateUserRole(user_id, role_id);
    await addUserRole(user_id, role_id, req.user.user_id);
    return res.status(200).json({ success: true, message: 'Role granted' });
  } catch (err) {
    console.error('[Admin] grantRole error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not grant role' });
  }
};

const revokeRole = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { role_id } = req.body;
    if (parseInt(user_id) === req.user.user_id) {
      return res.status(400).json({ success: false, message: 'You cannot revoke your own role' });
    }
    await removeUserRole(user_id, role_id);
    return res.status(200).json({ success: true, message: 'Role revoked' });
  } catch (err) {
    console.error('[Admin] revokeRole error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not revoke role' });
  }
};

const getRoles = async (req, res) => {
  try {
    const roles = await getAllRoles();
    return res.status(200).json({ success: true, data: roles });
  } catch (err) {
    console.error('[Admin] getRoles error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch roles' });
  }
};

const addUser = async (req, res) => {
  try {
    const { full_name, email, password, phone, role_id } = req.body;
    const pool = require('../../config/db').getPool();
    const [existing] = await pool.execute(
      'SELECT user_id FROM users WHERE email = ?', [email]
    );
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }
    const password_hash = await bcrypt.hash(password, 12);
    const userId = await insertUser(full_name, email, password_hash, phone, role_id);
    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { user_id: userId },
    });
  } catch (err) {
    console.error('[Admin] addUser error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not create user' });
  }
};

const getRoleRequests = async (req, res) => {
  try {
    const pool = require('../../config/db').getPool();
    const [requests] = await pool.execute(`
      SELECT ur.*, u.full_name, u.email, u.phone, r.role_name
      FROM user_roles ur
      JOIN users u ON u.user_id = ur.user_id
      JOIN roles r ON r.role_id = ur.role_id
      WHERE ur.status = 'Pending'
    `);
    return res.status(200).json({ success: true, data: requests });
  } catch (err) {
    console.error('[Admin] getRoleRequests error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch role requests' });
  }
};

const approveRoleRequest = async (req, res) => {
  try {
    const { id } = req.params; // this is user_role_id
    const pool = require('../../config/db').getPool();
    
    const [rows] = await pool.execute(`
      SELECT ur.user_id, ur.role_id, r.role_name 
      FROM user_roles ur
      JOIN roles r ON r.role_id = ur.role_id
      WHERE ur.user_role_id = ?
    `, [id]);
    
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Request not found' });
    const request = rows[0];

    // Approve the role in user_roles
    await pool.execute(`
      UPDATE user_roles 
      SET status = 'Active', approved_at = NOW(), approved_by = ? 
      WHERE user_role_id = ?
    `, [req.user.user_id, id]);

    // Set as primary role in users table (optional but good for legacy compatibility)
    await pool.execute(`UPDATE users SET role_id = ? WHERE user_id = ?`, [request.role_id, request.user_id]);

    // Important: if Venue Owner, activate the pending venue!
    if (request.role_name === 'Venue Owner') {
      await pool.execute(`
        UPDATE venues 
        SET status = 'Active' 
        WHERE owner_id = ? AND status = 'Pending'
      `, [request.user_id]);
    }

    return res.status(200).json({ success: true, message: 'Role request approved' });
  } catch (err) {
    console.error('[Admin] approveRoleRequest error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not approve request' });
  }
};

const rejectRoleRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const pool = require('../../config/db').getPool();
    
    const [rows] = await pool.execute(`
      SELECT ur.user_id, r.role_name 
      FROM user_roles ur
      JOIN roles r ON r.role_id = ur.role_id
      WHERE ur.user_role_id = ?
    `, [id]);

    await pool.execute(`
      UPDATE user_roles 
      SET status = 'Revoked', rejection_reason = ? 
      WHERE user_role_id = ?
    `, [reason, id]);

    if(rows.length > 0 && rows[0].role_name === 'Venue Owner') {
       await pool.execute(`DELETE FROM venues WHERE owner_id = ? AND status = 'Pending'`, [rows[0].user_id]);
    }

    return res.status(200).json({ success: true, message: 'Role request rejected' });
  } catch (err) {
    console.error('[Admin] rejectRoleRequest error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not reject request' });
  }
};

module.exports = {
  getStates, addState, editState, removeState,
  getCities, addCity, editCity, editCityMultiplier, removeCity,
  getVenues, addVenue, editVenue, deactivateVenue,
  getUsers, grantRole, revokeRole, getRoles,
  addUser,
  getRoleRequests, approveRoleRequest, rejectRoleRequest,
};