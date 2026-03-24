const bcryptjs = require('bcryptjs');
const { findUserByEmail } = require('../auth/queries');
const {
  createStaffMember,
  findAllStaff,
  findStaffMemberById,
  setActiveStatus
} = require('./queries');

const addStaff = async (req, res) => {
  try {
    const { full_name, email, password, phone } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ success: false, message: 'full_name, email and password are required' });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already in use' });
    }

    const password_hash = await bcryptjs.hash(password, 12);
    const user_id = await createStaffMember(full_name, email, password_hash, phone);

    return res.status(201).json({
      success: true,
      message: 'Venue Staff account created',
      data: { user_id }
    });
  } catch (err) {
    console.error('[Staff] addStaff error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not create staff member' });
  }
};

const getAllStaff = async (req, res) => {
  try {
    const staff = await findAllStaff();
    return res.status(200).json({ success: true, data: staff });
  } catch (err) {
    console.error('[Staff] getAllStaff error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch staff' });
  }
};

const getStaffById = async (req, res) => {
  try {
    const member = await findStaffMemberById(req.params.user_id);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }
    return res.status(200).json({ success: true, data: member });
  } catch (err) {
    console.error('[Staff] getStaffById error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch staff member' });
  }
};

const toggleActive = async (req, res) => {
  try {
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ success: false, message: 'is_active must be a boolean' });
    }

    const member = await findStaffMemberById(req.params.user_id);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    await setActiveStatus(req.params.user_id, is_active);

    return res.status(200).json({
      success: true,
      message: `Staff member ${is_active ? 'activated' : 'deactivated'}`
    });
  } catch (err) {
    console.error('[Staff] toggleActive error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not update status' });
  }
};

module.exports = { addStaff, getAllStaff, getStaffById, toggleActive };
