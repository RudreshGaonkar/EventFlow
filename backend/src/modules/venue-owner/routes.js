const router = require('express').Router();
const { protect } = require('../../middleware/authMiddleware');
const { allowRoles } = require('../../middleware/roleMiddleware');
const {
  getMyVenues, createVenue, updateVenue, getMyStaff,
  getPendingVenues, approvePendingVenue, rejectPendingVenue, getCities,
} = require('./service');

const owner = [protect, allowRoles('Venue Owner')];
const admin = [protect, allowRoles('System Admin')];

// Venue Owner
router.get   ('/my-venues',...owner, getMyVenues);
router.post  ('/my-venues',...owner, createVenue);
router.put   ('/my-venues/:venue_id',...owner, updateVenue);
router.get   ('/my-staff',...owner, getMyStaff);

// Admin approval
router.get   ('/pending',                ...admin, getPendingVenues);
router.patch ('/pending/:venue_id/approve', ...admin, approvePendingVenue);
router.patch ('/pending/:venue_id/reject',  ...admin, rejectPendingVenue);
router.get('/cities', protect, allowRoles('Venue Owner'), getCities);

module.exports = router;