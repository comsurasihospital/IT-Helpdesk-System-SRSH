// routes/dashboard.js
const router = require('express').Router();
const ctrl   = require('../controllers/dashboardController');
const { authenticate, authorize } = require('../middleware/auth');
const { asyncHandler }            = require('../middleware/errorHandler');

router.use(authenticate);
router.use(authorize('ADMIN', 'SUPERVISOR'));

router.get('/summary',              asyncHandler(ctrl.getSummary));
router.get('/chart/monthly',        asyncHandler(ctrl.getMonthlyChart));
router.get('/chart/category',       asyncHandler(ctrl.getCategoryChart));
router.get('/chart/department',     asyncHandler(ctrl.getDepartmentChart));
router.get('/chart/department/all', asyncHandler(ctrl.getAllDeptChart));
router.get('/chart/dept-breakdown', asyncHandler(ctrl.getDeptBreakdown));
router.get('/report/sla-by-dept',   asyncHandler(ctrl.getSlaByDept));
router.get('/report/admin-workload',asyncHandler(ctrl.getAdminWorkload));
router.get('/report/mttr',          asyncHandler(ctrl.getMttr));
router.get('/report/aging',         asyncHandler(ctrl.getAgingTickets));

module.exports = router;