# IT Helpdesk — Backend API

## 📁 Project Structure

```
backend/
├── server.js                 ← Entry point หลัก
├── package.json
├── .env.example              ← คัดลอกเป็น .env
│
├── config/
│   └── db.js                 ← MySQL Connection Pool
│
├── controllers/              ← Business Logic
│   ├── authController.js     ← Login / Register / Me
│   ├── ticketController.js   ← Ticket CRUD + Workflow
│   ├── dashboardController.js← Dashboard + Reports
│   └── userController.js     ← User Management
│
├── routes/                   ← API Routes
│   ├── auth.js
│   ├── tickets.js
│   ├── dashboard.js
│   └── users.js
│
├── middleware/               ← Middleware
│   ├── auth.js               ← JWT authenticate + authorize
│   ├── errorHandler.js       ← Global error handler
│   ├── upload.js             ← Multer + Sharp image processing
│   └── validate.js           ← Input validation rules
│
├── services/
│   └── lineService.js        ← LINE Messaging API
│
└── utils/
    ├── logger.js             ← Winston logger
    └── response.js           ← Standard API response
```

---

## 🚀 ติดตั้งและรันระบบ (Step-by-Step)

### Step 1: ติดตั้ง Node.js
```bash
# ดาวน์โหลดจาก https://nodejs.org (ใช้ LTS version 18+)
node --version    # ควรได้ v18.x.x หรือสูงกว่า
npm --version
```

### Step 2: ติดตั้ง MySQL
```bash
# Windows: ดาวน์โหลด MySQL Installer จาก https://dev.mysql.com/downloads/
# Ubuntu/Debian:
sudo apt install mysql-server
sudo mysql_secure_installation
```

### Step 3: สร้าง Database
```bash
mysql -u root -p < ../database/schema.sql
mysql -u root -p < ../database/views_procedures.sql
```

### Step 4: ตั้งค่า Environment
```bash
cp .env.example .env
# เปิดไฟล์ .env และแก้ไขค่าต่างๆ
```

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=YOUR_PASSWORD
DB_NAME=it_helpdesk
JWT_SECRET=กำหนดรหัสลับที่ซับซ้อน
LINE_CHANNEL_ACCESS_TOKEN=จาก LINE Developers Console
LINE_IT_GROUP_ID=ไอดี LINE Group ทีม IT
```

### Step 5: ติดตั้ง Dependencies
```bash
cd backend
npm install
```

### Step 6: รัน Server
```bash
# Development (auto-restart เมื่อแก้ไขโค้ด)
npm run dev

# Production
npm start
```

เมื่อรันสำเร็จจะเห็น:
```
✅ MySQL Connected successfully
🚀 Server running on http://localhost:5000
```

### Step 7: ทดสอบ API
```bash
# Health check
curl http://localhost:5000/health

# ทดสอบ Login
curl -X POST http://localhost:5000/api/auth/line-login \
  -H "Content-Type: application/json" \
  -d '{"lineUserId": "U123456", "lineDisplayName": "Test User"}'
```

---

## 🔒 Authentication Flow

```
1. Frontend เรียก liff.getProfile() → ได้ lineUserId
2. POST /api/auth/line-login  { lineUserId }
3. ถ้า isNewUser = true  → แสดงหน้า Register
4. POST /api/auth/register  { lineUserId, firstName, ... }
5. ได้ JWT Token กลับมา
6. เก็บ Token ใน localStorage
7. ส่ง Token ทุก request:  Authorization: Bearer <token>
```

---

## 📌 Ticket Workflow

```
USER สร้าง Ticket
    POST /api/tickets
    ↓
    status: OPEN 🔴
    ระบบส่ง LINE แจ้งทีม IT
    ↓
ADMIN รับงาน
    PUT /api/tickets/:id/accept
    ↓
    status: IN_PROGRESS 🟠
    ระบบส่ง LINE แจ้ง USER
    ↓
ADMIN ปิดงาน
    PUT /api/tickets/:id/resolve
    ↓
    status: RESOLVED 🟢
    คำนวณ SLA อัตโนมัติ
    ส่ง LINE แจ้ง USER + ลิงก์ Rating
    ↓
USER ให้คะแนน
    PUT /api/tickets/:id/rate
    { score: 1-5 }
```

---

## 📦 API Endpoints สรุป

| Method | Endpoint | Role | คำอธิบาย |
|--------|----------|------|----------|
| POST | /api/auth/line-login | - | LINE Login |
| POST | /api/auth/register | - | ลงทะเบียน |
| GET | /api/auth/me | All | ข้อมูลตัวเอง |
| GET | /api/tickets | All | รายการ Ticket |
| POST | /api/tickets | All | สร้าง Ticket |
| GET | /api/tickets/:id | All | รายละเอียด |
| PUT | /api/tickets/:id/accept | ADMIN | รับงาน |
| PUT | /api/tickets/:id/resolve | ADMIN | ปิดงาน |
| PUT | /api/tickets/:id/cancel | All | ยกเลิก |
| PUT | /api/tickets/:id/rate | USER | ให้คะแนน |
| DELETE | /api/tickets/:id | ADMIN | ลบ |
| GET | /api/dashboard/summary | ADMIN/SUP | สรุป Dashboard |
| GET | /api/reports/tickets | ADMIN/SUP | รายงาน |
| GET | /api/users | ADMIN/SUP | รายชื่อ User |
