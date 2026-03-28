const allowRoles = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
      }

      const userRoles = req.user.roles || [req.user.role_name];

      const hasRole = allowedRoles.some(role => userRoles.includes(role));

      if (!hasRole) {
        return res.status(403).json({
          success: false,
          message: `Access denied — requires one of: ${allowedRoles.join(', ')}`
        });
      }

      next();
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Authorization error' });
    }
  };
};

module.exports = { allowRoles };