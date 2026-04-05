const router = require('express').Router();
const { body, param } = require('express-validator');
const multer = require('multer');
const { protect } = require('../../middleware/authMiddleware');
const { allowRoles } = require('../../middleware/roleMiddleware');
const { validate } = require('../../middleware/validate');
const {
  getEvents, getEvent, addEvent, editEvent, removeEvent,
  getPeople, addPerson, editPerson,
  getCast, addCast, removeCast,
  getSessions, addSession, editSessionMultiplier, editSessionStatus,
  getEventReviews, getSessionReviews, addReview,
  browseSessions, editReview, getMyReviewHandler,
} = require('./service');

// multer stores file temporarily in memory before Cloudinary upload
const upload = multer({ storage: multer.memoryStorage() });

// Browse — Attendee sees sessions filtered by their state
router.get('/browse', protect, browseSessions);

// Parent Events
router.get('/', protect, getEvents);

router.get(
  '/reviews/my',
  protect,
  allowRoles('Attendee'),
  getMyReviewHandler
);

// PATCH /api/events/reviews/:review_id
router.patch(
  '/reviews/:review_id',
  protect,
  allowRoles('Attendee'),
  [
    param('review_id').isInt({ min: 1 }).withMessage('Invalid review ID'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('review_text').optional().trim(),
  ],
  validate,
  editReview
);

router.get(
  '/:event_id',
  protect,
  [param('event_id').isInt({ min: 1 }).withMessage('Invalid event ID')],
  validate,
  getEvent
);

router.post(
  '/',
  protect,
  allowRoles('Event Organizer'),
  upload.single('poster'),
  [
    body('event_type').isIn(['Movie', 'Concert', 'Play', 'Sport', 'Other']).withMessage('Invalid event type'),
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').optional().trim(),
    body('rating').optional().isIn(['G', 'UA', 'A', 'S']).withMessage('Invalid rating'),
    body('duration_mins').optional().isInt({ min: 1 }).withMessage('Invalid duration'),
    body('age_limit').optional().isInt({ min: 0 }).withMessage('Invalid age limit'),
    body('language').optional().trim(),
    body('genre').optional().trim(),
    body('trailer_url').optional().trim().isURL().withMessage('Invalid trailer URL'),
  ],
  validate,
  addEvent
);

router.put(
  '/:event_id',
  protect,
  allowRoles('Event Organizer'),
  upload.single('poster'),
  [
    param('event_id').isInt({ min: 1 }).withMessage('Invalid event ID'),
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').optional().trim(),
    body('rating').optional().isIn(['G', 'UA', 'A', 'S']).withMessage('Invalid rating'),
    body('duration_mins').optional().isInt({ min: 1 }).withMessage('Invalid duration'),
    body('age_limit').optional().isInt({ min: 0 }).withMessage('Invalid age limit'),
    body('language').optional().trim(),
    body('genre').optional().trim(),
    body('trailer_url').optional().trim().isURL().withMessage('Invalid trailer URL'),
  ],
  validate,
  editEvent
);

router.patch(
  '/:event_id/deactivate',
  protect,
  allowRoles('Event Organizer'),
  [param('event_id').isInt({ min: 1 }).withMessage('Invalid event ID')],
  validate,
  removeEvent
);

// People
router.get('/people/all', protect, allowRoles('Event Organizer'), getPeople);

router.post(
  '/people',
  protect,
  allowRoles('Event Organizer'),
  upload.single('photo'),
  [
    body('real_name').trim().notEmpty().withMessage('Name is required'),
    body('bio').optional().trim(),
  ],
  validate,
  addPerson
);

router.put(
  '/people/:person_id',
  protect,
  allowRoles('Event Organizer'),
  upload.single('photo'),
  [
    param('person_id').isInt({ min: 1 }).withMessage('Invalid person ID'),
    body('real_name').trim().notEmpty().withMessage('Name is required'),
    body('bio').optional().trim(),
  ],
  validate,
  editPerson
);

// Cast and Crew
router.get(
  '/:event_id/cast',
  protect,
  [param('event_id').isInt({ min: 1 }).withMessage('Invalid event ID')],
  validate,
  getCast
);

router.post(
  '/:event_id/cast',
  protect,
  allowRoles('Event Organizer'),
  [
    param('event_id').isInt({ min: 1 }).withMessage('Invalid event ID'),
    body('person_id').isInt({ min: 1 }).withMessage('Valid person is required'),
    body('role_type').isIn(['Cast', 'Director', 'Producer', 'Writer', 'Crew']).withMessage('Invalid role type'),
    body('character_name').optional().trim(),
    body('designation').optional().trim(),
    body('billing_order').optional().isInt({ min: 1 }).withMessage('Invalid billing order'),
  ],
  validate,
  addCast
);

router.delete(
  '/cast/:event_person_id',
  protect,
  allowRoles('Event Organizer'),
  [param('event_person_id').isInt({ min: 1 }).withMessage('Invalid ID')],
  validate,
  removeCast
);

// Sessions
router.get(
  '/:event_id/sessions',
  protect,
  [param('event_id').isInt({ min: 1 }).withMessage('Invalid event ID')],
  validate,
  getSessions
);

router.post(
  '/:event_id/sessions',
  protect,
  allowRoles('Event Organizer'),
  [
    param('event_id').isInt({ min: 1 }).withMessage('Invalid event ID'),
    body('venue_id').isInt({ min: 1 }).withMessage('Valid venue is required'),
    body('show_date').isDate().withMessage('Valid date is required'),
    body('show_time').matches(/^\d{2}:\d{2}$/).withMessage('Time must be in HH:MM format'),
    body('demand_multiplier').optional().isFloat({ min: 0.1, max: 10 }).withMessage('Multiplier must be between 0.1 and 10'),
  ],
  validate,
  addSession
);

router.patch(
  '/sessions/:session_id/multiplier',
  protect,
  allowRoles('Event Organizer'),
  [
    param('session_id').isInt({ min: 1 }).withMessage('Invalid session ID'),
    body('demand_multiplier').isFloat({ min: 0.1, max: 10 }).withMessage('Multiplier must be between 0.1 and 10'),
  ],
  validate,
  editSessionMultiplier
);

router.patch(
  '/sessions/:session_id/status',
  protect,
  allowRoles('Event Organizer'),
  [
    param('session_id').isInt({ min: 1 }).withMessage('Invalid session ID'),
    body('status').isIn(['Scheduled', 'Ongoing', 'Cancelled', 'Completed']).withMessage('Invalid status'),
  ],
  validate,
  editSessionStatus
);

// Reviews
router.get(
  '/:event_id/reviews',
  protect,
  [param('event_id').isInt({ min: 1 }).withMessage('Invalid event ID')],
  validate,
  getEventReviews
);

router.get(
  '/sessions/:session_id/reviews',
  protect,
  [param('session_id').isInt({ min: 1 }).withMessage('Invalid session ID')],
  validate,
  getSessionReviews
);

router.post(
  '/reviews',
  protect,
  allowRoles('Attendee'),
  [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('event_id').optional().isInt({ min: 1 }).withMessage('Invalid event ID'),
    body('session_id').optional().isInt({ min: 1 }).withMessage('Invalid session ID'),
    body('review_text').optional().trim(),
  ],
  validate,
  addReview
);

module.exports = router;
