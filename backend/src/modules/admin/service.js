const {
  getAllStates, createState, updateState, deleteState,
  getAllCities, getCitiesByState, createCity, updateCity, updateCityMultiplier, deleteCity,
  getAllVenues, getVenuesByCity, createVenue, updateVenue, softDeleteVenue,
  getAllUsers, updateUserRole, getAllRoles
} = require('./queries');

// ── States ────────────────────────────────────────────────────────────────────

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

// ── Cities ────────────────────────────────────────────────────────────────────

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

// ── Venues ────────────────────────────────────────────────────────────────────

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

// ── Users / Role Management ───────────────────────────────────────────────────

const getUsers = async (req, res) => {
  try {
    const users = await getAllUsers();
    return res.status(200).json({ success: true, data: users });
  } catch (err) {
    console.error('[Admin] getUsers error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch users' });
  }
};

const changeUserRole = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { role_id } = req.body;

    // Prevent admin from changing their own role accidentally
    if (parseInt(user_id) === req.user.user_id) {
      return res.status(400).json({ success: false, message: 'You cannot change your own role' });
    }

    await updateUserRole(user_id, role_id);
    return res.status(200).json({ success: true, message: 'User role updated' });
  } catch (err) {
    console.error('[Admin] changeUserRole error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not update user role' });
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

module.exports = {
  getStates, addState, editState, removeState,
  getCities, addCity, editCity, editCityMultiplier, removeCity,
  getVenues, addVenue, editVenue, deactivateVenue,
  getUsers, changeUserRole, getRoles
};
