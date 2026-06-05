// controllers/ticketController.js
const { pool, withTransaction } = require('../config/db');
const response    = require('../utils/response');
const logger      = require('../utils/logger');
const lineService = require('../services/lineService');
const dayjs       = require('dayjs');

// ── Helper: สร้างเลข Ticket ─────────────────────────────────
async function generateTicketNo(conn) {
  const [settings] = await conn.execute(
    "SELECT value FROM system_settings WHERE setting_key = 'TICKET_PREFIX'"
  );
  const prefix     = settings[0]?.value || 'TK';
  const year       = dayjs().format('YYYY');
  const fullPrefix = prefix + year; // เช่น TK2026

  // ดึง ticket_no ล่าสุดที่รูปแบบถูกต้อง (ความยาว 11 ตัวพอดี)
  const [rows] = await conn.execute(
    `SELECT ticket_no FROM tickets
     WHERE ticket_no REGEXP ?
     ORDER BY id DESC LIMIT 1`,
    [`^${fullPrefix}[0-9]{5}$`]
  );

  let seq = 1;
  if (rows.length > 0) {
    const lastNo = rows[0].ticket_no;
    const lastSeq = parseInt(lastNo.slice(fullPrefix.length));
    seq = lastSeq + 1;
  }

  return `${fullPrefix}${String(seq).padStart(5, '0')}`;
}

// ── Helper: บันทึก Log ──────────────────────────────────────
async function logTicket(conn, ticketId, actorId, action, fromStatus, toStatus, note = null) {
  await conn.execute(
    `INSERT INTO ticket_logs (ticket_id, actor_id, action, from_status, to_status, note)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [ticketId, actorId, action, fromStatus || null, toStatus || null, note || null]
  );
}

// ==================================================================
// POST /api/tickets
// ==================================================================
exports.createTicket = async (req, res) => {
  const categoryId      = parseInt(req.body.categoryId) || null;
  const title           = String(req.body.title       || '').trim() || null;
  const description     = String(req.body.description || '').trim() || null;
  const priority        = req.body.priority || 'MEDIUM';
  const userId          = req.user.id;
  const reporterPrefixId = parseInt(req.body.reporterPrefixId) || null;
  const reporterName     = String(req.body.reporterName    || '').trim() || null;
  const reporterPhone    = String(req.body.reporterPhone   || '').trim() || null;
  const reporterDeptId   = parseInt(req.body.reporterDeptId) || null;

  if (!categoryId || !title || !description) {
    return response.error(res, 'ข้อมูลไม่ครบ', 400);
  }

  const ticket = await withTransaction(async (conn) => {
    const [cats] = await conn.execute(
      'SELECT id, name, sla_minutes FROM categories WHERE id = ? AND is_active = 1',
      [categoryId]
    );
    if (!cats.length) throw Object.assign(new Error('ไม่พบประเภทปัญหาที่เลือก'), { statusCode: 400 });

    const slaMins = cats[0].sla_minutes;
    const slaDate = dayjs().add(slaMins, 'minute').toDate();
    const ticketNo = await generateTicketNo(conn);

    const [result] = await conn.execute(
      `INSERT INTO tickets (ticket_no, user_id, category_id, title, description, priority, sla_due_at,
        reporter_prefix, reporter_name, reporter_phone, reporter_dept_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [ticketNo, userId, categoryId, title, description, priority, slaDate,
       reporterPrefixId, reporterName, reporterPhone, reporterDeptId]
    );
    const ticketId = result.insertId;

    await logTicket(conn, ticketId, userId, 'TICKET_CREATED', null, 'OPEN', 'สร้าง Ticket ใหม่');

    if (req.uploadedFiles && req.uploadedFiles.length > 0) {
      for (const file of req.uploadedFiles) {
        await conn.execute(
          `INSERT INTO ticket_attachments (ticket_id, file_name, file_path, file_size, mime_type, uploaded_by)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [ticketId, file.originalName, file.filePath, file.fileSize, file.mimeType, userId]
        );
      }
    }

    const [ticketRows] = await conn.execute('SELECT * FROM v_tickets_full WHERE id = ?', [ticketId]);
    return ticketRows[0];
  });

  lineService.notifyNewTicket(ticket).catch(err => logger.error('LINE notify error:', err.message));
  lineService.notifyTicketConfirmed(ticket).catch(err => logger.error('LINE notify confirmed error:', err.message));
  return response.created(res, ticket, `สร้าง Ticket ${ticket.ticket_no} สำเร็จ`);
};

// ==================================================================
// GET /api/tickets
// แก้ไข: ใส่ LIMIT OFFSET ตรงใน query string แทน ? parameter
// ==================================================================
exports.getTickets = async (req, res) => {
  const page       = Math.max(1, parseInt(req.query.page)  || 1);
  const limit      = Math.min(200, parseInt(req.query.limit) || 20);
  const offset     = (page - 1) * limit;
  const { status, categoryId, search, startDate, endDate } = req.query;

  let where  = [];
  let params = [];

  if (req.user.role === 'USER') {
    where.push('user_id = ?');
    params.push(req.user.id);
  }
  if (status) {
    where.push('status = ?');
    params.push(status);
  }
  if (categoryId) {
    where.push('category_id = ?');
    params.push(parseInt(categoryId));
  }
  if (search) {
    where.push('(ticket_no LIKE ? OR title LIKE ? OR user_name LIKE ? OR reporter_name LIKE ? OR reporter_department_name LIKE ?)');
    const kw = `%${search}%`;
    params.push(kw, kw, kw, kw, kw);
  }
  if (startDate) {
    where.push('DATE(opened_at) >= ?');
    params.push(startDate);
  }
  if (endDate) {
    where.push('DATE(opened_at) <= ?');
    params.push(endDate);
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  // ✅ LIMIT และ OFFSET ใส่ตรงใน query string เพราะ MySQL2 execute() ไม่รองรับ ? สำหรับ LIMIT/OFFSET
  const [rows] = await pool.query(
    `SELECT * FROM v_tickets_full ${whereClause} ORDER BY opened_at DESC LIMIT ${limit} OFFSET ${offset}`,
    params
  );
  const [total] = await pool.query(
    `SELECT COUNT(*) AS cnt FROM v_tickets_full ${whereClause}`,
    params
  );

  return response.success(res, {
    tickets: rows,
    pagination: {
      page,
      limit,
      total:      total[0].cnt,
      totalPages: Math.ceil(total[0].cnt / limit),
    },
  });
};

// ==================================================================
// GET /api/tickets/:id
// ==================================================================
exports.getTicketById = async (req, res) => {
  const id = parseInt(req.params.id);

  const [rows] = await pool.execute('SELECT * FROM v_tickets_full WHERE id = ?', [id]);
  if (!rows.length) return response.notFound(res, 'ไม่พบ Ticket');

  const ticket = rows[0];
  if (req.user.role === 'USER' && ticket.user_id !== req.user.id) {
    return response.forbidden(res, 'คุณไม่มีสิทธิ์ดู Ticket นี้');
  }

  const [attachments] = await pool.execute(
    'SELECT id, file_name, file_path, file_size, created_at FROM ticket_attachments WHERE ticket_id = ?',
    [id]
  );

  const isAdmin = ['ADMIN', 'SUPERVISOR'].includes(req.user.role);
  const [comments] = await pool.execute(
    `SELECT tc.id, tc.comment, tc.is_internal, tc.created_at,
            CONCAT(u.first_name, ' ', u.last_name) AS user_name, u.role
     FROM ticket_comments tc
     JOIN users u ON u.id = tc.user_id
     WHERE tc.ticket_id = ? ${isAdmin ? '' : 'AND tc.is_internal = 0'}
     ORDER BY tc.created_at ASC`,
    [id]
  );

  const [logs] = await pool.execute(
    `SELECT tl.id, tl.action, tl.from_status, tl.to_status, tl.note, tl.created_at,
            CONCAT(u.first_name, ' ', u.last_name) AS actor_name
     FROM ticket_logs tl
     JOIN users u ON u.id = tl.actor_id
     WHERE tl.ticket_id = ?
     ORDER BY tl.created_at ASC`,
    [id]
  );

  return response.success(res, { ...ticket, attachments, comments, logs });
};

// ==================================================================
// PUT /api/tickets/:id/accept
// ==================================================================
exports.acceptTicket = async (req, res) => {
  const id      = parseInt(req.params.id);
  const adminId = req.user.id;

  const updated = await withTransaction(async (conn) => {
    const [rows] = await conn.execute('SELECT id, status FROM tickets WHERE id = ?', [id]);
    if (!rows.length)           throw Object.assign(new Error('ไม่พบ Ticket'), { statusCode: 404 });
    if (rows[0].status !== 'OPEN') throw Object.assign(new Error('Ticket นี้ถูกรับงานไปแล้ว'), { statusCode: 409 });

    await conn.execute(
      "UPDATE tickets SET status = 'IN_PROGRESS', assigned_to = ?, accepted_at = NOW() WHERE id = ?",
      [adminId, id]
    );
    // บันทึก log รับงาน — เวลาจะถูก update อีกครั้งตอนปิดงาน
    await logTicket(conn, id, adminId, 'STATUS_CHANGE', 'OPEN', 'IN_PROGRESS', 'รับงาน');

    const [u] = await conn.execute('SELECT * FROM v_tickets_full WHERE id = ?', [id]);
    return u[0];
  });

  lineService.notifyTicketAccepted(updated).catch(err => logger.error('LINE notify error:', err.message));
  return response.success(res, updated, 'รับงานเรียบร้อย');
};

// ==================================================================
// PUT /api/tickets/:id/resolve
// ==================================================================
exports.resolveTicket = async (req, res) => {
  const id             = parseInt(req.params.id);
  const resolutionNote = String(req.body.resolutionNote || '').trim() || null;
  const rootCause      = String(req.body.rootCause      || '').trim() || null;
  const slaType        = String(req.body.slaType        || '').trim() || null;
  const acceptedAt     = req.body.acceptedAt ? new Date(req.body.acceptedAt) : null;
  const resolvedAt     = req.body.resolvedAt ? new Date(req.body.resolvedAt) : new Date();
  const adminId        = req.user.id;

  const resolved = await withTransaction(async (conn) => {
    const [rows] = await conn.execute('SELECT id, status, sla_due_at FROM tickets WHERE id = ?', [id]);
    if (!rows.length)                     throw Object.assign(new Error('ไม่พบ Ticket'), { statusCode: 404 });
    if (rows[0].status !== 'IN_PROGRESS') throw Object.assign(new Error('Ticket ต้องอยู่สถานะ IN_PROGRESS ก่อนปิดงาน'), { statusCode: 409 });

    // คำนวณ SLA จากเวลาที่ admin กรอก
    const slaDue    = rows[0].sla_due_at ? dayjs(rows[0].sla_due_at) : null;
    const closedAt  = dayjs(resolvedAt);
    const slaStatus = slaDue ? (closedAt.isBefore(slaDue) ? 'ON_TIME' : 'BREACHED') : 'PENDING';

    // update accepted_at ถ้า admin กรอกมา
    if (acceptedAt) {
      await conn.execute('UPDATE tickets SET accepted_at = ? WHERE id = ?', [acceptedAt, id]);
    }

    const note = `สาเหตุ: ${rootCause || '-'}\nวิธีแก้ไข: ${resolutionNote || '-'}`;

    await conn.execute(
      "UPDATE tickets SET status = 'RESOLVED', resolved_at = ?, resolution_note = ?, sla_status = ?, sla_type = ? WHERE id = ?",
      [resolvedAt, note, slaStatus, slaType, id]
    );

    // log รับงาน — ลบ log เดิมที่บันทึกตอนกดรับงาน แล้ว insert ใหม่ด้วยเวลาที่ admin ระบุ
    await conn.execute(
      `DELETE FROM ticket_logs WHERE ticket_id = ? AND action = 'STATUS_CHANGE' AND to_status = 'IN_PROGRESS'`,
      [id]
    );
    await conn.execute(
      `INSERT INTO ticket_logs (ticket_id, actor_id, action, from_status, to_status, note, created_at)
       VALUES (?, ?, 'STATUS_CHANGE', 'OPEN', 'IN_PROGRESS', 'รับงาน', ?)`,
      [id, adminId, acceptedAt || resolvedAt]
    );

    // log ปิดงาน — ใช้เวลาที่ admin ระบุ
    await conn.execute(
      `INSERT INTO ticket_logs (ticket_id, actor_id, action, from_status, to_status, note, created_at)
       VALUES (?, ?, 'STATUS_CHANGE', 'IN_PROGRESS', 'RESOLVED', ?, ?)`,
      [id, adminId, note, resolvedAt]
    );

    const [u] = await conn.execute('SELECT * FROM v_tickets_full WHERE id = ?', [id]);
    return u[0];
  });

  lineService.notifyTicketResolved(resolved).catch(err => logger.error('LINE notify error:', err.message));
  return response.success(res, resolved, 'ปิดงานเรียบร้อย');
};

// ==================================================================
// PUT /api/tickets/:id/cancel
// ==================================================================
exports.cancelTicket = async (req, res) => {
  const id   = parseInt(req.params.id);
  const note = String(req.body.note || '').trim() || 'ยกเลิก';

  await withTransaction(async (conn) => {
    const [rows] = await conn.execute('SELECT id, status, user_id FROM tickets WHERE id = ?', [id]);
    if (!rows.length) throw Object.assign(new Error('ไม่พบ Ticket'), { statusCode: 404 });
    if (['RESOLVED', 'CANCELLED'].includes(rows[0].status)) {
      throw Object.assign(new Error('ไม่สามารถยกเลิก Ticket ที่ปิดแล้ว'), { statusCode: 409 });
    }
    if (req.user.role === 'USER' && rows[0].user_id !== req.user.id) {
      throw Object.assign(new Error('ไม่มีสิทธิ์'), { statusCode: 403 });
    }

    const from = rows[0].status;
    await conn.execute("UPDATE tickets SET status = 'CANCELLED', cancelled_at = NOW() WHERE id = ?", [id]);
    await logTicket(conn, id, req.user.id, 'STATUS_CHANGE', from, 'CANCELLED', note);
  });

  // notify user ว่า ticket ถูกยกเลิก
  const [cancelled] = await pool.execute('SELECT * FROM v_tickets_full WHERE id = ?', [id]);
  if (cancelled.length) {
    lineService.notifyTicketCancelled({ ...cancelled[0], cancel_reason: note })
      .catch(err => logger.error('LINE notify error:', err.message));
  }

  return response.success(res, null, 'ยกเลิก Ticket สำเร็จ');
};

// ==================================================================
// PUT /api/tickets/:id/rate
// ==================================================================
exports.rateTicket = async (req, res) => {
  const id    = parseInt(req.params.id);
  const score = parseInt(req.body.score);
  const note  = String(req.body.note || '').trim() || null;

  if (!score || score < 1 || score > 5) {
    return response.error(res, 'คะแนนต้องเป็น 1-5', 400);
  }

  const [rows] = await pool.execute('SELECT id, status, user_id, satisfaction_score FROM tickets WHERE id = ?', [id]);
  if (!rows.length)                   return response.notFound(res, 'ไม่พบ Ticket');
  if (rows[0].status !== 'RESOLVED')  return response.error(res, 'ให้คะแนนได้เฉพาะ Ticket ที่ปิดงานแล้ว', 400);
  if (req.user.role === 'USER' && rows[0].user_id !== req.user.id) return response.forbidden(res, 'ไม่มีสิทธิ์');
  if (rows[0].satisfaction_score)     return response.error(res, 'Ticket นี้ให้คะแนนไปแล้ว', 409);

  await pool.execute(
    'UPDATE tickets SET satisfaction_score = ?, satisfaction_note = ?, rated_at = NOW() WHERE id = ?',
    [score, note, id]
  );

  return response.success(res, { score }, 'ขอบคุณสำหรับการประเมิน');
};

// ==================================================================
// POST /api/tickets/:id/comments
// ==================================================================
exports.addComment = async (req, res) => {
  const id         = parseInt(req.params.id);
  const comment    = String(req.body.comment || '').trim() || null;
  const isInternal = req.user.role === 'USER' ? false : Boolean(req.body.isInternal);

  if (!comment) return response.error(res, 'กรุณากรอกความคิดเห็น', 400);

  const [rows] = await pool.execute('SELECT id, user_id FROM tickets WHERE id = ?', [id]);
  if (!rows.length) return response.notFound(res, 'ไม่พบ Ticket');
  if (req.user.role === 'USER' && rows[0].user_id !== req.user.id) return response.forbidden(res, 'ไม่มีสิทธิ์');

  const [result] = await pool.execute(
    'INSERT INTO ticket_comments (ticket_id, user_id, comment, is_internal) VALUES (?, ?, ?, ?)',
    [id, req.user.id, comment, isInternal]
  );

  return response.created(res, { id: result.insertId }, 'เพิ่มความคิดเห็นสำเร็จ');
};

// ==================================================================
// DELETE /api/tickets/:id  (ADMIN only)
// ==================================================================
exports.deleteTicket = async (req, res) => {
  const id = parseInt(req.params.id);
  const [rows] = await pool.execute('SELECT id FROM tickets WHERE id = ?', [id]);
  if (!rows.length) return response.notFound(res, 'ไม่พบ Ticket');
  await pool.execute('DELETE FROM tickets WHERE id = ?', [id]);
  return response.success(res, null, 'ลบ Ticket สำเร็จ');
};

// ==================================================================
// PUT /api/tickets/:id/edit
// USER แก้ไขรายละเอียด + แนบรูปเพิ่ม (ก่อน admin ปิดงาน)
// ==================================================================
exports.editTicket = async (req, res) => {
  const id          = parseInt(req.params.id);
  const description = String(req.body.description || '').trim() || null;
  const userId      = req.user.id;

  const [rows] = await pool.execute(
    'SELECT id, status, user_id FROM tickets WHERE id = ?', [id]
  );
  if (!rows.length) return response.notFound(res, 'ไม่พบ Ticket');

  // เฉพาะเจ้าของ ticket เท่านั้น
  if (rows[0].user_id !== userId && req.user.role === 'USER') {
    return response.forbidden(res, 'ไม่มีสิทธิ์แก้ไข Ticket นี้');
  }
  // แก้ได้เฉพาะก่อนปิดงาน
  if (['RESOLVED', 'CANCELLED'].includes(rows[0].status)) {
    return response.error(res, 'ไม่สามารถแก้ไข Ticket ที่ปิดแล้ว', 400);
  }

  await withTransaction(async (conn) => {
    if (description) {
      await conn.execute(
        'UPDATE tickets SET description = ? WHERE id = ?',
        [description, id]
      );
    }
    // แนบรูปเพิ่ม
    if (req.uploadedFiles && req.uploadedFiles.length > 0) {
      for (const file of req.uploadedFiles) {
        await conn.execute(
          `INSERT INTO ticket_attachments (ticket_id, file_name, file_path, file_size, mime_type, uploaded_by)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [id, file.originalName, file.filePath, file.fileSize, file.mimeType, userId]
        );
      }
    }
    await logTicket(conn, id, userId, 'EDITED', null, null, 'แก้ไขรายละเอียด');
  });

  const [updated] = await pool.execute('SELECT * FROM v_tickets_full WHERE id = ?', [id]);
  return response.success(res, updated[0], 'แก้ไขสำเร็จ');
};

// ==================================================================
// PUT /api/tickets/:id/edit-resolved
// ADMIN แก้ไข วัน/เวลา + สาเหตุ + วิธีแก้ไข หลังปิดงาน
// ==================================================================
exports.editResolved = async (req, res) => {
  const id             = parseInt(req.params.id);
  const rootCause      = String(req.body.rootCause      || '').trim() || null;
  const resolutionNote = String(req.body.resolutionNote || '').trim() || null;
  const description    = String(req.body.description    || '').trim() || null;
  const acceptedAt     = req.body.acceptedAt ? new Date(req.body.acceptedAt) : null;
  const resolvedAt     = req.body.resolvedAt ? new Date(req.body.resolvedAt) : null;
  const adminId        = req.user.id;

  const [rows] = await pool.execute(
    'SELECT id, status, sla_due_at FROM tickets WHERE id = ?', [id]
  );
  if (!rows.length) return response.notFound(res, 'ไม่พบ Ticket');
  if (rows[0].status !== 'RESOLVED') {
    return response.error(res, 'แก้ไขได้เฉพาะ Ticket ที่ปิดงานแล้ว', 400);
  }

  await withTransaction(async (conn) => {
    const note = `สาเหตุ: ${rootCause || '-'}\nวิธีแก้ไข: ${resolutionNote || '-'}`;

    // คำนวณ SLA ใหม่ถ้ามีการแก้ไขเวลาปิดงาน
    let slaStatus = null;
    if (resolvedAt) {
      const slaDue = rows[0].sla_due_at ? dayjs(rows[0].sla_due_at) : null;
      slaStatus = slaDue ? (dayjs(resolvedAt).isBefore(slaDue) ? 'ON_TIME' : 'BREACHED') : 'PENDING';
    }

    await conn.execute(
      `UPDATE tickets SET
        resolution_note = ?,
        ${description ? 'description = ?,' : ''}
        ${acceptedAt ? 'accepted_at = ?,' : ''}
        ${resolvedAt ? 'resolved_at = ?,' : ''}
        ${slaStatus  ? 'sla_status = ?,' : ''}
        updated_at = NOW()
       WHERE id = ?`,
      [
        note,
        ...(description ? [description] : []),
        ...(acceptedAt ? [acceptedAt] : []),
        ...(resolvedAt ? [resolvedAt] : []),
        ...(slaStatus  ? [slaStatus]  : []),
        id,
      ]
    );

    // อัปเดต log รับงาน
    if (acceptedAt) {
      await conn.execute(
        `UPDATE ticket_logs SET created_at = ?
         WHERE ticket_id = ? AND to_status = 'IN_PROGRESS'
         ORDER BY id DESC LIMIT 1`,
        [acceptedAt, id]
      );
    }
    // อัปเดต log ปิดงาน
    if (resolvedAt || rootCause || resolutionNote) {
      await conn.execute(
        `UPDATE ticket_logs SET note = ?, created_at = IFNULL(?, created_at)
         WHERE ticket_id = ? AND to_status = 'RESOLVED'
         ORDER BY id DESC LIMIT 1`,
        [note, resolvedAt || null, id]
      );
    }
    await logTicket(conn, id, adminId, 'EDITED', null, null, 'Admin แก้ไขข้อมูลการปิดงาน');
  });

  const [updated] = await pool.execute('SELECT * FROM v_tickets_full WHERE id = ?', [id]);
  return response.success(res, updated[0], 'แก้ไขสำเร็จ');
};