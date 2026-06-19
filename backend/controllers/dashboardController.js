// controllers/dashboardController.js
const { pool } = require('../config/db');
const response = require('../utils/response');

// ==================================================================
// GET /api/dashboard/summary
// ==================================================================
exports.getSummary = async (req, res) => {
  const [summary] = await pool.execute('SELECT * FROM v_dashboard_summary');
  const [recent]  = await pool.execute('SELECT * FROM v_tickets_full ORDER BY opened_at DESC LIMIT 10');
  const [slaData] = await pool.execute(`SELECT sla_status, COUNT(*) AS count FROM tickets WHERE status = 'RESOLVED' GROUP BY sla_status`);
  return response.success(res, { summary: summary[0], recentTickets: recent, slaData });
};

// ==================================================================
// GET /api/dashboard/chart/monthly
// ==================================================================
exports.getMonthlyChart = async (req, res) => {
  const { range = 'all', dateFrom, dateTo } = req.query;
  let where = '1=1';
  const params = [];
  if (range === 'today')       where += ' AND DATE(opened_at) = CURDATE()';
  else if (range === 'week')   where += ' AND opened_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
  else if (range === 'month')  where += ' AND opened_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
  else if (range === 'year')   where += ' AND YEAR(opened_at) = YEAR(NOW())';
  else if (range === 'custom' && dateFrom && dateTo) { where += ' AND DATE(opened_at) BETWEEN ? AND ?'; params.push(dateFrom, dateTo); }

  let labelExpr, sortExpr;
  if (range === 'today') { labelExpr = "DATE_FORMAT(opened_at,'%H:00')"; sortExpr = "DATE_FORMAT(opened_at,'%H')"; }
  else if (range === 'week') { labelExpr = "DATE_FORMAT(opened_at,'%d/%m/%y')"; sortExpr = "DATE(opened_at)"; }
  else if (range === 'custom' && dateFrom && dateTo) {
    const diffDays = Math.ceil((new Date(dateTo) - new Date(dateFrom)) / 86400000);
    if (diffDays <= 60) { labelExpr = "DATE_FORMAT(opened_at,'%d/%m/%y')"; sortExpr = "DATE(opened_at)"; }
    else { labelExpr = "DATE_FORMAT(opened_at,'%b %Y')"; sortExpr = "DATE_FORMAT(opened_at,'%Y-%m')"; }
  } else { labelExpr = "DATE_FORMAT(opened_at,'%b %Y')"; sortExpr = "DATE_FORMAT(opened_at,'%Y-%m')"; }

  const [rows] = await pool.query(
    `SELECT ${labelExpr} AS period_label, ${sortExpr} AS period_sort,
       COUNT(*) AS total, SUM(status='RESOLVED') AS resolved,
       SUM(status IN ('OPEN','IN_PROGRESS')) AS in_progress, SUM(status='CANCELLED') AS cancelled
     FROM tickets WHERE ${where}
     GROUP BY ${labelExpr}, ${sortExpr} ORDER BY ${sortExpr}`, params);
  return response.success(res, rows);
};

// ==================================================================
// GET /api/dashboard/chart/category
// ==================================================================
exports.getCategoryChart = async (req, res) => {
  const { range = 'all' } = req.query;
  let dateFilter = '';
  if (range === 'today')      dateFilter = "AND DATE(t.opened_at) = CURDATE()";
  else if (range === 'week')  dateFilter = "AND t.opened_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
  else if (range === 'month') dateFilter = "AND t.opened_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";

  if (!dateFilter) {
    const [rows] = await pool.execute('SELECT * FROM v_report_by_category ORDER BY total_tickets DESC');
    return response.success(res, rows);
  }
  const [rows] = await pool.query(
    `SELECT c.id, c.name AS category_name, c.code AS category_code, c.sla_minutes,
       COUNT(t.id) AS total_tickets, SUM(t.status='RESOLVED') AS resolved,
       SUM(t.status IN ('OPEN','IN_PROGRESS')) AS pending, SUM(t.sla_status='BREACHED') AS sla_breached,
       ROUND(AVG(t.satisfaction_score),2) AS avg_satisfaction,
       ROUND(AVG(CASE WHEN t.status='RESOLVED' THEN TIMESTAMPDIFF(MINUTE,t.opened_at,t.resolved_at) END),0) AS avg_resolve_minutes
     FROM categories c LEFT JOIN tickets t ON t.category_id=c.id ${dateFilter}
     GROUP BY c.id,c.name,c.code,c.sla_minutes ORDER BY total_tickets DESC`);
  return response.success(res, rows);
};

// ==================================================================
// GET /api/dashboard/chart/department
// ==================================================================
exports.getDepartmentChart = async (req, res) => {
  const { range = 'all' } = req.query;
  let dateFilter = '';
  if (range === 'today')      dateFilter = "AND DATE(t.opened_at) = CURDATE()";
  else if (range === 'week')  dateFilter = "AND t.opened_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
  else if (range === 'month') dateFilter = "AND t.opened_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
  else if (range === 'year')  dateFilter = "AND YEAR(t.opened_at) = YEAR(NOW())";
  const subWhere = dateFilter ? `AND t.opened_at IS NOT NULL ${dateFilter}` : '';
  const [rows] = await pool.query(
    `SELECT d.id AS department_id, d.name AS department_name, COUNT(t.id) AS cnt,
       SUM(t.status='RESOLVED') AS resolved, SUM(t.status='IN_PROGRESS') AS in_progress,
       SUM(t.status='CANCELLED') AS cancelled, SUM(t.status='OPEN') AS open_tickets
     FROM departments d LEFT JOIN users u ON u.department_id=d.id
     LEFT JOIN tickets t ON t.user_id=u.id ${subWhere}
     GROUP BY d.id,d.name HAVING cnt>0 ORDER BY cnt DESC LIMIT 10`);
  return response.success(res, rows.map(r => ({ ...r, total_tickets: r.cnt })));
};

// ==================================================================
// GET /api/dashboard/chart/department/all
// ==================================================================
exports.getAllDeptChart = async (req, res) => {
  const { range = 'all' } = req.query;
  let dateFilter = '';
  if (range === 'today')      dateFilter = "AND DATE(t.opened_at) = CURDATE()";
  else if (range === 'week')  dateFilter = "AND t.opened_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
  else if (range === 'month') dateFilter = "AND t.opened_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
  else if (range === 'year')  dateFilter = "AND YEAR(t.opened_at) = YEAR(NOW())";
  const subWhere = dateFilter ? `AND t.opened_at IS NOT NULL ${dateFilter}` : '';
  const [rows] = await pool.query(
    `SELECT d.id AS department_id, d.name AS department_name, COUNT(t.id) AS cnt,
       SUM(t.status='RESOLVED') AS resolved, SUM(t.status='IN_PROGRESS') AS in_progress,
       SUM(t.status='CANCELLED') AS cancelled, SUM(t.status='OPEN') AS open_tickets
     FROM departments d LEFT JOIN users u ON u.department_id=d.id
     LEFT JOIN tickets t ON t.user_id=u.id ${subWhere}
     GROUP BY d.id,d.name HAVING cnt>0 ORDER BY cnt DESC`);
  return response.success(res, rows.map(r => ({ ...r, total_tickets: r.cnt })));
};

// ==================================================================
// GET /api/dashboard/chart/dept-breakdown
// ==================================================================
exports.getDeptBreakdown = async (req, res) => {
  const { deptId, range = 'all', categoryCode } = req.query;

  let dateFilter = '';
  if (range === 'today')      dateFilter = "AND DATE(t.opened_at) = CURDATE()";
  else if (range === 'week')  dateFilter = "AND t.opened_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
  else if (range === 'month') dateFilter = "AND t.opened_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
  else if (range === 'year')  dateFilter = "AND YEAR(t.opened_at) = YEAR(NOW())";

  const conditions = ['1=1'];
  const params = [];

  if (deptId) { conditions.push('d.id = ?'); params.push(deptId); }
  if (categoryCode) { conditions.push('c.code = ?'); params.push(categoryCode); }

  const [rows] = await pool.query(
    `SELECT d.id AS department_id, d.name AS department_name,
       c.code AS category_code, c.name AS category_name,
       COUNT(t.id) AS total, SUM(t.status='RESOLVED') AS resolved,
       SUM(t.status='IN_PROGRESS') AS in_progress, SUM(t.status='CANCELLED') AS cancelled,
       SUM(t.status='OPEN') AS open_tickets
     FROM departments d LEFT JOIN users u ON u.department_id=d.id
     LEFT JOIN tickets t ON t.user_id=u.id ${dateFilter}
     LEFT JOIN categories c ON c.id=t.category_id
     WHERE ${conditions.join(' AND ')}
     GROUP BY d.id,d.name,c.code,c.name HAVING total>0 ORDER BY d.name,total DESC`,
    params
  );
  return response.success(res, rows);
};

// ==================================================================
// GET /api/dashboard/report/sla-by-dept
// ==================================================================
exports.getSlaByDept = async (req, res) => {
  const { range = 'all', dateFrom, dateTo } = req.query;
  let dateFilter = ''; const params = [];
  if (range === 'today')      dateFilter = "AND DATE(t.opened_at) = CURDATE()";
  else if (range === 'week')  dateFilter = "AND t.opened_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
  else if (range === 'month') dateFilter = "AND t.opened_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
  else if (range === 'year')  dateFilter = "AND YEAR(t.opened_at) = YEAR(NOW())";
  else if (range === 'custom' && dateFrom && dateTo) { dateFilter = "AND DATE(t.opened_at) BETWEEN ? AND ?"; params.push(dateFrom, dateTo); }
  const [rows] = await pool.query(
    `SELECT d.name AS department_name, COUNT(t.id) AS total,
       SUM(t.sla_status='ON_TIME') AS on_time, SUM(t.sla_status='BREACHED') AS breached,
       ROUND(SUM(t.sla_status='ON_TIME')*100/NULLIF(COUNT(t.id),0),1) AS on_time_pct,
       ROUND(AVG(CASE WHEN t.status='RESOLVED' THEN TIMESTAMPDIFF(MINUTE,t.opened_at,t.resolved_at) END),0) AS avg_resolve_minutes,
       MIN(CASE WHEN t.status='RESOLVED' THEN TIMESTAMPDIFF(MINUTE,t.opened_at,t.resolved_at) END) AS min_resolve_minutes,
       MAX(CASE WHEN t.status='RESOLVED' THEN TIMESTAMPDIFF(MINUTE,t.opened_at,t.resolved_at) END) AS max_resolve_minutes
     FROM departments d LEFT JOIN users u ON u.department_id=d.id
     LEFT JOIN tickets t ON t.user_id=u.id AND t.sla_status IS NOT NULL ${dateFilter}
     GROUP BY d.id,d.name HAVING total>0 ORDER BY on_time_pct ASC`, params);
  return response.success(res, rows);
};

// ==================================================================
// GET /api/dashboard/report/sla-by-category
// ==================================================================
exports.getSlaByCategory = async (req, res) => {
  const { range = 'all', dateFrom, dateTo } = req.query;
  let dateFilter = ''; const params = [];
  if (range === 'today')      dateFilter = "AND DATE(t.opened_at) = CURDATE()";
  else if (range === 'week')  dateFilter = "AND t.opened_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
  else if (range === 'month') dateFilter = "AND t.opened_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
  else if (range === 'year')  dateFilter = "AND YEAR(t.opened_at) = YEAR(NOW())";
  else if (range === 'custom' && dateFrom && dateTo) { dateFilter = "AND DATE(t.opened_at) BETWEEN ? AND ?"; params.push(dateFrom, dateTo); }
  const [rows] = await pool.query(
    `SELECT c.name AS category_name, c.code AS category_code, c.sla_minutes AS sla_target,
       COUNT(t.id) AS total, SUM(t.sla_status='ON_TIME') AS on_time, SUM(t.sla_status='BREACHED') AS breached,
       ROUND(SUM(t.sla_status='ON_TIME')*100/NULLIF(COUNT(t.id),0),1) AS on_time_pct,
       ROUND(AVG(CASE WHEN t.status='RESOLVED' THEN TIMESTAMPDIFF(MINUTE,t.opened_at,t.resolved_at) END),0) AS avg_resolve_minutes,
       MIN(CASE WHEN t.status='RESOLVED' THEN TIMESTAMPDIFF(MINUTE,t.opened_at,t.resolved_at) END) AS min_resolve_minutes,
       MAX(CASE WHEN t.status='RESOLVED' THEN TIMESTAMPDIFF(MINUTE,t.opened_at,t.resolved_at) END) AS max_resolve_minutes
     FROM categories c LEFT JOIN tickets t ON t.category_id=c.id AND t.sla_status IS NOT NULL ${dateFilter}
     GROUP BY c.id,c.name,c.code,c.sla_minutes HAVING total>0 ORDER BY on_time_pct ASC`, params);
  return response.success(res, rows);
};

// ==================================================================
// GET /api/dashboard/report/sla-monthly-trend
// ==================================================================
exports.getSlaMonthlyTrend = async (req, res) => {
  const { months = 12 } = req.query;
  const [rows] = await pool.query(
    `SELECT DATE_FORMAT(t.opened_at,'%b %Y') AS period_label,
       DATE_FORMAT(t.opened_at,'%Y-%m') AS period_sort,
       COUNT(t.id) AS total, SUM(t.sla_status='ON_TIME') AS on_time, SUM(t.sla_status='BREACHED') AS breached,
       ROUND(SUM(t.sla_status='ON_TIME')*100/NULLIF(COUNT(t.id),0),1) AS on_time_pct,
       ROUND(AVG(CASE WHEN t.status='RESOLVED' THEN TIMESTAMPDIFF(MINUTE,t.opened_at,t.resolved_at) END),0) AS avg_resolve_minutes
     FROM tickets t WHERE t.sla_status IS NOT NULL AND t.opened_at >= DATE_SUB(NOW(), INTERVAL ? MONTH)
     GROUP BY period_label,period_sort ORDER BY period_sort ASC`, [Number(months)]);
  return response.success(res, rows);
};

// ==================================================================
// GET /api/dashboard/report/admin-workload
// ==================================================================
exports.getAdminWorkload = async (req, res) => {
  const { range = 'month', dateFrom, dateTo } = req.query;
  let dateFilter = ''; const params = [];
  if (range === 'today')      dateFilter = "AND DATE(t.opened_at) = CURDATE()";
  else if (range === 'week')  dateFilter = "AND t.opened_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
  else if (range === 'month') dateFilter = "AND t.opened_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
  else if (range === 'year')  dateFilter = "AND YEAR(t.opened_at) = YEAR(NOW())";
  else if (range === 'custom' && dateFrom && dateTo) { dateFilter = "AND DATE(t.opened_at) BETWEEN ? AND ?"; params.push(dateFrom, dateTo); }
  const [rows] = await pool.query(
    `SELECT CONCAT(u.first_name,' ',u.last_name) AS admin_name,
       COUNT(t.id) AS assigned, SUM(t.status='RESOLVED') AS resolved,
       SUM(t.status='IN_PROGRESS') AS in_progress,
       ROUND(AVG(CASE WHEN t.status='RESOLVED' THEN TIMESTAMPDIFF(MINUTE,t.opened_at,t.resolved_at) END),0) AS avg_mins,
       MIN(CASE WHEN t.status='RESOLVED' THEN TIMESTAMPDIFF(MINUTE,t.opened_at,t.resolved_at) END) AS min_mins,
       MAX(CASE WHEN t.status='RESOLVED' THEN TIMESTAMPDIFF(MINUTE,t.opened_at,t.resolved_at) END) AS max_mins,
       ROUND(AVG(CASE WHEN t.satisfaction_score IS NOT NULL THEN t.satisfaction_score END),1) AS avg_satisfaction,
       COUNT(CASE WHEN t.satisfaction_score IS NOT NULL THEN 1 END) AS rated_count
     FROM users u LEFT JOIN tickets t ON t.assigned_to=u.id ${dateFilter}
     WHERE u.role IN ('ADMIN','SUPERVISOR')
     GROUP BY u.id,u.first_name,u.last_name HAVING assigned>0 ORDER BY resolved DESC`, params);
  return response.success(res, rows);
};

// ==================================================================
// GET /api/dashboard/report/mttr
// ==================================================================
exports.getMttr = async (req, res) => {
  const { range = 'month' } = req.query;
  let dateFilter = '';
  if (range === 'today')      dateFilter = "AND DATE(t.opened_at) = CURDATE()";
  else if (range === 'week')  dateFilter = "AND t.opened_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
  else if (range === 'month') dateFilter = "AND t.opened_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
  else if (range === 'year')  dateFilter = "AND YEAR(t.opened_at) = YEAR(NOW())";
  const [rows] = await pool.query(
    `SELECT c.name AS category_name, c.code, c.sla_minutes, COUNT(t.id) AS total,
       ROUND(AVG(CASE WHEN t.accepted_at IS NOT NULL THEN TIMESTAMPDIFF(MINUTE,t.opened_at,t.accepted_at) END),0) AS avg_accept_mins,
       ROUND(AVG(CASE WHEN t.status='RESOLVED' THEN TIMESTAMPDIFF(MINUTE,t.opened_at,t.resolved_at) END),0) AS avg_resolve_mins
     FROM categories c LEFT JOIN tickets t ON t.category_id=c.id ${dateFilter}
     GROUP BY c.id,c.name,c.code,c.sla_minutes HAVING total>0 ORDER BY avg_resolve_mins DESC`);
  return response.success(res, rows);
};

// ==================================================================
// GET /api/dashboard/report/aging
// ==================================================================
exports.getAgingTickets = async (req, res) => {
  const { days = 3 } = req.query;
  const [rows] = await pool.query(
    `SELECT t.ticket_no, t.title, CONCAT(u.first_name,' ',u.last_name) AS user_name,
       d.name AS department_name, c.name AS category_name,
       t.status, t.opened_at,
       TIMESTAMPDIFF(HOUR,t.opened_at,NOW()) AS age_hours,
       TIMESTAMPDIFF(DAY,t.opened_at,NOW())  AS age_days,
       t.sla_status
     FROM tickets t JOIN users u ON u.id=t.user_id
     JOIN departments d ON d.id=u.department_id JOIN categories c ON c.id=t.category_id
     WHERE t.status IN ('OPEN','IN_PROGRESS') AND t.opened_at <= DATE_SUB(NOW(), INTERVAL ? DAY)
     ORDER BY t.opened_at ASC LIMIT 50`, [Number(days)]);
  return response.success(res, rows);
};

// ==================================================================
// GET /api/reports/tickets
// ==================================================================
exports.getTicketReport = async (req, res) => {
  const { startDate, endDate, status, categoryId, assignedTo } = req.query;
  const where = [], params = [];
  if (startDate)  { where.push('DATE(opened_at) >= ?'); params.push(startDate); }
  if (endDate)    { where.push('DATE(opened_at) <= ?'); params.push(endDate); }
  if (status)     { where.push('status = ?');           params.push(status); }
  if (categoryId) { where.push('category_id = ?');      params.push(categoryId); }
  if (assignedTo) { where.push('assigned_to = ?');      params.push(assignedTo); }
  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT ticket_no, opened_at, resolved_at, department_name, user_name, category_name,
       description, resolution_note,
       CASE WHEN resolved_at IS NOT NULL AND opened_at IS NOT NULL
         THEN TIMESTAMPDIFF(MINUTE,opened_at,resolved_at) ELSE NULL END AS resolve_minutes,
       admin_name, status, sla_status
     FROM v_tickets_full ${whereClause} ORDER BY ticket_no ASC`, params);
  return response.success(res, rows);
};

// ==================================================================
// GET /api/reports/export-xlsx  — Ticket ทั้งหมด (เดิม)
// ==================================================================
exports.exportTicketsXlsx = async (req, res) => {
  const { startDate, endDate, range } = req.query;
  let sDate = startDate, eDate = endDate;
  if (range && !startDate) {
    const now = new Date(), pad = d => d.toISOString().slice(0,10);
    if (range==='today')  { sDate=pad(now); eDate=pad(now); }
    else if (range==='week')  { sDate=pad(new Date(now-7*86400000));  eDate=pad(now); }
    else if (range==='month') { sDate=pad(new Date(now-30*86400000)); eDate=pad(now); }
    else if (range==='year')  { sDate=`${now.getFullYear()}-01-01`;   eDate=pad(now); }
  }
  const where=[], params=[];
  if (sDate) { where.push('DATE(opened_at) >= ?'); params.push(sDate); }
  if (eDate) { where.push('DATE(opened_at) <= ?'); params.push(eDate); }
  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT ticket_no, opened_at, resolved_at, department_name, user_name, category_name,
       description, resolution_note,
       CASE WHEN resolved_at IS NOT NULL AND opened_at IS NOT NULL
         THEN TIMESTAMPDIFF(MINUTE,opened_at,resolved_at) ELSE NULL END AS resolve_minutes,
       admin_name, status
     FROM v_tickets_full ${whereClause} ORDER BY ticket_no ASC`, params);
  const { buildTicketWorkbook } = require('../utils/excelExport');
  let rangeLabel = '';
  if (sDate && eDate && sDate===eDate) rangeLabel=sDate;
  else if (sDate && eDate) rangeLabel=`${sDate} ถึง ${eDate}`;
  const wb = await buildTicketWorkbook({ rows, title: rangeLabel||'ทั้งหมด', rangeLabel });
  const filename = `helpdesk_report_${(rangeLabel||'all').replace(/ /g,'_').replace(/ถึง/g,'to')}.xlsx`;
  res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition',`attachment; filename="${encodeURIComponent(filename)}"`);
  await wb.xlsx.write(res); res.end();
};

// ==================================================================
// GET /api/reports/export-sla  — SLA รายแผนก + รายประเภท (ใหม่)
// ==================================================================
exports.exportSlaXlsx = async (req, res) => {
  const { startDate, endDate } = req.query;
  const df = startDate && endDate ? `AND DATE(t.opened_at) BETWEEN '${startDate}' AND '${endDate}'` : '';
  const [byDept] = await pool.query(
    `SELECT d.name AS department_name, COUNT(t.id) AS total,
       SUM(t.sla_status='ON_TIME') AS on_time, SUM(t.sla_status='BREACHED') AS breached,
       ROUND(SUM(t.sla_status='ON_TIME')*100/NULLIF(COUNT(t.id),0),1) AS on_time_pct,
       ROUND(AVG(CASE WHEN t.status='RESOLVED' THEN TIMESTAMPDIFF(MINUTE,t.opened_at,t.resolved_at) END),0) AS avg_resolve_minutes,
       MIN(CASE WHEN t.status='RESOLVED' THEN TIMESTAMPDIFF(MINUTE,t.opened_at,t.resolved_at) END) AS min_resolve_minutes,
       MAX(CASE WHEN t.status='RESOLVED' THEN TIMESTAMPDIFF(MINUTE,t.opened_at,t.resolved_at) END) AS max_resolve_minutes
     FROM departments d LEFT JOIN users u ON u.department_id=d.id
     LEFT JOIN tickets t ON t.user_id=u.id AND t.sla_status IS NOT NULL ${df}
     GROUP BY d.id,d.name HAVING total>0 ORDER BY on_time_pct ASC`);
  const [byCategory] = await pool.query(
    `SELECT c.name AS category_name, c.sla_minutes AS sla_target, COUNT(t.id) AS total,
       SUM(t.sla_status='ON_TIME') AS on_time, SUM(t.sla_status='BREACHED') AS breached,
       ROUND(SUM(t.sla_status='ON_TIME')*100/NULLIF(COUNT(t.id),0),1) AS on_time_pct,
       ROUND(AVG(CASE WHEN t.status='RESOLVED' THEN TIMESTAMPDIFF(MINUTE,t.opened_at,t.resolved_at) END),0) AS avg_resolve_minutes,
       MIN(CASE WHEN t.status='RESOLVED' THEN TIMESTAMPDIFF(MINUTE,t.opened_at,t.resolved_at) END) AS min_resolve_minutes,
       MAX(CASE WHEN t.status='RESOLVED' THEN TIMESTAMPDIFF(MINUTE,t.opened_at,t.resolved_at) END) AS max_resolve_minutes
     FROM categories c LEFT JOIN tickets t ON t.category_id=c.id AND t.sla_status IS NOT NULL ${df}
     GROUP BY c.id,c.name,c.sla_minutes HAVING total>0 ORDER BY on_time_pct ASC`);
  const { buildSlaWorkbook } = require('../utils/excelExport');
  const rangeLabel = startDate && endDate ? `${startDate} ถึง ${endDate}` : '';
  const wb = await buildSlaWorkbook({ byDept, byCategory, rangeLabel });
  const filename = `helpdesk_sla_${startDate||'all'}_${endDate||'all'}.xlsx`;
  res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition',`attachment; filename="${encodeURIComponent(filename)}"`);
  await wb.xlsx.write(res); res.end();
};

// ==================================================================
// GET /api/reports/export-aging  — Ticket ค้างนาน (ใหม่)
// ==================================================================
exports.exportAgingXlsx = async (req, res) => {
  const { days = 3 } = req.query;
  const [rows] = await pool.query(
    `SELECT t.ticket_no, t.title, CONCAT(u.first_name,' ',u.last_name) AS user_name,
       d.name AS department_name, c.name AS category_name, t.status, t.opened_at,
       TIMESTAMPDIFF(HOUR,t.opened_at,NOW()) AS age_hours,
       TIMESTAMPDIFF(DAY,t.opened_at,NOW())  AS age_days, t.sla_status
     FROM tickets t JOIN users u ON u.id=t.user_id
     JOIN departments d ON d.id=u.department_id JOIN categories c ON c.id=t.category_id
     WHERE t.status IN ('OPEN','IN_PROGRESS') AND t.opened_at <= DATE_SUB(NOW(), INTERVAL ? DAY)
     ORDER BY t.opened_at ASC`, [Number(days)]);
  const { buildAgingWorkbook } = require('../utils/excelExport');
  const wb = await buildAgingWorkbook({ rows, days, rangeLabel: `ค้างเกิน ${days} วัน` });
  const filename = `helpdesk_aging_${days}days_${new Date().toISOString().slice(0,10)}.xlsx`;
  res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition',`attachment; filename="${encodeURIComponent(filename)}"`);
  await wb.xlsx.write(res); res.end();
};

// ==================================================================
// GET /api/reports/export-admin  — Admin Workload (ใหม่)
// ==================================================================
exports.exportAdminXlsx = async (req, res) => {
  const { startDate, endDate } = req.query;
  const df = startDate && endDate ? `AND DATE(t.opened_at) BETWEEN '${startDate}' AND '${endDate}'` : '';
  const [rows] = await pool.query(
    `SELECT CONCAT(u.first_name,' ',u.last_name) AS admin_name,
       COUNT(t.id) AS assigned, SUM(t.status='RESOLVED') AS resolved,
       SUM(t.status='IN_PROGRESS') AS in_progress,
       ROUND(AVG(CASE WHEN t.status='RESOLVED' THEN TIMESTAMPDIFF(MINUTE,t.opened_at,t.resolved_at) END),0) AS avg_mins,
       MIN(CASE WHEN t.status='RESOLVED' THEN TIMESTAMPDIFF(MINUTE,t.opened_at,t.resolved_at) END) AS min_mins,
       MAX(CASE WHEN t.status='RESOLVED' THEN TIMESTAMPDIFF(MINUTE,t.opened_at,t.resolved_at) END) AS max_mins,
       ROUND(AVG(CASE WHEN t.satisfaction_score IS NOT NULL THEN t.satisfaction_score END),1) AS avg_satisfaction,
       COUNT(CASE WHEN t.satisfaction_score IS NOT NULL THEN 1 END) AS rated_count
     FROM users u LEFT JOIN tickets t ON t.assigned_to=u.id ${df}
     WHERE u.role IN ('ADMIN','SUPERVISOR')
     GROUP BY u.id,u.first_name,u.last_name HAVING assigned>0 ORDER BY resolved DESC`);
  const { buildAdminWorkbook } = require('../utils/excelExport');
  const rangeLabel = startDate && endDate ? `${startDate} ถึง ${endDate}` : '';
  const wb = await buildAdminWorkbook({ rows, rangeLabel });
  const filename = `helpdesk_admin_${startDate||'all'}_${endDate||'all'}.xlsx`;
  res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition',`attachment; filename="${encodeURIComponent(filename)}"`);
  await wb.xlsx.write(res); res.end();
};

// ==================================================================
// GET /api/reports/export-breakdown  — ประเภทปัญหาตามแผนก (ใหม่)
// ==================================================================
exports.exportBreakdownXlsx = async (req, res) => {
  const { startDate, endDate } = req.query;
  const df = startDate && endDate ? `AND DATE(t.opened_at) BETWEEN '${startDate}' AND '${endDate}'` : '';
  const [rows] = await pool.query(
    `SELECT d.name AS department_name, c.name AS category_name,
       COUNT(t.id) AS total, SUM(t.status='RESOLVED') AS resolved,
       SUM(t.status='IN_PROGRESS') AS in_progress,
       SUM(t.status='OPEN') AS open_tickets, SUM(t.status='CANCELLED') AS cancelled
     FROM departments d LEFT JOIN users u ON u.department_id=d.id
     LEFT JOIN tickets t ON t.user_id=u.id ${df}
     LEFT JOIN categories c ON c.id=t.category_id
     GROUP BY d.id,d.name,c.id,c.name HAVING total>0 ORDER BY d.name,total DESC`);
  const { buildBreakdownWorkbook } = require('../utils/excelExport');
  const rangeLabel = startDate && endDate ? `${startDate} ถึง ${endDate}` : '';
  const wb = await buildBreakdownWorkbook({ rows, rangeLabel });
  const filename = `helpdesk_breakdown_${startDate||'all'}_${endDate||'all'}.xlsx`;
  res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition',`attachment; filename="${encodeURIComponent(filename)}"`);
  await wb.xlsx.write(res); res.end();
};

// ==================================================================
// GET /api/reports/sla
// ==================================================================
exports.getSlaReport = async (req, res) => {
  const [byCategory] = await pool.execute('SELECT * FROM v_report_by_category');
  const [byAdmin]    = await pool.execute('SELECT * FROM v_report_admin_performance');
  const [monthly]    = await pool.execute('SELECT * FROM v_report_monthly ORDER BY report_year DESC, report_month DESC LIMIT 12');
  return response.success(res, { byCategory, byAdmin, monthly });
};

// ==================================================================
// GET /api/reports/admin-performance
// ==================================================================
exports.getAdminPerformance = async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM v_report_admin_performance');
  return response.success(res, rows);
};