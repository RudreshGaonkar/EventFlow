const { getAllStates, getCitiesByState } = require('../admin/queries');

const getStates = async (req, res) => {
  try {
    const states = await getAllStates();
    res.json({ success: true, data: states });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getCities = async (req, res) => {
  try {
    const { state_id } = req.query;
    if (!state_id) return res.status(400).json({ success: false, message: 'state_id is required' });
    const cities = await getCitiesByState(state_id);
    res.json({ success: true, data: cities });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getStates, getCities };
