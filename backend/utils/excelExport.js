// utils/excelExport.js — สร้างไฟล์ Excel รายงาน Ticket
const ExcelJS = require('exceljs');

// ────────────────────────────────────────────────
// config คอลัมน์
// ────────────────────────────────────────────────
const COLUMNS = [
  { header: 'Ticket No.',                  key: 'ticket_no',        width: 16 },
  { header: 'วันที่และเวลาแจ้ง',           key: 'opened_at',        width: 22 },
  { header: 'แผนกที่แจ้งซ่อม',            key: 'department_name',  width: 24 },
  { header: 'ผู้แจ้งซ่อม',               key: 'user_name',        width: 20 },
  { header: 'ประเภทปัญหา',               key: 'category_name',    width: 36 },
  { header: 'รายละเอียดปัญหา',           key: 'description',      width: 42 },
  { header: 'วันที่และเวลาปิดงาน',        key: 'resolved_at',      width: 22 },
  { header: 'สาเหตุ/วิธีแก้ปัญหา',      key: 'resolution_note',  width: 42 },
  { header: 'ระยะเวลาแก้ไขปัญหา',        key: 'resolve_time',     width: 22 },
  { header: 'ผู้รับงาน (Admin)',          key: 'admin_name',       width: 20 },
];

const HEADER_FILL   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
const HEADER_FONT   = { name: 'TH Sarabun New', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
const BODY_FONT     = { name: 'TH Sarabun New', size: 11 };
const BORDER_THIN   = { style: 'thin', color: { argb: 'FFD0D7E0' } };
const BORDER_ALL    = { top: BORDER_THIN, left: BORDER_THIN, bottom: BORDER_THIN, right: BORDER_THIN };

const ROW_EVEN_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4FA' } };
const ROW_ODD_FILL  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };

const STATUS_COLOR = {
  RESOLVED:    'FF16A34A',
  IN_PROGRESS: 'FFEA580C',
  OPEN:        'FFDC2626',
  CANCELLED:   'FF9CA3AF',
};

const fmtDateTime = (d) => {
  if (!d) return '-';
  return new Date(d).toLocaleString('th-TH', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
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

// ────────────────────────────────────────────────
async function buildTicketWorkbook({ rows, title, rangeLabel }) {
  const wb = new ExcelJS.Workbook();
  wb.creator  = 'IT Helpdesk System';
  wb.created  = new Date();

  // ── Sheet 1: รายงาน ──
  const ws = wb.addWorksheet('รายงาน Ticket', {
    pageSetup: {
      paperSize: 9,           // A4
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left:0.5, right:0.5, top:0.75, bottom:0.75, header:0.3, footer:0.3 },
    },
  });

  // ── Title row ──
  ws.mergeCells('A1:J1');
  const titleCell = ws.getCell('A1');
  titleCell.value = `รายงานการแจ้งซ่อม IT — ${title}`;
  titleCell.font  = { name:'TH Sarabun New', size:16, bold:true, color:{ argb:'FF1E3A5F' } };
  titleCell.alignment = { horizontal:'center', vertical:'middle' };
  ws.getRow(1).height = 30;

  // ── Sub-title: วันที่ Export + จำนวน ──
  ws.mergeCells('A2:J2');
  const subCell = ws.getCell('A2');
  subCell.value = `Export วันที่: ${fmtDateTime(new Date())}   |   จำนวน: ${rows.length} รายการ${rangeLabel ? `   |   ช่วง: ${rangeLabel}` : ''}`;
  subCell.font  = { name:'TH Sarabun New', size:11, italic:true, color:{ argb:'FF64748B' } };
  subCell.alignment = { horizontal:'center', vertical:'middle' };
  ws.getRow(2).height = 20;

  // ── blank row ──
  ws.getRow(3).height = 6;

  // ── Header row (row 4) ──
  ws.columns = COLUMNS.map(c => ({ key: c.key, width: c.width }));

  const headerRow = ws.getRow(4);
  COLUMNS.forEach((col, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value     = col.header;
    cell.font      = HEADER_FONT;
    cell.fill      = HEADER_FILL;
    cell.border    = BORDER_ALL;
    cell.alignment = { horizontal:'center', vertical:'middle', wrapText:true };
  });
  headerRow.height = 28;

  // ── freeze pane ──
  ws.views = [{ state:'frozen', xSplit:0, ySplit:4, topLeftCell:'A5' }];

  // ── Data rows ──
  rows.forEach((t, idx) => {
    const rowNum = idx + 5;
    const row    = ws.getRow(rowNum);
    const isEven = idx % 2 === 0;

    const data = {
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

    COLUMNS.forEach((col, ci) => {
      const cell = row.getCell(ci + 1);
      cell.value     = data[col.key];
      cell.font      = { ...BODY_FONT };
      cell.fill      = isEven ? ROW_EVEN_FILL : ROW_ODD_FILL;
      cell.border    = BORDER_ALL;
      cell.alignment = { vertical:'middle', wrapText: ['description','resolution_note'].includes(col.key) };

      // Ticket No. — bold + primary color
      if (col.key === 'ticket_no') {
        cell.font = { ...BODY_FONT, bold:true, color:{ argb:'FF2563EB' } };
        cell.alignment = { ...cell.alignment, horizontal:'center' };
      }
      // วันที่ — center
      if (['opened_at','resolved_at'].includes(col.key)) {
        cell.alignment = { ...cell.alignment, horizontal:'center' };
      }
      // ระยะเวลา — center
      if (col.key === 'resolve_time') {
        cell.alignment = { ...cell.alignment, horizontal:'center' };
      }
    });

    row.height = 22;
  });

  // ── Summary row ──
  const sumRowNum = rows.length + 5;
  const sumRow    = ws.getRow(sumRowNum);
  ws.mergeCells(`A${sumRowNum}:C${sumRowNum}`);
  const sumCell = ws.getCell(`A${sumRowNum}`);
  sumCell.value = `รวมทั้งหมด ${rows.length} รายการ`;
  sumCell.font  = { name:'TH Sarabun New', size:11, bold:true, color:{ argb:'FF1E3A5F' } };
  sumCell.fill  = { type:'pattern', pattern:'solid', fgColor:{ argb:'FFE8F0FA' } };
  sumCell.alignment = { horizontal:'center', vertical:'middle' };
  sumRow.height = 24;

  // count resolved
  const resolved = rows.filter(r => r.status === 'RESOLVED').length;
  ws.mergeCells(`D${sumRowNum}:F${sumRowNum}`);
  const resolvedCell = ws.getCell(`D${sumRowNum}`);
  resolvedCell.value = `เสร็จสิ้น: ${resolved} | กำลังดำเนินการ: ${rows.filter(r=>r.status==='IN_PROGRESS').length} | รอรับงาน: ${rows.filter(r=>r.status==='OPEN').length}`;
  resolvedCell.font  = { name:'TH Sarabun New', size:10, color:{ argb:'FF64748B' } };
  resolvedCell.fill  = { type:'pattern', pattern:'solid', fgColor:{ argb:'FFE8F0FA' } };
  resolvedCell.alignment = { horizontal:'center', vertical:'middle' };

  // ── Header/Footer ──
  ws.headerFooter.oddHeader = `&C&"TH Sarabun New,Bold"&14รายงานการแจ้งซ่อม IT`;
  ws.headerFooter.oddFooter = `&Lพิมพ์วันที่: ${new Date().toLocaleDateString('th-TH')}&Rหน้าที่ &P จาก &N`;

  // ── autoFilter ──
  ws.autoFilter = { from: { row:4, column:1 }, to: { row:4, column:COLUMNS.length } };

  return wb;
}

module.exports = { buildTicketWorkbook };