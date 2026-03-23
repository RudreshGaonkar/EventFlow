const router = require('express').Router();
const { protect } = require('../../middleware/authMiddleware');
const { allowRoles } = require('../../middleware/roleMiddleware');
const {
  addStaff,
  getAllStaff,
  getStaffById,
  setStaffActive,
  changeStaffRole
} = require('./service');

// All staff routes are System Admin only
router.use(protect, allowRoles('System Admin'));

router.post('/',addStaff);
router.get('/',getAllStaff);
router.get('/:id',getStaffById);
router.patch('/:id/active', setStaffActive);
router.patch('/:id/role',changeStaffRole);

module.exports = router;
