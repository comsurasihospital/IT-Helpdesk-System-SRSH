// routes/reports.js
const router = require('express').Router();
const ctrl   = require('../controllers/dashboardController');
const { authenticate, authorize } = require('../middleware/auth');
const { asyncHandler }            = require('../middleware/errorHandler');

router.use(authenticate);
router.use(authorize('ADMIN', 'SUPERVISOR'));

router.get('/tickets',           asyncHandler(ctrl.getTicketReport));
router.get('/export-xlsx',        asyncHandler(ctrl.exportTicketsXlsx));
router.get('/sla',               asyncHandler(ctrl.getSlaReport));
router.get('/admin-performance', asyncHandler(ctrl.getAdminPerformance));

module.exports = router;