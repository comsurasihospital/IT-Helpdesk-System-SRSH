// routes/users.js
const router = require('express').Router();
const ctrl   = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { asyncHandler }            = require('../middleware/errorHandler');

router.use(authenticate);

// ดึงรายชื่อ Admin (USER ใช้ได้)
router.get('/admins', asyncHandler(ctrl.getAdmins));

// ADMIN & SUPERVISOR เท่านั้น
router.use(authorize('ADMIN', 'SUPERVISOR'));

router.get('/',      asyncHandler(ctrl.getUsers));
router.get('/:id',   asyncHandler(ctrl.getUserById));
router.put('/:id',   asyncHandler(ctrl.updateUser));
router.delete('/:id',asyncHandler(ctrl.deactivateUser));

module.exports = router;