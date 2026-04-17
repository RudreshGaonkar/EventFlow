const { getPool } = require('../config/db');

const allowRoles = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
      }

      const pool = getPool();
      const [rows] = await pool.execute(
        `SELECT r.role_name
         FROM user_roles ur
         JOIN roles r ON r.role_id = ur.role_id
         WHERE ur.user_id = ? AND ur.status = 'Active'`,
        [req.user.user_id]
      );

      const activeRoles = rows.map(r => r.role_name);
      const userRoles = activeRoles.length ? activeRoles : [req.user.role_name];

      // Re-attach active roles to the request so subsequent handlers can access them
      req.user.roles = userRoles;

      const hasRole = allowedRoles.some(role => userRoles.includes(role));

      if (!hasRole) {
        return res.status(403).json({
          success: false,
          message: `Access denied — requires one of: ${allowedRoles.join(', ')}`
        });
      }

      next();
    } catch (err) {
      console.error('[RoleMiddleware] DB error:', err.message);
      return res.status(500).json({ success: false, message: 'Authorization error' });
    }
  };
};

module.exports = { allowRoles };