const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { findUserByEmail, findUserById, findUserRoles, createUser, updateHomeState } = require('./queries');
const { uploadToCloudinary } = require('../../config/cloudinary');
const pool = require('../../config/db').getPool();

const SALT_ROUNDS = 12;

const registerUser = async (req, res) => {
  try {
    const { full_name, email, password, phone, home_state_id, requested_role } = req.body;

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const userId = await createUser(full_name, email, password_hash, phone, home_state_id, requested_role);

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: { user_id: userId }
    });
  } catch (err) {
    console.error('[Auth] registerUser error:', err.message);
    return res.status(500).json({ success: false, message: 'Registration failed' });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const roles = await findUserRoles(user.user_id);

    const payload = {
      user_id: user.user_id,
      role_id: user.role_id,
      role_name: user.role_name,
      roles,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role_name: user.role_name,
        roles,
      }
    });
  } catch (err) {
    console.error('[Auth] loginUser error:', err.message);
    return res.status(500).json({ success: false, message: 'Login failed' });
  }
};

const logoutUser = async (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    console.error('[Auth] logoutUser error:', err.message);
    return res.status(500).json({ success: false, message: 'Logout failed' });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await findUserById(req.user.user_id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const roles = await findUserRoles(req.user.user_id);

    return res.status(200).json({
      success: true,
      data: { ...user, roles }
    });
  } catch (err) {
    console.error('[Auth] getProfile error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch profile' });
  }
};

const getStates = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT state_id, state_name, state_code FROM states ORDER BY state_name');
    res.json({ success: true, data: rows });
  } catch (e) {
    console.error('ERROR:', e.message);
    res.status(500).json({ success: false, message: 'Could not fetch states' });
  }
};

const updateProfile = async (req, res) => {
  const { fullname, phone, homestateid } = req.body;
  const userid = req.user.user_id;
  const sets = [];
  const vals = [];

  if (fullname !== undefined) { sets.push('full_name = ?'); vals.push(fullname); }
  if (phone !== undefined) { sets.push('phone = ?'); vals.push(phone || null); }
  if (homestateid !== undefined) { sets.push('home_state_id = ?'); vals.push(homestateid || null); }

  if (!sets.length) return res.status(400).json({ success: false, message: 'Nothing to update' });
  vals.push(userid);
  try {
    await pool.execute(`UPDATE users SET ${sets.join(', ')} WHERE user_id = ?`, vals);
    const [[user]] = await pool.execute(
      `SELECT u.user_id, u.full_name, u.email, u.phone, u.home_state_id, u.created_at,
       r.role_name FROM users u JOIN roles r ON r.role_id = u.role_id WHERE u.user_id = ?`,
      [userid]
    );
    res.json({ success: true, data: user });
  } catch (e) {
    console.error('[Auth] updateProfile error:', e.message);
    res.status(500).json({ success: false, message: 'Could not update profile' });
  }
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userid = req.user.user_id;
  try {
    const [[user]] = await pool.execute('SELECT password_hash FROM users WHERE user_id = ?', [userid]);
    const match = await bcrypt.compare(currentPassword, user.passwordhash);
    if (!match) return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    const hash = await bcrypt.hash(newPassword, 12);
    await pool.execute('UPDATE users SET password_hash = ? WHERE user_id = ?', [hash, userid]);
    res.json({ success: true, message: 'Password updated' });
  } catch (e) {
    console.error('ERROR:', e.message);
    res.status(500).json({ success: false, message: 'Could not change password' });
  }
};

const updateAvatar = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  try {
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'avatars', transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }]
    });
    await pool.execute('UPDATE users SET avatarurl = ? WHERE userid = ?', [result.secure_url, req.user.userid]);
    res.json({ success: true, data: { avatarurl: result.secure_url } });
  } catch (e) {
    console.error('ERROR:', e.message);
    res.status(500).json({ success: false, message: 'Avatar upload failed' });
  }
};

const getRoleRequestStatus = async (req, res) => {
  try {
    const [[row]] = await pool.execute(
      `SELECT ur.status, r.role_name FROM user_roles ur
 JOIN roles r ON r.role_id = ur.role_id
 WHERE ur.user_id = ? ORDER BY ur.requested_at DESC LIMIT 1`, [req.user.user_id]);
    res.json({ success: true, data: row || null });
  } catch (e) {
    console.error('ERROR:', e.message);
    res.status(500).json({ success: false, message: 'Could not fetch status' });
  }
};

const requestRole = async (req, res) => {
  const { role } = req.body;
  try {
    const [[roleRow]] = await pool.execute('SELECT role_id FROM roles WHERE role_name = ?', [role]);
    if (!roleRow) return res.status(400).json({ success: false, message: 'Invalid role' });
    await pool.execute(
      `INSERT INTO user_roles (user_id, role_id, status) VALUES (?, ?, 'Pending')
 ON DUPLICATE KEY UPDATE status = 'Pending', requested_at = NOW()`,
      [req.user.user_id, roleRow.roleid]);
    res.json({ success: true, message: 'Role request submitted' });
  } catch (e) {
    console.error('ERROR:', e.message);
    res.status(500).json({ success: false, message: 'Could not request role' });
  }
};


module.exports = {
  registerUser, loginUser, logoutUser, getProfile, updateProfile
  , getStates, updateProfile, changePassword, updateAvatar, getRoleRequestStatus, requestRole
};