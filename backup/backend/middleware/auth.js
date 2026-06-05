// middleware/auth.js
const jwt      = require('jsonwebtoken');
const { pool } = require('../config/db');
const response = require('../utils/response');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return response.unauthorized(res, 'กรุณาเข้าสู่ระบบก่อน');
    }

    const token = authHeader.split(' ')[1];

    // ─── Dev Mock Token ───────────────────────────────────
    // format: "mock.<base64payload>.mock"
    if (token.startsWith('mock.') && token.endsWith('.mock')) {
      if (process.env.NODE_ENV !== 'production') {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          // query DB จริงเพื่อให้ได้ข้อมูลครบ
          const [rows] = await pool.execute(
            'SELECT id, first_name, last_name, role, department_id, line_user_id, is_active FROM users WHERE id = ? AND is_active = 1',
            [payload.userId]
          );
          if (!rows.length) return response.unauthorized(res, 'ไม่พบ user');
          req.user = rows[0];
          return next();
        } catch (_) {
          return response.unauthorized(res, 'Mock token ไม่ถูกต้อง');
        }
      }
      return response.unauthorized(res, 'Mock token ใช้ได้เฉพาะ development');
    }

    // ─── Real JWT ─────────────────────────────────────────
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [rows] = await pool.execute(
      'SELECT id, first_name, last_name, role, department_id, line_user_id, is_active FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!rows.length || !rows[0].is_active) {
      return response.unauthorized(res, 'บัญชีผู้ใช้ไม่พบหรือถูกระงับ');
    }

    req.user = rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return response.unauthorized(res, 'Token หมดอายุ กรุณาเข้าสู่ระบบใหม่');
    }
    return response.unauthorized(res, 'Token ไม่ถูกต้อง');
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return response.forbidden(res, 'คุณไม่มีสิทธิ์ดำเนินการนี้');
    }
    next();
  };
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token   = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const [rows]  = await pool.execute(
        'SELECT id, first_name, last_name, role, department_id FROM users WHERE id = ? AND is_active = 1',
        [decoded.userId]
      );
      if (rows.length) req.user = rows[0];
    }
  } catch (_) {}
  next();
};

module.exports = { authenticate, authorize, optionalAuth };