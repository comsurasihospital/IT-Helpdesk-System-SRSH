// server.js
// ============================================================
// IT Helpdesk System — Express Server
// Entry Point หลักของ Backend
// ============================================================

require('dotenv').config();                        // โหลด .env ก่อนทุกอย่าง

const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const path        = require('path');
const rateLimit   = require('express-rate-limit');
const fs          = require('fs');

const { testConnection }  = require('./config/db');
const logger              = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Routes
const authRoutes      = require('./routes/auth');
const ticketRoutes    = require('./routes/tickets');
const userRoutes      = require('./routes/users');
const dashboardRoutes = require('./routes/dashboard');
const reportRoutes    = require('./routes/reports');

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── สร้างโฟลเดอร์ที่จำเป็น ──────────────────────────────────────
['logs', 'uploads', 'uploads/thumbnails'].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ─── Security Middleware ─────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'", 'https:', 'data:'],
      scriptSrc:   ["'self'", "'unsafe-inline'", "'unsafe-eval'",
                    'https://static.line-scdn.net', 'https://liff.line.me'],
      connectSrc:  ["'self'", 'https:', 'wss:'],
      imgSrc:      ["'self'", 'data:', 'https:', 'blob:'],
      styleSrc:    ["'self'", "'unsafe-inline'", 'https:'],
      fontSrc:     ["'self'", 'https:', 'data:'],
      frameSrc:    ["'self'", 'https://liff.line.me'],
    },
  },
}));

// CORS — อนุญาต Frontend และ LINE LIFF
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'https://liff.line.me',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
}));

// ─── Skip ngrok browser warning ──────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('ngrok-skip-browser-warning', 'true');
  next();
});

// ─── Rate Limiting ───────────────────────────────────────────────
// ป้องกันเฉพาะ login/register — JWT ดูแล API อื่นอยู่แล้ว
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 นาที
  max:      20,                // 20 ครั้ง/15นาที ต่อ IP
  message:  { success: false, message: 'Too many login attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders:   false,
});
app.use('/api/auth/login',    authLimiter);
app.use('/api/auth/register', authLimiter);

// ─── General Middleware ──────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined', {
  stream: { write: (msg) => logger.info(msg.trim()) },
}));

// ─── Static Files (รูปภาพ) ───────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Health Check ────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status:  'ok',
    service: 'IT Helpdesk API',
    version: '1.0.0',
    time:    new Date().toISOString(),
  });
});

// ─── API Routes ──────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/tickets',   ticketRoutes);
app.use('/api/users',     userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports',   reportRoutes);

// ─── Error Handlers ──────────────────────────────────────────────
// ─── Serve React Frontend ─────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'frontend-build')));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'frontend-build', 'index.html'));
  } else {
    notFoundHandler(req, res);
  }
});
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────────────
async function startServer() {
  await testConnection();    // ตรวจสอบ DB ก่อน start
  app.listen(PORT, () => {
    logger.info(`🚀 Server running on http://localhost:${PORT}`);
    logger.info(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`🏥 Hospital: ${process.env.HOSPITAL_NAME || '-'}`);
  });
}

startServer().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});

module.exports = app;