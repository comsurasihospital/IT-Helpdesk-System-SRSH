// controllers/authController.js
const jwt      = require('jsonwebtoken');
const { pool } = require('../config/db');
const response = require('../utils/response');
const logger   = require('../utils/logger');

const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// POST /api/auth/line-login
exports.lineLogin = async (req, res) => {
  const lineUserId      = String(req.body.lineUserId      || '').trim() || null;
  const lineDisplayName = String(req.body.lineDisplayName || '').trim() || null;
  const linePictureUrl  = String(req.body.linePictureUrl  || '').trim() || null;

  if (!lineUserId) {
    return response.error(res, 'LINE User ID จำเป็น', 400);
  }

  const [rows] = await pool.execute(
    'SELECT id, first_name, last_name, role, department_id, is_active FROM users WHERE line_user_id = ?',
    [lineUserId]
  );

  if (!rows.length) {
    return response.success(res, {
      isNewUser: true,
      lineUserId,
      lineDisplayName,
      linePictureUrl,
    }, 'ผู้ใช้ใหม่ กรุณาลงทะเบียน');
  }

  const user = rows[0];
  if (!user.is_active) {
    return response.forbidden(res, 'บัญชีของคุณถูกระงับการใช้งาน');
  }

  await pool.execute(
    'UPDATE users SET line_display_name = ?, line_picture_url = ?, last_login_at = NOW() WHERE id = ?',
    [lineDisplayName, linePictureUrl, user.id]
  );

  const token = generateToken(user.id, user.role);
  return response.success(res, {
    isNewUser: false,
    token,
    user: {
      id:           user.id,
      firstName:    user.first_name,
      lastName:     user.last_name,
      role:         user.role,
      departmentId: user.department_id,
    },
  }, 'เข้าสู่ระบบสำเร็จ');
};

// POST /api/auth/register
exports.register = async (req, res) => {

  // ── แปลงทุก field ให้ปลอดภัยก่อน ──────────────────
  const toStr  = (v) => (v !== undefined && v !== null) ? String(v).trim() : null;
  const toInt  = (v) => { const n = parseInt(v, 10); return isNaN(n) ? null : n; };

  const lineUserId      = toStr(req.body.lineUserId)      || null;
  const lineDisplayName = toStr(req.body.lineDisplayName) || null;
  const linePictureUrl  = toStr(req.body.linePictureUrl)  || null;
  const firstName       = toStr(req.body.firstName)       || null;
  const lastName        = toStr(req.body.lastName)        || null;
  const phone           = toStr(req.body.phone)           || null;
  const departmentId    = toInt(req.body.departmentId);



  // ── Validate ──────────────────────────────────────
  if (!lineUserId)      return response.error(res, 'LINE User ID จำเป็น', 400);
  if (!firstName)       return response.error(res, 'กรุณากรอกชื่อ', 400);
  if (!lastName)        return response.error(res, 'กรุณากรอกนามสกุล', 400);
  if (!departmentId)    return response.error(res, 'กรุณาเลือกแผนก', 400);

  // ── เช็คซ้ำ ───────────────────────────────────────
  const [exist] = await pool.execute(
    'SELECT id FROM users WHERE line_user_id = ?',
    [lineUserId]
  );
  if (exist.length) {
    return response.error(res, 'LINE User ID นี้ลงทะเบียนแล้ว', 409);
  }

  // ── เช็ค department ───────────────────────────────
  const [dept] = await pool.execute(
    'SELECT id FROM departments WHERE id = ? AND is_active = 1',
    [departmentId]
  );
  if (!dept.length) {
    return response.error(res, 'ไม่พบแผนกที่เลือก', 400);
  }

  // ── INSERT — log params ก่อน query ────────────────
  const prefixId = toInt(req.body.prefixId) || null;
  const params = [lineUserId, lineDisplayName, linePictureUrl, prefixId, firstName, lastName, phone, departmentId];

  const [result] = await pool.execute(
    `INSERT INTO users
       (line_user_id, line_display_name, line_picture_url,
        prefix_id, first_name, last_name, phone, department_id, role, last_login_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'USER', NOW())`,
    params
  );

  const token = generateToken(result.insertId, 'USER');
  logger.info(`New user registered: id=${result.insertId}`);

  return response.created(res, {
    token,
    user: {
      id:           result.insertId,
      prefixId,
      firstName,
      lastName,
      role:         'USER',
      departmentId,
    },
  }, 'ลงทะเบียนสำเร็จ');
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT u.id, u.prefix_id, p.name AS prefix, u.first_name, u.last_name, u.phone, u.role,
            u.department_id,
            u.line_user_id, u.line_display_name, u.line_picture_url,
            u.last_login_at, u.created_at,
            d.name AS department_name, d.code AS department_code
     FROM users u
     LEFT JOIN departments d ON d.id = u.department_id
     LEFT JOIN prefixes p ON p.id = u.prefix_id
     WHERE u.id = ?`,
    [req.user.id]
  );
  return response.success(res, rows[0]);
};

// GET /api/auth/departments
exports.getDepartments = async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT id, name, code FROM departments WHERE is_active = 1 ORDER BY name'
  );
  return response.success(res, rows);
};

// GET /api/auth/mock-user/:role  (dev only)
exports.getMockUser = async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return response.forbidden(res, 'Not available in production');
  }
  const role = req.params.role;
  if (!['USER', 'ADMIN', 'SUPERVISOR'].includes(role)) {
    return response.error(res, 'Invalid role', 400);
  }
  // ดึง user แรกสุดที่มี role ตรงกันจาก DB จริง
  const [rows] = await pool.execute(
    `SELECT u.id, u.first_name AS firstName, u.last_name AS lastName,
            u.role, u.department_id AS departmentId,
            d.name AS departmentName
     FROM users u
     LEFT JOIN departments d ON d.id = u.department_id
     WHERE u.role = ? AND u.is_active = 1
     ORDER BY u.id ASC LIMIT 1`,
    [role]
  );
  if (!rows.length) {
    return response.error(res, `ไม่พบ user role ${role} ใน DB กรุณา Register ก่อน`, 404);
  }
  return response.success(res, rows[0]);
};

// ==================================================================
// POST /api/auth/line/webhook
// รับ event จาก LINE Platform — ต้องตอบ 200 ทันที
// ใช้สำหรับดึง Group ID และ LINE User ID
// ==================================================================
exports.lineWebhook = async (req, res) => {
  // ต้องตอบ 200 ก่อนเสมอ ไม่งั้น LINE จะ timeout
  res.status(200).json({ status: 'ok' });

  const events = req.body?.events || [];
  for (const event of events) {
    const source   = event.source || {};
    const groupId  = source.groupId;
    const userId   = source.userId;
    const type     = event.type;

    // log Group ID เพื่อเอาไปใส่ .env
    if (groupId) {
      logger.info(`LINE Webhook | type=${type} | groupId=${groupId} | userId=${userId}`);
    } else {
      logger.info(`LINE Webhook | type=${type} | userId=${userId}`);
    }
  }
};

// ==================================================================
// PUT /api/auth/me — แก้ไขข้อมูล profile ตัวเอง
// ==================================================================
exports.updateMe = async (req, res) => {
  const toStr = (v) => (v !== undefined && v !== null) ? String(v).trim() : null;
  const toInt = (v) => { const n = parseInt(v, 10); return isNaN(n) ? null : n; };


  const firstName    = toStr(req.body.firstName)    || null;
  const lastName     = toStr(req.body.lastName)     || null;
  const phone        = toStr(req.body.phone)        || null;
  const departmentId = toInt(req.body.departmentId);

  if (!firstName)    return response.error(res, 'กรุณากรอกชื่อ', 400);
  if (!lastName)     return response.error(res, 'กรุณากรอกนามสกุล', 400);
  if (!departmentId) return response.error(res, 'กรุณาเลือกแผนก', 400);

  const prefixId = toInt(req.body.prefixId) || null;

  await pool.execute(
    `UPDATE users SET prefix_id=?, first_name=?, last_name=?, phone=?, department_id=?, updated_at=NOW()
     WHERE id=?`,
    [prefixId, firstName, lastName, phone, departmentId, req.user.id]
  );

  const [rows] = await pool.execute(
    `SELECT u.id, u.prefix_id, p.name AS prefix, u.first_name, u.last_name, u.phone, u.role,
            u.department_id, u.line_user_id, u.line_display_name, u.line_picture_url,
            d.name AS department_name
     FROM users u
     LEFT JOIN departments d ON d.id = u.department_id
     LEFT JOIN prefixes p ON p.id = u.prefix_id
     WHERE u.id = ?`,
    [req.user.id]
  );

  return response.success(res, rows[0], 'อัปเดตข้อมูลสำเร็จ');
};

// ==================================================================
// GET /api/auth/prefixes — ดึงรายการคำนำหน้าชื่อ
// ==================================================================
exports.getPrefixes = async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT id, name FROM prefixes WHERE is_active = 1 ORDER BY sort_order ASC'
  );
  return response.success(res, rows);
};