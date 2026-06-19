// routes/dashboard.js
const router = require('express').Router();
const ctrl   = require('../controllers/dashboardController');
const { authenticate, authorize } = require('../middleware/auth');
const { asyncHandler }            = require('../middleware/errorHandler');

// ─── Public routes (ไม่ต้อง login) ───────────────────────────────
// เข้าได้ทุกคน — สำหรับ public dashboard link และ user ในแอพ
router.get('/public/summary',                  asyncHandler(ctrl.getSummary));
router.get('/public/chart/monthly',            asyncHandler(ctrl.getMonthlyChart));
router.get('/public/chart/category',           asyncHandler(ctrl.getCategoryChart));
router.get('/public/chart/department',         asyncHandler(ctrl.getDepartmentChart));
router.get('/public/chart/dept-breakdown',     asyncHandler(ctrl.getDeptBreakdown));
router.get('/public/report/sla-by-dept',       asyncHandler(ctrl.getSlaByDept));
router.get('/public/report/sla-by-category',   asyncHandler(ctrl.getSlaByCategory));
router.get('/public/report/sla-monthly-trend', asyncHandler(ctrl.getSlaMonthlyTrend));
router.get('/public/report/aging',             asyncHandler(ctrl.getAgingTickets));
router.get('/public/report/admin-workload',    asyncHandler(ctrl.getAdminWorkload));

// ─── Protected routes (ต้อง login + ADMIN/SUPERVISOR) ────────────
router.use(authenticate);
router.use(authorize('ADMIN', 'SUPERVISOR'));

router.get('/summary',                         asyncHandler(ctrl.getSummary));
router.get('/chart/monthly',                   asyncHandler(ctrl.getMonthlyChart));
router.get('/chart/category',                  asyncHandler(ctrl.getCategoryChart));
router.get('/chart/department',                asyncHandler(ctrl.getDepartmentChart));
router.get('/chart/department/all',            asyncHandler(ctrl.getAllDeptChart));
router.get('/chart/dept-breakdown',            asyncHandler(ctrl.getDeptBreakdown));
router.get('/report/sla-by-dept',              asyncHandler(ctrl.getSlaByDept));
router.get('/report/sla-by-category',          asyncHandler(ctrl.getSlaByCategory));
router.get('/report/sla-monthly-trend',        asyncHandler(ctrl.getSlaMonthlyTrend));
router.get('/report/admin-workload',           asyncHandler(ctrl.getAdminWorkload));
router.get('/report/mttr',                     asyncHandler(ctrl.getMttr));
router.get('/report/aging',                    asyncHandler(ctrl.getAgingTickets));

module.exports = router;