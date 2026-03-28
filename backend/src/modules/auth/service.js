const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { findUserByEmail, findUserById, findUserRoles, createUser, updateHomeState } = require('./queries');

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
      user_id:   user.user_id,
      role_id:   user.role_id,
      role_name: user.role_name,
      roles,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user_id:   user.user_id,
        full_name: user.full_name,
        email:     user.email,
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
      sameSite: 'strict'
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

const updateProfile = async (req, res) => {
  try {
    const { home_state_id } = req.body;
    await updateHomeState(req.user.user_id, home_state_id);
    return res.status(200).json({ success: true, message: 'Profile updated successfully' });
  } catch (err) {
    console.error('[Auth] updateProfile error:', err.message);
    return res.status(500).json({ success: false, message: 'Profile update failed' });
  }
};

module.exports = { registerUser, loginUser, logoutUser, getProfile, updateProfile };