// routes/auth.js
const router     = require('express').Router();
const ctrl       = require('../controllers/authController');
const { authenticate }     = require('../middleware/auth');
const { rules, validate }  = require('../middleware/validate');
const { asyncHandler }     = require('../middleware/errorHandler');

// Public routes
router.post('/line-login', rules.lineLogin,  validate, asyncHandler(ctrl.lineLogin));
router.post('/register',   rules.register,   validate, asyncHandler(ctrl.register));
router.get('/prefixes',    asyncHandler(ctrl.getPrefixes));
router.get('/departments',                            asyncHandler(ctrl.getDepartments));
router.get('/mock-user/:role',                        asyncHandler(ctrl.getMockUser));

// LINE Webhook — รับ event จาก LINE Platform
router.post('/line/webhook', asyncHandler(ctrl.lineWebhook));

// Protected routes
router.get('/me',  authenticate, asyncHandler(ctrl.getMe));
router.put('/me',  authenticate, asyncHandler(ctrl.updateMe));

module.exports = router;