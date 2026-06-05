// routes/tickets.js
const router = require('express').Router();
const ctrl   = require('../controllers/ticketController');
const { authenticate, authorize } = require('../middleware/auth');
const { rules, validate }         = require('../middleware/validate');
const { asyncHandler }            = require('../middleware/errorHandler');
const { upload, processImages }   = require('../middleware/upload');

// GET  /api/tickets/categories — ดึงประเภทปัญหาทั้งหมด (ไม่ต้อง login)
router.get('/categories', asyncHandler(async (req, res) => {
  const { pool } = require('../config/db');
  const response = require('../utils/response');
  const [rows] = await pool.execute(
    'SELECT id, code, name, sla_minutes FROM categories WHERE is_active = 1 ORDER BY id'
  );
  return response.success(res, rows);
}));

// ทุก route ต้อง login ก่อน
router.use(authenticate);

// ─── USER + ADMIN ────────────────────────────────────────────────

// GET  /api/tickets          — รายการ Ticket
router.get('/',
  rules.ticketList, validate,
  asyncHandler(ctrl.getTickets)
);

// GET  /api/tickets/:id      — รายละเอียด Ticket
router.get('/:id',
  asyncHandler(ctrl.getTicketById)
);

// POST /api/tickets          — สร้าง Ticket ใหม่
router.post('/',
  upload.array('images', 5),     // รับรูปสูงสุด 5 รูป
  processImages,
  rules.createTicket, validate,
  asyncHandler(ctrl.createTicket)
);

// POST /api/tickets/:id/comments — เพิ่ม Comment
router.post('/:id/comments',
  rules.addComment, validate,
  asyncHandler(ctrl.addComment)
);

// PUT /api/tickets/:id/cancel — ยกเลิก Ticket
router.put('/:id/cancel',
  asyncHandler(ctrl.cancelTicket)
);

// PUT /api/tickets/:id/rate  — ให้คะแนน (USER)
router.put('/:id/rate',
  rules.rateTicket, validate,
  asyncHandler(ctrl.rateTicket)
);

// PUT /api/tickets/:id/edit — USER แก้ไข ticket ก่อน admin ปิดงาน
router.put('/:id/edit',
  upload.array('images', 5),
  processImages,
  asyncHandler(ctrl.editTicket)
);

// ─── ADMIN ONLY ──────────────────────────────────────────────────

// PUT /api/tickets/:id/accept  — รับงาน
router.put('/:id/accept',
  authorize('ADMIN'),
  rules.acceptTicket, validate,
  asyncHandler(ctrl.acceptTicket)
);

// PUT /api/tickets/:id/resolve — ปิดงาน
router.put('/:id/resolve',
  authorize('ADMIN'),
  rules.closeTicket, validate,
  asyncHandler(ctrl.resolveTicket)
);

// PUT /api/tickets/:id/edit-resolved — ADMIN แก้ไขหลังปิดงาน
router.put('/:id/edit-resolved',
  authorize('ADMIN'),
  asyncHandler(ctrl.editResolved)
);

// DELETE /api/tickets/:id
router.delete('/:id',
  authorize('ADMIN'),
  asyncHandler(ctrl.deleteTicket)
);

module.exports = router;