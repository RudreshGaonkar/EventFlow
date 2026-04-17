const router = require('express').Router();
const { protect } = require('../../middleware/authMiddleware');
const { getStates, getCities } = require('./service');

// Authenticated users can fetch locations
router.get('/states', protect, getStates);
router.get('/cities', protect, getCities);

module.exports = router;
