const router = require('express').Router();
const { body, param } = require('express-validator');
const { protect } = require('../../middleware/authMiddleware');
const { allowRoles } = require('../../middleware/roleMiddleware');
const { validate } = require('../../middleware/validate');
const {
  getStates, addState, editState, removeState,
  getCities, addCity, editCity, editCityMultiplier, removeCity,
  getVenues, addVenue, editVenue, deactivateVenue,
  getUsers, changeUserRole, getRoles
} = require('./service');

// All admin routes require login + System Admin role
router.use(protect);
router.use(allowRoles('System Admin'));

// ── States 

router.get('/states', getStates);

router.post(
  '/states',
  [
    body('state_name').trim().notEmpty().withMessage('State name is required'),
    body('state_code').trim().isLength({ min: 2, max: 3 }).withMessage('State code must be 2-3 characters'),
  ],
  validate,
  addState
);

router.put(
  '/states/:state_id',
  [
    param('state_id').isInt({ min: 1 }).withMessage('Invalid state ID'),
    body('state_name').trim().notEmpty().withMessage('State name is required'),
    body('state_code').trim().isLength({ min: 2, max: 3 }).withMessage('State code must be 2-3 characters'),
  ],
  validate,
  editState
);

router.delete(
  '/states/:state_id',
  [
    param('state_id').isInt({ min: 1 }).withMessage('Invalid state ID'),
  ],
  validate,
  removeState
);

// ── Cities

router.get('/cities', getCities);

router.post(
  '/cities',
  [
    body('state_id').isInt({ min: 1 }).withMessage('Valid state is required'),
    body('city_name').trim().notEmpty().withMessage('City name is required'),
    body('city_multiplier').optional().isFloat({ min: 0.1, max: 10 }).withMessage('Multiplier must be between 0.1 and 10'),
  ],
  validate,
  addCity
);

router.put(
  '/cities/:city_id',
  [
    param('city_id').isInt({ min: 1 }).withMessage('Invalid city ID'),
    body('city_name').trim().notEmpty().withMessage('City name is required'),
    body('city_multiplier').isFloat({ min: 0.1, max: 10 }).withMessage('Multiplier must be between 0.1 and 10'),
  ],
  validate,
  editCity
);

router.patch(
  '/cities/:city_id/multiplier',
  [
    param('city_id').isInt({ min: 1 }).withMessage('Invalid city ID'),
    body('city_multiplier').isFloat({ min: 0.1, max: 10 }).withMessage('Multiplier must be between 0.1 and 10'),
  ],
  validate,
  editCityMultiplier
);

router.delete(
  '/cities/:city_id',
  [
    param('city_id').isInt({ min: 1 }).withMessage('Invalid city ID'),
  ],
  validate,
  removeCity
);

// ── Venues

router.get('/venues', getVenues);

router.post(
  '/venues',
  [
    body('city_id').isInt({ min: 1 }).withMessage('Valid city is required'),
    body('venue_name').trim().notEmpty().withMessage('Venue name is required'),
    body('address').optional().trim(),
    body('total_capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
  ],
  validate,
  addVenue
);

router.put(
  '/venues/:venue_id',
  [
    param('venue_id').isInt({ min: 1 }).withMessage('Invalid venue ID'),
    body('venue_name').trim().notEmpty().withMessage('Venue name is required'),
    body('address').optional().trim(),
    body('total_capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
  ],
  validate,
  editVenue
);

router.patch(
  '/venues/:venue_id/deactivate',
  [
    param('venue_id').isInt({ min: 1 }).withMessage('Invalid venue ID'),
  ],
  validate,
  deactivateVenue
);

// ── Users / Role Management 

router.get('/users', getUsers);

router.get('/roles', getRoles);

router.patch(
  '/users/:user_id/role',
  [
    param('user_id').isInt({ min: 1 }).withMessage('Invalid user ID'),
    body('role_id').isInt({ min: 1, max: 4 }).withMessage('Valid role is required'),
  ],
  validate,
  changeUserRole
);

module.exports = router;
