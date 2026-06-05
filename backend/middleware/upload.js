// middleware/upload.js
// ============================================================
// File Upload Middleware (Multer + Sharp)
// รองรับ: JPEG, PNG, WebP
// ทำ Image Compression อัตโนมัติด้วย Sharp
// ============================================================

const multer = require('multer');
const sharp  = require('sharp');
const path   = require('path');
const fs     = require('fs');
const { v4: uuidv4 } = require('uuid');

const UPLOAD_DIR    = path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
const THUMB_DIR     = path.join(UPLOAD_DIR, 'thumbnails');
const MAX_SIZE_BYTES = (parseInt(process.env.MAX_FILE_SIZE_MB) || 10) * 1024 * 1024;
const ALLOWED_TYPES  = ['image/jpeg', 'image/png', 'image/webp'];

// สร้างโฟลเดอร์ถ้ายังไม่มี
[UPLOAD_DIR, THUMB_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// เก็บไฟล์ใน memory ก่อน (แล้วค่อย process ด้วย sharp)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('อนุญาตเฉพาะไฟล์ภาพ JPEG, PNG, WebP เท่านั้น'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE_BYTES },
});

// ------------------------------------------------------------------
// processImages: Middleware หลังจาก multer รับไฟล์
// - Compress และ Resize รูปภาพ
// - สร้าง Thumbnail
// - เพิ่ม file info เข้า req.uploadedFiles
// ------------------------------------------------------------------
const processImages = async (req, res, next) => {
  if (!req.files || req.files.length === 0) return next();

  try {
    const processed = [];

    for (const file of req.files) {
      const ext        = '.webp';                       // แปลงเป็น webp ทั้งหมด
      const fileName   = `${uuidv4()}${ext}`;
      const thumbName  = `thumb_${fileName}`;
      const filePath   = path.join(UPLOAD_DIR, fileName);
      const thumbPath  = path.join(THUMB_DIR, thumbName);

      // บีบอัดและ resize รูปหลัก (max 1200px)
      await sharp(file.buffer)
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(filePath);

      // สร้าง Thumbnail (200x200)
      await sharp(file.buffer)
        .resize(200, 200, { fit: 'cover' })
        .webp({ quality: 70 })
        .toFile(thumbPath);

      const stats = fs.statSync(filePath);

      processed.push({
        originalName: file.originalname,
        fileName,
        filePath:     `uploads/${fileName}`,
        thumbPath:    `uploads/thumbnails/${thumbName}`,
        fileSize:     stats.size,
        mimeType:     'image/webp',
      });
    }

    req.uploadedFiles = processed;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { upload, processImages };