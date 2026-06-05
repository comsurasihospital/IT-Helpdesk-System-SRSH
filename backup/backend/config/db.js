// config/db.js
// ============================================================
// Database Connection Pool
// ใช้ mysql2/promise เพื่อรองรับ async/await
// ============================================================

const mysql  = require('mysql2/promise');
const logger = require('../utils/logger');

// สร้าง Connection Pool (ดีกว่า single connection เพราะรองรับหลาย request พร้อมกัน)
const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               process.env.DB_PORT     || 3306,
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'it_helpdesk',
  waitForConnections: true,
  connectionLimit:    parseInt(process.env.DB_POOL_LIMIT) || 10,
  queueLimit:         0,
  charset:            'utf8mb4',
  timezone:           '+07:00',   // Bangkok timezone
});

// ทดสอบ Connection ตอน Start Server
async function testConnection() {
  try {
    const conn = await pool.getConnection();
    logger.info('✅ MySQL Connected successfully');
    conn.release();
  } catch (err) {
    logger.error('❌ MySQL Connection failed:', err.message);
    process.exit(1);   // หยุดโปรแกรมถ้าเชื่อมต่อ DB ไม่ได้
  }
}

// Helper: query แบบ transaction
async function withTransaction(callback) {
  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    const result = await callback(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { pool, testConnection, withTransaction };