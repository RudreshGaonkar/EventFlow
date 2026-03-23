const { validationResult } = require('express-validator');

// This middleware runs after express-validator checks in a route
// If any check failed, it sends back all the errors and stops the request
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => ({
        field:   err.path,
        message: err.msg,
      })),
    });
  }

  next();
};

module.exports = { validate };
