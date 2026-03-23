const bcrypt = require('bcryptjs');
const {
  createStaff,
  findStaffById,
  findAllStaff,
  toggleStaffActive,
  updateStaffRole
} = require('./queries');
const { findByEmail } = require('../auth/queries');

const VALID_STAFF_ROLES = ['staff', 'scanner'];

const addStaff = async (req, res) => {
  const { full_name, email, password, role } = req.body;

  if (!full_name || !email || !password || !role) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (!VALID_STAFF_ROLES.includes(role)) {
    return res.status(400).json({ message: 'Invalid role. Must be staff or scanner' });
  }

  const existing = await findByEmail(email);
  if (existing) {
    return res.status(409).json({ message: 'Email already in use' });
  }

  const hashed = await bcrypt.hash(password, 10);
  const newId = await createStaff(full_name, email, hashed, role, req.user.id);

  return res.status(201).json({ message: 'Staff created', id: newId });
};

const getAllStaff = async (req, res) => {
  const staff = await findAllStaff();
  return res.json(staff);
};

const getStaffById = async (req, res) => {
  const member = await findStaffById(req.params.id);
  if (!member) return res.status(404).json({ message: 'Staff member not found' });
  return res.json(member);
};

const setStaffActive = async (req, res) => {
  const { is_active } = req.body;
  if (typeof is_active !== 'boolean') {
    return res.status(400).json({ message: 'is_active must be a boolean' });
  }

  const member = await findStaffById(req.params.id);
  if (!member) return res.status(404).json({ message: 'Staff member not found' });

  await toggleStaffActive(req.params.id, is_active);
  return res.json({ message: `Staff member ${is_active ? 'activated' : 'deactivated'}` });
};

const changeStaffRole = async (req, res) => {
  const { role } = req.body;

  if (!VALID_STAFF_ROLES.includes(role)) {
    return res.status(400).json({ message: 'Invalid role. Must be staff or scanner' });
  }

  const member = await findStaffById(req.params.id);
  if (!member) return res.status(404).json({ message: 'Staff member not found' });

  await updateStaffRole(req.params.id, role);
  return res.json({ message: 'Staff role updated' });
};

module.exports = { addStaff, getAllStaff, getStaffById, setStaffActive, changeStaffRole };
