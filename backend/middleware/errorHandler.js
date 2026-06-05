// middleware/errorHandler.js
// ============================================================
// Global Error Handler & Async Wrapper
// ============================================================

const logger   = require('../utils/logger');
const response = require('../utils/response');

// ------------------------------------------------------------------
// asyncHandler: ครอบ async route handler ให้จัดการ error อัตโนมัติ
// แทนที่จะต้องเขียน try/catch ทุก controller
//
// ใช้งาน:
//   router.get('/path', asyncHandler(async (req, res) => { ... }))
// ------------------------------------------------------------------
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ------------------------------------------------------------------
// errorHandler: Global error middleware (ต้องอยู่ล่างสุดใน app.js)
// ------------------------------------------------------------------
const errorHandler = (err, req, res, next) => {
  logger.error(`${req.method} ${req.path} — ${err.message}`, { stack: err.stack });

  // MySQL Errors
  if (err.code === 'ER_DUP_ENTRY') {
    return response.error(res, 'ข้อมูลนี้มีอยู่ในระบบแล้ว', 409);
  }
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return response.error(res, 'ข้อมูลอ้างอิงไม่ถูกต้อง', 400);
  }

  // Multer Errors (ไฟล์)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return response.error(res, `ไฟล์มีขนาดเกิน ${process.env.MAX_FILE_SIZE_MB || 10}MB`, 400);
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return response.error(res, 'ประเภทไฟล์ไม่ถูกต้อง', 400);
  }

  const statusCode = err.statusCode || 500;
  const message    = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'เกิดข้อผิดพลาดภายในระบบ'
    : err.message;

  return response.error(res, message, statusCode);
};

// ------------------------------------------------------------------
// notFoundHandler: สำหรับ route ที่ไม่มีใน API
// ------------------------------------------------------------------
const notFoundHandler = (req, res) => {
  response.notFound(res, `ไม่พบ endpoint: ${req.method} ${req.path}`);
};

module.exports = { asyncHandler, errorHandler, notFoundHandler };