// utils/excelExport.js
const ExcelJS = require('exceljs');

// ─── Shared styles ────────────────────────────────────────────────
const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
const HEADER_FONT = { name: 'TH Sarabun New', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
const BODY_FONT   = { name: 'TH Sarabun New', size: 11 };
const BORDER_THIN = { style: 'thin', color: { argb: 'FFD0D7E0' } };
const BORDER_ALL  = { top: BORDER_THIN, left: BORDER_THIN, bottom: BORDER_THIN, right: BORDER_THIN };
const ROW_EVEN    = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4FA' } };
const ROW_ODD     = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };

const fmtDateTime = (d) => {
  if (!d) return '-';
  return new Date(d).toLocaleString('th-TH', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const fmtDate = (d) => {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('th-TH', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

const minsToText = (m) => {
  if (m == null || m === '') return '-';
  const n = Number(m);
  if (isNaN(n)) return '-';
  if (n < 60)   return `${n} นาที`;
  if (n < 1440) return `${Math.floor(n/60)} ชม. ${n%60} นาที`;
  return `${Math.floor(n/1440)} วัน ${Math.floor((n%1440)/60)} ชม.`;
};

// ─── Helper: สร้าง title + sub-title rows ─────────────────────────
function addTitleRows(ws, title, subtitle, colCount) {
  const lastCol = String.fromCharCode(64 + colCount);

  ws.mergeCells(`A1:${lastCol}1`);
  const t = ws.getCell('A1');
  t.value     = title;
  t.font      = { name: 'TH Sarabun New', size: 16, bold: true, color: { argb: 'FF1E3A5F' } };
  t.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 30;

  ws.mergeCells(`A2:${lastCol}2`);
  const s = ws.getCell('A2');
  s.value     = subtitle;
  s.font      = { name: 'TH Sarabun New', size: 11, italic: true, color: { argb: 'FF64748B' } };
  s.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(2).height = 20;
  ws.getRow(3).height = 6;
}

// ─── Helper: สร้าง header row ─────────────────────────────────────
function addHeaderRow(ws, columns, rowNum = 4) {
  const row = ws.getRow(rowNum);
  columns.forEach((col, i) => {
    const cell     = row.getCell(i + 1);
    cell.value     = col.header;
    cell.font      = HEADER_FONT;
    cell.fill      = HEADER_FILL;
    cell.border    = BORDER_ALL;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  });
  row.height = 28;
  ws.views = [{ state: 'frozen', xSplit: 0, ySplit: rowNum, topLeftCell: `A${rowNum + 1}` }];
  ws.autoFilter = { from: { row: rowNum, column: 1 }, to: { row: rowNum, column: columns.length } };
}

// ─── Helper: เพิ่ม data rows ──────────────────────────────────────
function addDataRows(ws, columns, dataRows, startRow = 5, centerKeys = [], boldKeys = []) {
  dataRows.forEach((r, idx) => {
    const row    = ws.getRow(startRow + idx);
    const isEven = idx % 2 === 0;
    columns.forEach((col, ci) => {
      const cell     = row.getCell(ci + 1);
      cell.value     = r[col.key] ?? '-';
      cell.font      = { ...BODY_FONT };
      cell.fill      = isEven ? ROW_EVEN : ROW_ODD;
      cell.border    = BORDER_ALL;
      cell.alignment = { vertical: 'middle', horizontal: centerKeys.includes(col.key) ? 'center' : 'left' };
      if (boldKeys.includes(col.key)) cell.font = { ...BODY_FONT, bold: true, color: { argb: 'FF2563EB' } };
    });
    row.height = 22;
  });
}

// ══════════════════════════════════════════════════════════════════
// 1. buildTicketWorkbook — รายงาน Ticket (เดิม ไม่แตะ)
// ══════════════════════════════════════════════════════════════════
const TICKET_COLS = [
  { header: 'Ticket No.',           key: 'ticket_no',       width: 16 },
  { header: 'วันที่และเวลาแจ้ง',    key: 'opened_at',       width: 22 },
  { header: 'แผนกที่แจ้งซ่อม',     key: 'department_name', width: 24 },
  { header: 'ผู้แจ้งซ่อม',         key: 'user_name',       width: 20 },
  { header: 'ประเภทปัญหา',         key: 'category_name',   width: 36 },
  { header: 'รายละเอียดปัญหา',     key: 'description',     width: 42 },
  { header: 'วันที่และเวลาปิดงาน', key: 'resolved_at',     width: 22 },
  { header: 'สาเหตุ/วิธีแก้ปัญหา', key: 'resolution_note', width: 42 },
  { header: 'ระยะเวลาแก้ไขปัญหา', key: 'resolve_time',    width: 22 },
  { header: 'ผู้รับงาน (Admin)',    key: 'admin_name',      width: 20 },
];

async function buildTicketWorkbook({ rows, title, rangeLabel }) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'IT Helpdesk System';
  wb.created = new Date();

  const ws = wb.addWorksheet('รายงาน Ticket', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0,
      margins: { left:0.5, right:0.5, top:0.75, bottom:0.75, header:0.3, footer:0.3 } },
  });

  addTitleRows(ws,
    `รายงานการแจ้งซ่อม IT — ${title}`,
    `Export วันที่: ${fmtDateTime(new Date())}   |   จำนวน: ${rows.length} รายการ${rangeLabel ? `   |   ช่วง: ${rangeLabel}` : ''}`,
    TICKET_COLS.length
  );

  ws.columns = TICKET_COLS.map(c => ({ key: c.key, width: c.width }));
  addHeaderRow(ws, TICKET_COLS);

  rows.forEach((t, idx) => {
    const row    = ws.getRow(idx + 5);
    const isEven = idx % 2 === 0;
    const data   = {
      ticket_no:       t.ticket_no || '-',
      opened_at:       fmtDateTime(t.opened_at),
      department_name: t.department_name || '-',
      user_name:       t.user_name || '-',
      category_name:   t.category_name || '-',
      description:     (t.description || '-').replace(/\n/g, ' '),
      resolved_at:     fmtDateTime(t.resolved_at),
      resolution_note: (t.resolution_note || '-').replace(/\n/g, ' '),
      resolve_time:    minsToText(t.resolve_minutes),
      admin_name:      t.admin_name || '-',
    };
    TICKET_COLS.forEach((col, ci) => {
      const cell = row.getCell(ci + 1);
      cell.value     = data[col.key];
      cell.font      = { ...BODY_FONT };
      cell.fill      = isEven ? ROW_EVEN : ROW_ODD;
      cell.border    = BORDER_ALL;
      cell.alignment = { vertical: 'middle', wrapText: ['description','resolution_note'].includes(col.key) };
      if (col.key === 'ticket_no') { cell.font = { ...BODY_FONT, bold:true, color:{ argb:'FF2563EB' } }; cell.alignment = { ...cell.alignment, horizontal:'center' }; }
      if (['opened_at','resolved_at','resolve_time'].includes(col.key)) cell.alignment = { ...cell.alignment, horizontal:'center' };
    });
    row.height = 22;
  });

  // summary row
  const sumRow = rows.length + 5;
  ws.mergeCells(`A${sumRow}:C${sumRow}`);
  const sc = ws.getCell(`A${sumRow}`);
  sc.value = `รวมทั้งหมด ${rows.length} รายการ`;
  sc.font  = { name:'TH Sarabun New', size:11, bold:true, color:{ argb:'FF1E3A5F' } };
  sc.fill  = { type:'pattern', pattern:'solid', fgColor:{ argb:'FFE8F0FA' } };
  sc.alignment = { horizontal:'center', vertical:'middle' };
  ws.getRow(sumRow).height = 24;
  ws.mergeCells(`D${sumRow}:F${sumRow}`);
  const rc = ws.getCell(`D${sumRow}`);
  rc.value = `เสร็จสิ้น: ${rows.filter(r=>r.status==='RESOLVED').length} | กำลังดำเนิน: ${rows.filter(r=>r.status==='IN_PROGRESS').length} | รอรับงาน: ${rows.filter(r=>r.status==='OPEN').length}`;
  rc.font  = { name:'TH Sarabun New', size:10, color:{ argb:'FF64748B' } };
  rc.fill  = { type:'pattern', pattern:'solid', fgColor:{ argb:'FFE8F0FA' } };
  rc.alignment = { horizontal:'center', vertical:'middle' };

  ws.headerFooter.oddHeader = `&C&"TH Sarabun New,Bold"&14รายงานการแจ้งซ่อม IT`;
  ws.headerFooter.oddFooter = `&Lพิมพ์วันที่: ${new Date().toLocaleDateString('th-TH')}&Rหน้าที่ &P จาก &N`;

  return wb;
}

// ══════════════════════════════════════════════════════════════════
// 2. buildSlaWorkbook — รายงาน SLA Performance
// ══════════════════════════════════════════════════════════════════
async function buildSlaWorkbook({ byDept, byCategory, rangeLabel }) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'IT Helpdesk System';
  wb.created = new Date();

  // Sheet 1: SLA รายแผนก
  const ws1 = wb.addWorksheet('SLA รายแผนก');
  const DEPT_COLS = [
    { header: 'แผนก',               key: 'department_name',    width: 28 },
    { header: 'Ticket ทั้งหมด',     key: 'total',              width: 16 },
    { header: 'ทันเวลา',            key: 'on_time',            width: 14 },
    { header: 'เกิน SLA',           key: 'breached',           width: 14 },
    { header: '% ทันเวลา',          key: 'on_time_pct',        width: 14 },
    { header: 'เฉลี่ยแก้ไข',        key: 'avg_resolve',        width: 18 },
    { header: 'เร็วสุด (min)',       key: 'min_resolve',        width: 18 },
    { header: 'ช้าสุด (max)',        key: 'max_resolve',        width: 18 },
  ];
  ws1.columns = DEPT_COLS.map(c => ({ key: c.key, width: c.width }));
  addTitleRows(ws1, `รายงาน SLA รายแผนก${rangeLabel ? ` — ${rangeLabel}` : ''}`,
    `Export วันที่: ${fmtDateTime(new Date())}   |   จำนวน ${byDept.length} แผนก`, DEPT_COLS.length);
  addHeaderRow(ws1, DEPT_COLS);
  const deptData = byDept.map(r => ({
    department_name: r.department_name || '-',
    total:           Number(r.total || 0),
    on_time:         Number(r.on_time || 0),
    breached:        Number(r.breached || 0),
    on_time_pct:     `${r.on_time_pct || 0}%`,
    avg_resolve:     minsToText(r.avg_resolve_minutes),
    min_resolve:     minsToText(r.min_resolve_minutes),
    max_resolve:     minsToText(r.max_resolve_minutes),
  }));
  addDataRows(ws1, DEPT_COLS, deptData, 5, ['total','on_time','breached','on_time_pct','avg_resolve','min_resolve','max_resolve']);

  // Sheet 2: SLA รายประเภท
  const ws2 = wb.addWorksheet('SLA รายประเภทปัญหา');
  const CAT_COLS = [
    { header: 'ประเภทปัญหา',        key: 'category_name',   width: 36 },
    { header: 'SLA เป้าหมาย',       key: 'sla_target',      width: 18 },
    { header: 'Ticket ทั้งหมด',     key: 'total',           width: 16 },
    { header: 'ทันเวลา',            key: 'on_time',         width: 14 },
    { header: 'เกิน SLA',           key: 'breached',        width: 14 },
    { header: '% ทันเวลา',          key: 'on_time_pct',     width: 14 },
    { header: 'เฉลี่ยแก้ไข',        key: 'avg_resolve',     width: 18 },
    { header: 'เร็วสุด (min)',       key: 'min_resolve',     width: 18 },
    { header: 'ช้าสุด (max)',        key: 'max_resolve',     width: 18 },
    { header: 'สถานะ',              key: 'status',          width: 14 },
  ];
  ws2.columns = CAT_COLS.map(c => ({ key: c.key, width: c.width }));
  addTitleRows(ws2, `รายงาน SLA รายประเภทปัญหา${rangeLabel ? ` — ${rangeLabel}` : ''}`,
    `Export วันที่: ${fmtDateTime(new Date())}   |   จำนวน ${byCategory.length} ประเภท`, CAT_COLS.length);
  addHeaderRow(ws2, CAT_COLS);
  const catData = byCategory.map(r => ({
    category_name: r.category_name || '-',
    sla_target:    minsToText(r.sla_target),
    total:         Number(r.total || 0),
    on_time:       Number(r.on_time || 0),
    breached:      Number(r.breached || 0),
    on_time_pct:   `${r.on_time_pct || 0}%`,
    avg_resolve:   minsToText(r.avg_resolve_minutes),
    min_resolve:   minsToText(r.min_resolve_minutes),
    max_resolve:   minsToText(r.max_resolve_minutes),
    status:        Number(r.on_time_pct || 0) >= 90 ? '✅ ทัน SLA' : '⚠️ ใกล้เกิน',
  }));
  addDataRows(ws2, CAT_COLS, catData, 5, ['total','on_time','breached','on_time_pct','avg_resolve','min_resolve','max_resolve','status']);

  return wb;
}

// ══════════════════════════════════════════════════════════════════
// 3. buildAgingWorkbook — รายงาน Ticket ค้างนาน
// ══════════════════════════════════════════════════════════════════
async function buildAgingWorkbook({ rows, days, rangeLabel }) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'IT Helpdesk System';
  wb.created = new Date();

  const ws = wb.addWorksheet('Ticket ค้างนาน');
  const COLS = [
    { header: 'Ticket No.',    key: 'ticket_no',       width: 16 },
    { header: 'หัวข้อ',        key: 'title',           width: 36 },
    { header: 'ผู้แจ้ง',       key: 'user_name',       width: 20 },
    { header: 'แผนก',          key: 'department_name', width: 24 },
    { header: 'ประเภทปัญหา',   key: 'category_name',   width: 28 },
    { header: 'สถานะ',         key: 'status_th',       width: 16 },
    { header: 'วันที่แจ้ง',    key: 'opened_at_fmt',   width: 22 },
    { header: 'ค้างมา (วัน)',  key: 'age_days',        width: 14 },
    { header: 'ค้างมา (ชม.)',  key: 'age_hours',       width: 14 },
    { header: 'SLA',           key: 'sla_status_th',   width: 14 },
  ];
  ws.columns = COLS.map(c => ({ key: c.key, width: c.width }));
  addTitleRows(ws,
    `รายงาน Ticket ค้างนานเกิน ${days} วัน`,
    `Export วันที่: ${fmtDateTime(new Date())}   |   จำนวน ${rows.length} รายการ${rangeLabel ? `   |   ช่วง: ${rangeLabel}` : ''}`,
    COLS.length
  );
  addHeaderRow(ws, COLS);
  const data = rows.map(r => ({
    ticket_no:       r.ticket_no || '-',
    title:           r.title || '-',
    user_name:       r.user_name || '-',
    department_name: r.department_name || '-',
    category_name:   r.category_name || '-',
    status_th:       r.status === 'OPEN' ? 'รอรับงาน' : 'กำลังดำเนิน',
    opened_at_fmt:   fmtDateTime(r.opened_at),
    age_days:        Number(r.age_days || 0),
    age_hours:       Number(r.age_hours || 0),
    sla_status_th:   r.sla_status === 'BREACHED' ? '⚠️ เกิน SLA' : '-',
  }));
  addDataRows(ws, COLS, data, 5, ['age_days','age_hours','status_th','sla_status_th'], ['ticket_no']);

  return wb;
}

// ══════════════════════════════════════════════════════════════════
// 4. buildAdminWorkbook — รายงาน Admin Workload
// ══════════════════════════════════════════════════════════════════
async function buildAdminWorkbook({ rows, rangeLabel }) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'IT Helpdesk System';
  wb.created = new Date();

  const ws = wb.addWorksheet('Admin Workload');
  const COLS = [
    { header: 'Admin',              key: 'admin_name',       width: 24 },
    { header: 'รับงานทั้งหมด',     key: 'assigned',         width: 16 },
    { header: 'เสร็จสิ้น',         key: 'resolved',         width: 14 },
    { header: 'กำลังดำเนิน',       key: 'in_progress',      width: 16 },
    { header: 'เฉลี่ยแก้ไข (avg)', key: 'avg_mins_txt',     width: 20 },
    { header: 'เร็วสุด (min)',      key: 'min_mins_txt',     width: 18 },
    { header: 'ช้าสุด (max)',       key: 'max_mins_txt',     width: 18 },
    { header: 'ความพึงพอใจ',       key: 'avg_satisfaction', width: 16 },
    { header: 'จำนวนรีวิว',        key: 'rated_count',      width: 14 },
  ];
  ws.columns = COLS.map(c => ({ key: c.key, width: c.width }));
  addTitleRows(ws,
    `รายงาน Admin Workload${rangeLabel ? ` — ${rangeLabel}` : ''}`,
    `Export วันที่: ${fmtDateTime(new Date())}   |   จำนวน ${rows.length} คน`,
    COLS.length
  );
  addHeaderRow(ws, COLS);
  const data = rows.map(r => ({
    admin_name:       r.admin_name || '-',
    assigned:         Number(r.assigned || 0),
    resolved:         Number(r.resolved || 0),
    in_progress:      Number(r.in_progress || 0),
    avg_mins_txt:     minsToText(r.avg_mins),
    min_mins_txt:     minsToText(r.min_mins),
    max_mins_txt:     minsToText(r.max_mins),
    avg_satisfaction: r.avg_satisfaction ? `${parseFloat(r.avg_satisfaction).toFixed(1)} / 5.0` : '-',
    rated_count:      Number(r.rated_count || 0),
  }));
  addDataRows(ws, COLS, data, 5, ['assigned','resolved','in_progress','avg_mins_txt','min_mins_txt','max_mins_txt','avg_satisfaction','rated_count']);

  return wb;
}

// ══════════════════════════════════════════════════════════════════
// 5. buildBreakdownWorkbook — รายงาน ประเภทปัญหาตามแผนก
// ══════════════════════════════════════════════════════════════════
async function buildBreakdownWorkbook({ rows, rangeLabel }) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'IT Helpdesk System';
  wb.created = new Date();

  const ws = wb.addWorksheet('ประเภทปัญหาตามแผนก');
  const COLS = [
    { header: 'แผนก',            key: 'department_name', width: 28 },
    { header: 'ประเภทปัญหา',     key: 'category_name',   width: 36 },
    { header: 'ทั้งหมด',         key: 'total',           width: 12 },
    { header: 'เสร็จสิ้น',       key: 'resolved',        width: 12 },
    { header: 'กำลังดำเนิน',     key: 'in_progress',     width: 14 },
    { header: 'รอรับงาน',        key: 'open_tickets',    width: 12 },
    { header: 'ยกเลิก',          key: 'cancelled',       width: 12 },
  ];
  ws.columns = COLS.map(c => ({ key: c.key, width: c.width }));
  addTitleRows(ws,
    `รายงานประเภทปัญหาตามแผนก${rangeLabel ? ` — ${rangeLabel}` : ''}`,
    `Export วันที่: ${fmtDateTime(new Date())}   |   จำนวน ${rows.length} รายการ`,
    COLS.length
  );
  addHeaderRow(ws, COLS);
  const data = rows.map(r => ({
    department_name: r.department_name || '-',
    category_name:   r.category_name || '-',
    total:           Number(r.total || 0),
    resolved:        Number(r.resolved || 0),
    in_progress:     Number(r.in_progress || 0),
    open_tickets:    Number(r.open_tickets || 0),
    cancelled:       Number(r.cancelled || 0),
  }));
  addDataRows(ws, COLS, data, 5, ['total','resolved','in_progress','open_tickets','cancelled']);

  return wb;
}

module.exports = {
  buildTicketWorkbook,
  buildSlaWorkbook,
  buildAgingWorkbook,
  buildAdminWorkbook,
  buildBreakdownWorkbook,
};