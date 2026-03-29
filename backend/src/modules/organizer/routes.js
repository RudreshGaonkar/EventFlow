const express = require('express');
const multer  = require('multer');
const { protect } = require('../../middleware/authMiddleware');
const { allowRoles } = require('../../middleware/roleMiddleware');
const svc = require('./service');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); 

router.use(protect, allowRoles('Event Organizer'));

// Events
router.get   ('/events',svc.getMyEvents);
router.post  ('/events',upload.single('poster'), svc.createEvent);
router.put   ('/events/:event_id',    upload.single('poster'), svc.updateEvent);   
router.delete('/events/:event_id',    svc.deactivateEvent);

// Sessions
router.get   ('/events/:event_id/sessions',svc.getSessions);
router.post  ('/events/:event_id/sessions',svc.createSession);
router.patch ('/sessions/:session_id/status',svc.updateStatus);
router.patch ('/sessions/:session_id/multiplier',    svc.updateMultiplier);

// Venues
router.get('/venues', svc.getVenues);

// People
router.get  ('/people',svc.getPeople);
router.post ('/people',upload.single('photo'), svc.createPerson);
router.put  ('/people/:person_id', upload.single('photo'), svc.updatePerson);

// Cast
router.get   ('/events/:event_id/cast',svc.getCast);
router.post  ('/events/:event_id/cast',svc.addCast);
router.delete('/cast/:event_person_id',svc.removeCast);

module.exports = router;

// const router = require('express').Router();
// const multer = require('multer');
// const { protect } = require('../../middleware/authMiddleware');
// const { allowRoles } = require('../../middleware/roleMiddleware');
// const {
//   getMyEvents, createEvent, updateEvent, deactivateEvent,
//   getSessions, createSession, updateStatus, updateMultiplier,
//   getPeople, createPerson, updatePerson,
//   getCast, addCast, removeCast,
//   getVenues, 
// } = require('./service');

// const upload = multer({ storage: multer.memoryStorage() });
// const org    = [protect, allowRoles('Event Organizer')];

// // Events
// router.get   ('/events',...org,getMyEvents);
// router.post  ('/events',...org, upload.single('poster'), createEvent);
// router.put   ('/events/:event_id',...org, upload.single('poster'), updateEvent);
// router.delete('/events/:event_id',...org,deactivateEvent);

// // Sessions
// router.get   ('/events/:event_id/sessions',...org, getSessions);
// router.post  ('/events/:event_id/sessions',...org, createSession);
// router.patch ('/sessions/:session_id/status',...org, updateStatus);
// router.patch ('/sessions/:session_id/multiplier',...org, updateMultiplier);
// router.get('/venues', ...org, getVenues);

// // People
// router.get   ('/people',...org,getPeople);
// router.post  ('/people',...org, upload.single('photo'),  createPerson);
// router.put   ('/people/:person_id',   ...org, upload.single('photo'),  updatePerson);

// // Cast
// router.get   ('/events/:event_id/cast',...org, getCast);
// router.post  ('/events/:event_id/cast',...org, addCast);
// router.delete('/cast/:event_person_id',...org, removeCast);

// module.exports = router;