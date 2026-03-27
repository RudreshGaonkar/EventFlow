const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { findUserByEmail, findUserById, createUser, updateHomeState } = require('./queries');

const SALT_ROUNDS = 12;

const registerUser = async (req, res) => {
  try {
    const { full_name, email, password, phone, home_state_id, requested_role } = req.body;


    // Check if email already exists
    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    // Hash password before saving
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

    // Find user by email
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Check if account is active
    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    // Compare password with stored hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Create JWT payload
    const payload = {
      user_id: user.user_id,
      role_id: user.role_id,
      role_name: user.role_name
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

    // Set token in httpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role_name: user.role_name
      }
    });
  } catch (err) {
    console.error('[Auth] loginUser error:', err.message);
    return res.status(500).json({ success: false, message: 'Login failed' });
  }
};

const logoutUser = async (req, res) => {
  try {
    // Clear the cookie by setting it to expire immediately
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
    // req.user.user_id comes from JWT via authMiddleware
    const user = await findUserById(req.user.user_id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({ success: true, data: user });
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
