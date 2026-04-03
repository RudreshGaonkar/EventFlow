const express = require('express');
const multer  = require('multer');
const { protect } = require('../../middleware/authMiddleware');
const { allowRoles } = require('../../middleware/roleMiddleware');
const svc = require('./service');
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
router.use(protect, allowRoles('Event Organizer'));

// Events
router.get   ('/events', svc.getMyEvents);
router.post  ('/events', upload.fields([{ name: 'poster', maxCount: 1 }, { name: 'brochure', maxCount: 1 }]), svc.createEvent);   // ← CHANGED
router.put   ('/events/:event_id', upload.fields([{ name: 'poster', maxCount: 1 }, { name: 'brochure', maxCount: 1 }]), svc.updateEvent);  // ← CHANGED
router.delete('/events/:event_id', svc.deactivateEvent);

// Sessions
router.get   ('/events/:event_id/sessions', svc.getSessions);
router.post  ('/events/:event_id/sessions', svc.createSession);
router.patch ('/sessions/:session_id/status', svc.updateStatus);
router.patch ('/sessions/:session_id/multiplier', svc.updateMultiplier);

// Venues
router.get('/venues', svc.getVenues);

// People
router.get ('/people', svc.getPeople);
router.post('/people', upload.single('photo'), svc.createPerson);
router.put ('/people/:person_id', upload.single('photo'), svc.updatePerson);

// Cast
router.get   ('/events/:event_id/cast', svc.getCast);
router.post  ('/events/:event_id/cast', svc.addCast);
router.delete('/cast/:event_person_id', svc.removeCast);

module.exports = router;