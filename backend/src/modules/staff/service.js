const bcryptjs = require('bcryptjs');
const { findUserByEmail } = require('../auth/queries');
const {
  createStaffMember,
  findAllStaff,
  findStaffMemberById,
  setActiveStatus,
  assignStaffVenue,
  findVenueById,
  findStaffByOrganizerVenues,
  findSessionsByUserVenues,
} = require('./queries');


// ── Add Staff ─────────────────────────────────────────────────────────────────
const addStaff = async (req, res) => {
  try {
    const { full_name, email, password, phone, venue_id } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'full_name, email and password are required',
      });
    }

    // Organisers must provide a venue — but we only check it EXISTS & is active,
    // NOT whether it has their sessions. Staff are venue-scoped, not event-scoped.
    if (req.user.role_name === 'Event Organizer') {
      if (!venue_id) {
        return res.status(400).json({
          success: false,
          message: 'Organizers must assign a venue when creating staff',
        });
      }
      const venue = await findVenueById(venue_id);
      if (!venue) {
        return res.status(404).json({ success: false, message: 'Venue not found' });
      }
      if (!venue.is_active) {
        return res.status(400).json({ success: false, message: 'Venue is inactive' });
      }
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already in use' });
    }

    const password_hash = await bcryptjs.hash(password, 12);
    const user_id = await createStaffMember(full_name, email, password_hash, phone);

    if (venue_id) {
      await assignStaffVenue(user_id, venue_id);
    }

    return res.status(201).json({
      success: true,
      message: 'Venue Staff account created',
      data: { user_id },
    });
  } catch (err) {
    console.error('[Staff] addStaff error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not create staff member' });
  }
};


// ── Get All Staff ─────────────────────────────────────────────────────────────
const getAllStaff = async (req, res) => {
  try {
    // FIX: [] is truthy — check length, not just existence
    const userRoles = req.user.roles?.length ? req.user.roles : [req.user.role_name];

    const staff = userRoles.includes('System Admin')
      ? await findAllStaff()
      : await findStaffByOrganizerVenues(req.user.user_id);

    return res.status(200).json({ success: true, data: staff });
  } catch (err) {
    console.error('[Staff] getAllStaff error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch staff' });
  }
};


// ── Get Staff By ID ───────────────────────────────────────────────────────────
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


// ── Toggle Active ─────────────────────────────────────────────────────────────
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
      message: `Staff member ${is_active ? 'activated' : 'deactivated'}`,
    });
  } catch (err) {
    console.error('[Staff] toggleActive error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not update status' });
  }
};


// ── Assign Venue ──────────────────────────────────────────────────────────────
const assignVenue = async (req, res) => {
  try {
    const { venue_id } = req.body;

    const member = await findStaffMemberById(req.params.user_id);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    const venue = await findVenueById(venue_id);
    if (!venue) {
      return res.status(404).json({ success: false, message: 'Venue not found' });
    }

    await assignStaffVenue(req.params.user_id, venue_id);
    return res.status(200).json({ success: true, message: 'Venue assigned' });
  } catch (err) {
    console.error('[Staff] assignVenue error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not assign venue' });
  }
};


// ── My Sessions (for logged-in Staff) ───────────────────────────────────────
const getMySessions = async (req, res) => {
  try {
    const sessions = await findSessionsByUserVenues(req.user.user_id);
    return res.status(200).json({ success: true, data: sessions });
  } catch (err) {
    console.error('[Staff] getMySessions error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch sessions' });
  }
};


module.exports = { addStaff, getAllStaff, getStaffById, toggleActive, assignVenue, getMySessions };