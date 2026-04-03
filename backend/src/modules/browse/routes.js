const router = require('express').Router();
const { protect, optionalAuth } = require('../../middleware/authMiddleware');
const { browseEvents, eventDetail, eventSessions, citiesWithEvents, statesList } = require('./service');

router.get('/events',protect, browseEvents);
router.get('/events/:event_id', eventDetail);
router.get('/events/:event_id/sessions', eventSessions);
router.get('/cities',protect, citiesWithEvents);
router.get('/states', protect,statesList);

module.exports = router;