// services/lineService.js
// ============================================================
// LINE Messaging API — Flex Message Notifications
// ============================================================

const axios    = require('axios');
const { pool } = require('../config/db');
const logger   = require('../utils/logger');
const dayjs    = require('dayjs');
require('dayjs/locale/th');
dayjs.locale('th');

const LINE_PUSH_API = 'https://api.line.me/v2/bot/message/push';

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization:  `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
});

const LIFF_BASE = () => `https://liff.line.me/${process.env.LINE_LIFF_ID}`;

const CAT_ICON = {
  SOFTWARE: '💻', PRINTER: '🖨️', COMPUTER: '🖥️',
  NETWORK:  '🌐', INFO_REQ: '📊', PUBLISH:  '📢',
};

const fmt = (d) => d ? dayjs(d).format('D MMM YY HH:mm') : '-';

// ─── push helper ─────────────────────────────────────────────
async function pushMessage(to, messages) {
  if (!process.env.LINE_CHANNEL_ACCESS_TOKEN || !to) return;
  try {
    await axios.post(LINE_PUSH_API, { to, messages }, { headers: headers() });
    logger.info(`LINE push → ${to}`);
  } catch (err) {
    logger.error(`LINE push error: ${err.response?.data?.message || err.message}`);
  }
}

// ─── Flex builder helpers ─────────────────────────────────────
function row(label, value, valueColor) {
  return {
    type: 'box', layout: 'horizontal', spacing: 'sm',
    contents: [
      { type: 'text', text: label,        color: '#6B7280', size: 'sm', flex: 4 },
      { type: 'text', text: value || '-', color: valueColor || '#111827',
        size: 'sm', flex: 6, wrap: true, weight: 'bold' },
    ],
  };
}

function sep() {
  return { type: 'separator', margin: 'sm', color: '#E5E7EB' };
}

function btn(label, uri, color) {
  return {
    type: 'button', style: 'primary', color: color || '#2563EB',
    height: 'sm', margin: 'xs',
    action: { type: 'uri', label, uri },
  };
}

function header(emoji, title, sub, bg) {
  return {
    type: 'box', layout: 'vertical', paddingAll: '14px',
    backgroundColor: bg,
    contents: [{
      type: 'box', layout: 'horizontal', spacing: 'sm',
      contents: [
        { type: 'text', text: emoji, size: 'xl', flex: 0 },
        { type: 'box', layout: 'vertical', flex: 1,
          contents: [
            { type: 'text', text: title, color: '#FFFFFF', weight: 'bold', size: 'md' },
            { type: 'text', text: sub,   color: '#FFFFFF', size: 'xs' },
          ],
        },
      ],
    }],
  };
}

function footer(contents) {
  return {
    type: 'box', layout: 'vertical',
    paddingAll: '12px', spacing: 'xs',
    backgroundColor: '#F9FAFB',
    contents,
  };
}

// ════════════════════════════════════════════════════════════
// 1. กลุ่ม ADMIN — Ticket ใหม่
// ════════════════════════════════════════════════════════════
// ดึงชื่อผู้แจ้งและแผนก — ใช้ reporter fields ก่อน fallback ไป user fields
function displayName(ticket) {
  if (ticket.reporter_name) {
    const prefix = ticket.reporter_prefix_name || '';
    return prefix ? `${prefix} ${ticket.reporter_name}` : ticket.reporter_name;
  }
  return ticket.user_name || '-';
}
function displayDept(ticket) {
  return ticket.reporter_department_name || ticket.department_name || '-';
}
function displayPhone(ticket) {
  return ticket.reporter_phone || ticket.user_phone || '-';
}

async function notifyNewTicket(ticket) {
  const groupId = process.env.LINE_IT_GROUP_ID;
  if (!groupId) { logger.warn('LINE_IT_GROUP_ID not set'); return; }
  if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) { logger.warn('LINE_CHANNEL_ACCESS_TOKEN not set'); return; }
  logger.info(`notifyNewTicket → groupId=${groupId} ticket=${ticket?.ticket_no}`);

  const icon = CAT_ICON[ticket.category_code] || '🔧';
  const url  = `${LIFF_BASE()}/tickets/${ticket.id}`;
  const desc = (ticket.description || '-').slice(0, 120) +
               ((ticket.description || '').length > 120 ? '...' : '');

  const flex = {
    type: 'flex',
    altText: `🔔 แจ้งซ่อมใหม่ ${ticket.ticket_no} | ${displayDept(ticket)} | ${ticket.category_name}`,
    contents: {
      type: 'bubble',
      header: header('🔔', 'แจ้งซ่อมใหม่', ticket.ticket_no, '#1E3A5F'),
      body: {
        type: 'box', layout: 'vertical', paddingAll: '14px', spacing: 'sm',
        contents: [
          // ประเภทปัญหา badge
          {
            type: 'box', layout: 'horizontal', spacing: 'xs',
            backgroundColor: '#EFF6FF', cornerRadius: '6px', paddingAll: '8px',
            contents: [
              { type: 'text', text: icon, size: 'lg', flex: 0 },
              { type: 'text', text: ticket.category_name || '-',
                color: '#1D4ED8', weight: 'bold', size: 'sm', flex: 1,
                wrap: true, gravity: 'center' },
            ],
          },
          sep(),
          row('👤 ผู้แจ้ง',   displayName(ticket)),
          row('🏥 แผนก',     displayDept(ticket)),
          row('📞 เบอร์โทร',  displayPhone(ticket)),
          row('🕐 เวลาแจ้ง', fmt(ticket.opened_at)),
          row('⏱ SLA',       ticket.sla_minutes ? `${Math.round(ticket.sla_minutes/60)} ชั่วโมง` : '-', '#DC2626'),
          sep(),
          { type: 'text', text: '📋 รายละเอียด', color: '#6B7280', size: 'xs' },
          { type: 'text', text: desc, color: '#111827', size: 'sm', wrap: true },
        ],
      },
      footer: footer([btn('🔍 ดูรายละเอียดและรับงาน', url, '#1E3A5F')]),
    },
  };

  await pushMessage(groupId, [flex]);
  await saveNotif(ticket.id, ticket.user_id, 'TICKET_CREATED',
    `Ticket ใหม่: ${ticket.ticket_no}`,
    `${displayName(ticket)} แจ้ง: ${ticket.title}`);
}

// ════════════════════════════════════════════════════════════
// 2. USER — ยืนยันการแจ้งซ่อม (ส่งทันทีหลังสร้าง ticket)
// ════════════════════════════════════════════════════════════
async function notifyTicketConfirmed(ticket) {
  if (!ticket.line_user_id) return;
  const url  = `${LIFF_BASE()}/tickets/${ticket.id}`;
  const icon = CAT_ICON[ticket.category_code] || '🔧';
  const desc = (ticket.description || '-').slice(0, 100) +
               ((ticket.description || '').length > 100 ? '...' : '');

  const flex = {
    type: 'flex',
    altText: `🔔 ส่งเรื่องแจ้งซ่อมแล้ว ${ticket.ticket_no}`,
    contents: {
      type: 'bubble',
      header: header('🔔', 'ส่งเรื่องแจ้งซ่อมแล้ว', ticket.ticket_no, '#DC2626'),
      body: {
        type: 'box', layout: 'vertical', paddingAll: '14px', spacing: 'sm',
        contents: [
          {
            type: 'box', layout: 'horizontal', spacing: 'xs',
            backgroundColor: '#FEF2F2', cornerRadius: '6px', paddingAll: '8px',
            contents: [
              { type: 'text', text: icon, size: 'lg', flex: 0 },
              { type: 'text', text: ticket.category_name || '-',
                color: '#DC2626', weight: 'bold', size: 'sm', flex: 1,
                wrap: true, gravity: 'center' },
            ],
          },
          sep(),
          row('📋 หัวข้อ',     ticket.title),
          row('🏥 แผนก',      displayDept(ticket)),
          row('🕐 เวลาแจ้ง',  fmt(ticket.opened_at)),
          row('⏱ SLA',        ticket.sla_minutes ? `${Math.round(ticket.sla_minutes / 60)} ชั่วโมง` : '-', '#DC2626'),
          sep(),
          { type: 'text', text: '📋 รายละเอียด', color: '#6B7280', size: 'xs' },
          { type: 'text', text: desc, color: '#111827', size: 'sm', wrap: true },
          sep(),
          {
            type: 'box', layout: 'vertical', paddingAll: '10px',
            backgroundColor: '#FEF2F2', cornerRadius: '8px',
            contents: [
              { type: 'text', text: '✅ ทีม IT ได้รับเรื่องแล้ว กรุณารอการติดต่อกลับ',
                color: '#DC2626', size: 'xs', wrap: true, align: 'center' },
            ],
          },
        ],
      },
      footer: footer([btn('📱 ติดตามสถานะ Ticket', url, '#DC2626')]),
    },
  };

  await pushMessage(ticket.line_user_id, [flex]);
  await saveNotif(ticket.id, ticket.user_id, 'TICKET_CREATED',
    `รับเรื่องแล้ว: ${ticket.ticket_no}`,
    `ระบบรับเรื่องแจ้งซ่อม: ${ticket.title} เรียบร้อยแล้ว`);
}

// ════════════════════════════════════════════════════════════
// 3. USER — Admin รับงานแล้ว
// ════════════════════════════════════════════════════════════
async function notifyTicketAccepted(ticket) {
  if (!ticket.line_user_id) return;
  const url = `${LIFF_BASE()}/tickets/${ticket.id}`;

  const flex = {
    type: 'flex',
    altText: `⚙️ กำลังดำเนินการ ${ticket.ticket_no}`,
    contents: {
      type: 'bubble',
      header: header('⚙️', 'กำลังดำเนินการ', ticket.ticket_no, '#EA580C'),
      body: {
        type: 'box', layout: 'vertical', paddingAll: '14px', spacing: 'sm',
        contents: [
          row('📋 หัวข้อ',     ticket.title),
          sep(),
          row('👨‍💻 ผู้รับงาน',  ticket.admin_name || '-', '#EA580C'),
          row('🕐 รับงานเมื่อ', fmt(ticket.accepted_at)),
        ],
      },
      footer: footer([btn('📱 ติดตามสถานะ', url, '#EA580C')]),
    },
  };

  await pushMessage(ticket.line_user_id, [flex]);
}

// ════════════════════════════════════════════════════════════
// 4. USER — ปิดงานแล้ว + ให้คะแนน
// ════════════════════════════════════════════════════════════
async function notifyTicketResolved(ticket) {
  if (!ticket.line_user_id) return;
  const url  = `${LIFF_BASE()}/tickets/${ticket.id}`;
  const note = (ticket.resolution_note || '-').slice(0, 100) +
               ((ticket.resolution_note || '').length > 100 ? '...' : '');

  const flex = {
    type: 'flex',
    altText: `✅ ดำเนินการเสร็จสิ้น ${ticket.ticket_no}`,
    contents: {
      type: 'bubble',
      header: header('✅', 'ดำเนินการเสร็จสิ้น', ticket.ticket_no, '#16A34A'),
      body: {
        type: 'box', layout: 'vertical', paddingAll: '14px', spacing: 'sm',
        contents: [
          row('📋 หัวข้อ',     ticket.title),
          sep(),
          row('👨‍💻 ผู้แก้ไข',   ticket.admin_name || '-', '#16A34A'),
          row('🕐 เสร็จเมื่อ',  fmt(ticket.resolved_at)),
          sep(),
          { type: 'text', text: '🔧 วิธีแก้ปัญหา', color: '#6B7280', size: 'xs' },
          { type: 'text', text: note, color: '#111827', size: 'sm', wrap: true },
          sep(),
          {
            type: 'box', layout: 'vertical', paddingAll: '10px',
            backgroundColor: '#F0FDF4', cornerRadius: '8px',
            contents: [
              { type: 'text', text: '⭐ กรุณาประเมินความพึงพอใจ',
                color: '#16A34A', size: 'sm', weight: 'bold', align: 'center' },
              { type: 'text', text: 'ความคิดเห็นของท่านมีคุณค่ามาก 🙏',
                color: '#6B7280', size: 'xs', align: 'center', margin: 'xs' },
            ],
          },
        ],
      },
      footer: footer([
        btn('⭐ ให้คะแนนความพึงพอใจ', url, '#16A34A'),
        btn('📋 ดูรายละเอียด Ticket', url, '#6B7280'),
      ]),
    },
  };

  await pushMessage(ticket.line_user_id, [flex]);
  await saveNotif(ticket.id, ticket.user_id, 'TICKET_RESOLVED',
    `งานเสร็จสิ้น: ${ticket.ticket_no}`,
    `${ticket.title} ดำเนินการเสร็จสิ้นแล้ว`);
}

// ════════════════════════════════════════════════════════════
// 5. USER — Ticket ถูกยกเลิก
// ════════════════════════════════════════════════════════════
async function notifyTicketCancelled(ticket) {
  if (!ticket.line_user_id) return;

  const flex = {
    type: 'flex',
    altText: `❌ ยกเลิก Ticket ${ticket.ticket_no}`,
    contents: {
      type: 'bubble',
      header: header('❌', 'ยกเลิก Ticket', ticket.ticket_no, '#6B7280'),
      body: {
        type: 'box', layout: 'vertical', paddingAll: '14px', spacing: 'sm',
        contents: [
          row('📋 หัวข้อ',   ticket.title),
          sep(),
          row('📝 หมายเหตุ', ticket.cancel_reason || '-', '#6B7280'),
        ],
      },
    },
  };

  await pushMessage(ticket.line_user_id, [flex]);
}

// ─── save to notifications table ─────────────────────────────
async function saveNotif(ticketId, userId, type, title, message) {
  try {
    await pool.execute(
      `INSERT INTO notifications (ticket_id, user_id, type, channel, title, message, is_sent, sent_at)
       VALUES (?, ?, ?, 'LINE', ?, ?, 1, NOW())`,
      [ticketId, userId, type, title, message]
    );
  } catch (err) {
    logger.error('Save notification error:', err.message);
  }
}

module.exports = {
  pushMessage,
  notifyNewTicket,
  notifyTicketConfirmed,
  notifyTicketAccepted,
  notifyTicketResolved,
  notifyTicketCancelled,
};