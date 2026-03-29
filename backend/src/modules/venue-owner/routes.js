const router = require('express').Router();
const { protect }     = require('../../middleware/authMiddleware');
const { allowRoles }  = require('../../middleware/roleMiddleware');
const {
  getMyVenues, createVenue, updateVenue,
  getSeats, addSeats, patchSeat,
  getMyStaff,
  getPendingVenues, approvePendingVenue, rejectPendingVenue,
  getCities,
} = require('./service');

const owner = [protect, allowRoles('Venue Owner')];
const admin = [protect, allowRoles('System Admin')];

// Venues
router.get  ('/my-venues',...owner, getMyVenues);
router.post ('/my-venues',...owner, createVenue);
router.put  ('/my-venues/:venue_id',    ...owner, updateVenue);

// Seats
router.get  ('/my-venues/:venue_id/seats',...owner, getSeats);
router.post ('/my-venues/:venue_id/seats',...owner, addSeats);
router.patch('/my-venues/seats/:seat_id',...owner, patchSeat);

// Staff
router.get  ('/my-staff',...owner, getMyStaff);

// Cities
router.get  ('/cities',...owner, getCities);

// Admin approval
router.get   ('/pending',...admin, getPendingVenues);
router.patch ('/pending/:venue_id/approve',     ...admin, approvePendingVenue);
router.patch ('/pending/:venue_id/reject',      ...admin, rejectPendingVenue);

module.exports = router;