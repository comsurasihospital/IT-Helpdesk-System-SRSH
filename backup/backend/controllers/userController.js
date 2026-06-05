// controllers/userController.js
// ============================================================
// User Management Controller (ADMIN / SUPERVISOR)
// ============================================================

const { pool } = require('../config/db');
const response = require('../utils/response');

// GET /api/users  — รายชื่อผู้ใช้ทั้งหมด
exports.getUsers = async (req, res) => {
  const { role, departmentId, search } = req.query;
  let where  = [];
  let params = [];

  if (role)         { where.push('u.role = ?');          params.push(role); }
  if (departmentId) { where.push('u.department_id = ?'); params.push(departmentId); }
  if (search) {
    where.push('(u.first_name LIKE ? OR u.last_name LIKE ? OR u.phone LIKE ?)');
    const kw = `%${search}%`;
    params.push(kw, kw, kw);
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [rows] = await pool.execute(
    `SELECT u.id, u.first_name, u.last_name, u.phone, u.role,
            u.line_display_name, u.is_active, u.last_login_at, u.created_at,
            d.name AS department_name
     FROM users u
     LEFT JOIN departments d ON d.id = u.department_id
     ${whereClause}
     ORDER BY u.created_at DESC`,
    params
  );
  return response.success(res, rows);
};

// GET /api/users/:id
exports.getUserById = async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT u.*, d.name AS department_name
     FROM users u LEFT JOIN departments d ON d.id = u.department_id
     WHERE u.id = ?`,
    [req.params.id]
  );
  if (!rows.length) return response.notFound(res, 'ไม่พบผู้ใช้');
  return response.success(res, rows[0]);
};

// PUT /api/users/:id  — อัปเดตข้อมูล (ADMIN)
exports.updateUser = async (req, res) => {
  const { firstName, lastName, phone, departmentId, role, isActive } = req.body;
  const { id } = req.params;

  const [rows] = await pool.execute('SELECT id FROM users WHERE id = ?', [id]);
  if (!rows.length) return response.notFound(res, 'ไม่พบผู้ใช้');

  await pool.execute(
    `UPDATE users SET first_name = ?, last_name = ?, phone = ?,
            department_id = ?, role = ?, is_active = ?
     WHERE id = ?`,
    [firstName, lastName, phone, departmentId, role, isActive ? 1 : 0, id]
  );
  return response.success(res, null, 'อัปเดตข้อมูลสำเร็จ');
};

// DELETE /api/users/:id — soft delete (ปิดการใช้งาน)
exports.deactivateUser = async (req, res) => {
  const { id } = req.params;
  if (parseInt(id) === req.user.id) {
    return response.error(res, 'ไม่สามารถลบบัญชีของตัวเองได้', 400);
  }
  await pool.execute('UPDATE users SET is_active = 0 WHERE id = ?', [id]);
  return response.success(res, null, 'ระงับบัญชีผู้ใช้สำเร็จ');
};

// GET /api/users/admins  — รายชื่อ Admin สำหรับ assign
exports.getAdmins = async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT id, CONCAT(first_name, ' ', last_name) AS name
     FROM users WHERE role = 'ADMIN' AND is_active = 1 ORDER BY first_name`
  );
  return response.success(res, rows);
};