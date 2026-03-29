const router = require('express').Router();
const { protect } = require('../../middleware/authMiddleware');
const { browseEvents, eventDetail, eventSessions, citiesWithEvents, statesList } = require('./service');

router.get('/events',protect, browseEvents);
router.get('/events/:event_id',protect, eventDetail);
router.get('/events/:event_id/sessions', protect, eventSessions);
router.get('/cities',protect, citiesWithEvents);
router.get('/states', protect,statesList);

module.exports = router;