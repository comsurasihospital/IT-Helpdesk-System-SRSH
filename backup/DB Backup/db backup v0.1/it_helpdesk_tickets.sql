-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: it_helpdesk
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `tickets`
--

DROP TABLE IF EXISTS `tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tickets` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `ticket_no` varchar(20) NOT NULL COMMENT 'เลขที่ Ticket เช่น TK2025001',
  `user_id` int unsigned NOT NULL COMMENT 'ผู้แจ้ง',
  `category_id` int unsigned NOT NULL COMMENT 'ประเภทปัญหา',
  `title` varchar(300) NOT NULL COMMENT 'หัวข้อปัญหา',
  `description` text NOT NULL COMMENT 'รายละเอียดปัญหา',
  `reporter_prefix` int unsigned DEFAULT NULL,
  `reporter_name` varchar(200) DEFAULT NULL COMMENT 'ชื่อ-นามสกุลผู้แจ้ง',
  `reporter_phone` varchar(20) DEFAULT NULL COMMENT 'เบอร์โทรผู้แจ้ง',
  `reporter_dept_id` int unsigned DEFAULT NULL COMMENT 'แผนกผู้แจ้ง (อาจต่างจาก user dept)',
  `status` enum('OPEN','IN_PROGRESS','RESOLVED','CANCELLED') NOT NULL DEFAULT 'OPEN' COMMENT 'สถานะ',
  `priority` enum('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL DEFAULT 'MEDIUM' COMMENT 'ความสำคัญ',
  `assigned_to` int unsigned DEFAULT NULL COMMENT 'Admin ที่รับงาน',
  `opened_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'วันที่เปิด Ticket',
  `accepted_at` datetime DEFAULT NULL COMMENT 'วันที่รับงาน',
  `resolved_at` datetime DEFAULT NULL COMMENT 'วันที่ปิดงาน',
  `cancelled_at` datetime DEFAULT NULL COMMENT 'วันที่ยกเลิก',
  `resolution_note` text COMMENT 'หมายเหตุการแก้ไข',
  `sla_due_at` datetime DEFAULT NULL COMMENT 'กำหนด SLA',
  `sla_status` enum('ON_TIME','BREACHED','PENDING') NOT NULL DEFAULT 'PENDING' COMMENT 'สถานะ SLA',
  `sla_type` varchar(20) DEFAULT NULL COMMENT 'ประเภทงาน SLA ที่ admin เลือก',
  `satisfaction_score` tinyint unsigned DEFAULT NULL COMMENT 'คะแนนความพึงพอใจ 1-5',
  `satisfaction_note` varchar(500) DEFAULT NULL COMMENT 'หมายเหตุ Rating',
  `rated_at` datetime DEFAULT NULL COMMENT 'วันที่ให้คะแนน',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ticket_no` (`ticket_no`),
  KEY `idx_tickets_status` (`status`),
  KEY `idx_tickets_user` (`user_id`),
  KEY `idx_tickets_assigned` (`assigned_to`),
  KEY `idx_tickets_category` (`category_id`),
  KEY `idx_tickets_opened_at` (`opened_at`),
  KEY `idx_tickets_sla_status` (`sla_status`),
  KEY `idx_tickets_ticket_no` (`ticket_no`),
  KEY `fk_tickets_reporter_dept` (`reporter_dept_id`),
  KEY `fk_tickets_reporter_prefix` (`reporter_prefix`),
  CONSTRAINT `fk_tickets_assigned` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_tickets_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`),
  CONSTRAINT `fk_tickets_reporter_dept` FOREIGN KEY (`reporter_dept_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_tickets_reporter_prefix` FOREIGN KEY (`reporter_prefix`) REFERENCES `prefixes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_tickets_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=99 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Ticket การแจ้งซ่อม';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tickets`
--

LOCK TABLES `tickets` WRITE;
/*!40000 ALTER TABLE `tickets` DISABLE KEYS */;
INSERT INTO `tickets` VALUES (62,'TK202600001',60,2,'เครื่องพิมพ์ขัดข้อง','อาการเครื่องสแกนเนอร์ ไม่ขึ้นตัวอย่างในลบก่อนกดบันทึกไฟล์',3,'อุษา อินมณี','090-445-9045',25,'RESOLVED','MEDIUM',61,'2026-05-22 15:57:46','2026-05-22 16:00:00','2026-05-22 16:10:00',NULL,'สาเหตุ: ไม่ได้ตั้งค่าเครื่องพิมพ์\nวิธีแก้ไข: ตั้งค่าเครื่องพิมพ์ให้สามารถเห็นเอกสารก่อนบันทึก เพิ่ม ลบ และแก้ไข้ได้ก่อนกดบันทึกไฟล์เอกสาร','2026-05-22 16:27:46','ON_TIME','PRINTER',5,NULL,'2026-05-22 16:11:10','2026-05-22 15:57:46','2026-05-22 16:17:54'),(63,'TK202600002',62,2,'เครื่องพิมพ์ขัดข้อง','ถ่ายเอกสารสีไม่ออก',3,'สุพิชฌาย์ อิ่มวงศ์','096-654-9691',2,'RESOLVED','MEDIUM',61,'2026-05-26 08:43:22','2026-05-26 08:43:00','2026-05-26 08:58:00',NULL,'สาเหตุ: ระบบหมึกไม่มีสีในสายทำให้ปริ้นสีไม่ออก\nวิธีแก้ไข: ไล่ระบบหมึกใหม่','2026-05-26 09:13:22','ON_TIME','PRINTER',NULL,NULL,NULL,'2026-05-26 08:43:22','2026-05-27 13:10:26'),(64,'TK202600003',63,2,'เครื่องพิมพ์ขัดข้อง','หมึกสีไม่ออก',3,'วรชกร รัตนโชคธรณี','098-325-3530',2,'RESOLVED','MEDIUM',61,'2026-05-26 09:25:43','2026-05-26 09:27:00','2026-05-26 09:40:00',NULL,'สาเหตุ: ระบบหมึกไม่มีสีในสายทำให้ปริ้นสีไม่ออก\nวิธีแก้ไข: ไล่ระบบหมึกใหม่','2026-05-26 09:55:43','ON_TIME','PRINTER',5,NULL,'2026-05-26 09:54:47','2026-05-26 09:25:43','2026-05-27 13:10:26'),(65,'TK202600004',64,2,'เครื่องพิมพ์ขัดข้อง','ปริ้นไม่ออก',3,'วาสุนี ศรีนวล','061-645-3201',8,'RESOLVED','MEDIUM',58,'2026-05-26 10:11:41','2026-05-26 10:12:00','2026-05-26 10:17:00',NULL,'สาเหตุ: วินโดวส์แจ้งเตือนอัพเดท\nวิธีแก้ไข: อัพเดทวินโดวส์','2026-05-26 10:41:42','ON_TIME','PRINTER',NULL,NULL,NULL,'2026-05-26 10:11:41','2026-05-27 13:10:26'),(66,'TK202600005',65,2,'เครื่องพิมพ์ขัดข้อง','เครื่องปริ้นท์ ปริ้นท์เอกสารสีไม่สมบูรณ์',20,'นิชาธาร กาทอง','081-993-0459',24,'RESOLVED','MEDIUM',61,'2026-05-27 10:17:09','2026-05-27 10:18:00','2026-05-27 10:30:00',NULL,'สาเหตุ: ตลับหมึกพิมพ์มีปัญหา สีออกไม่ครบถ้วน\nวิธีแก้ไข: ทดสอบการพิมพ์และเปลี่ยนหมึกพิมพ์','2026-05-27 10:47:10','ON_TIME','PRINTER',NULL,NULL,NULL,'2026-05-27 10:17:09','2026-05-27 13:10:26'),(67,'TK202600006',66,1,'โปรแกรม HOSxP ขัดข้อง','ช่องคิวไม่ขึ้นแสดงบนแถบ',3,'นวลจุฑา ปานพรม','098-296-1702',26,'RESOLVED','MEDIUM',61,'2026-05-27 11:08:58','2026-05-27 11:12:00','2026-05-27 11:20:00',NULL,'สาเหตุ: ช่องใส่เลขคิวคนไข้หายไป\nวิธีแก้ไข: เลือกเมนูการแสดงคิวคนไข้ในระบบใหม่','2026-05-27 11:38:58','ON_TIME','SOFTWARE',NULL,NULL,NULL,'2026-05-27 11:08:58','2026-05-27 13:09:42'),(88,'TK202600007',68,1,'โปรแกรม HOSxP / โปรแกรมอื่น ๆ ขัดข้อง','ไม่สามารถเปิดไลน์ เพื่อดูข้อมูลได้',2,'พัชรินทร์ พรมโคตร','080-044-2677',18,'RESOLVED','MEDIUM',61,'2026-05-27 14:11:10','2026-05-27 14:11:00','2026-05-27 14:20:00',NULL,'สาเหตุ: โปรแกรมเข้าใช้งานไม่ได้\nวิธีแก้ไข: ลบแล้วลงโปรแกรมใหม่','2026-05-28 14:11:10','ON_TIME','SOFTWARE',NULL,NULL,NULL,'2026-05-27 14:11:10','2026-05-28 17:02:38'),(89,'TK202600008',67,2,'เครื่องพิมพ์ขัดข้อง','ปริ้นเอกสารไม่ได้',3,'สุธิชา เพ่งไพฑูรย์','065-938-4399',5,'RESOLVED','MEDIUM',58,'2026-05-27 14:22:23','2026-05-27 14:23:00','2026-05-27 14:28:00',NULL,'สาเหตุ: กระดาษติด\nวิธีแก้ไข: ดึงกระดาษออกจาก roll','2026-05-27 14:52:24','ON_TIME','PRINTER',4,NULL,'2026-05-27 14:24:25','2026-05-27 14:22:23','2026-05-27 14:24:25'),(90,'TK202600009',60,1,'โปรแกรม HOSxP / โปรแกรมอื่น ๆ ขัดข้อง','คำวินิฉัยโรคไม่ขึ้น',3,'อุษา อินมณี','090-445-9045',25,'RESOLVED','MEDIUM',61,'2026-05-28 14:28:53','2026-05-28 14:38:00','2026-05-28 14:51:00',NULL,'สาเหตุ: เจ้าหน้าที่ไปโดนปุ่มไม่แสดงผลวินิจฉัย\nวิธีแก้ไข: เอาติกไม่แสดงผลวินิจฉัยออก','2026-05-28 14:58:53','ON_TIME','SOFTWARE',5,NULL,'2026-05-28 14:56:07','2026-05-28 14:28:53','2026-05-28 14:56:07'),(91,'TK202600010',69,1,'โปรแกรม HOSxP / โปรแกรมอื่น ๆ ขัดข้อง','คีย์วัคซีนไข้หวัดใหญ่แล้วเลขLotไม่ขึ้น',3,'สุกัญญา จามร','084-571-4662',31,'RESOLVED','MEDIUM',61,'2026-05-28 14:40:48','2026-05-28 14:56:00','2026-05-28 15:05:00',NULL,'สาเหตุ: ล๊อตวัคซีนไม่ขึ้น\nวิธีแก้ไข: เข้าไปกดปิดและเปิดล๊อตวัคซีนในระบบใหม่','2026-05-28 15:10:48','ON_TIME','SOFTWARE',5,NULL,'2026-05-28 14:58:43','2026-05-28 14:40:48','2026-05-28 14:58:43'),(92,'TK202600011',70,1,'โปรแกรม HOSxP / โปรแกรมอื่น ๆ ขัดข้อง','คีย์หัตถการ BIOPSY ไม่ได้',3,'ณัฐนันท์ โตแก้ว','064-273-5072',2,'RESOLVED','MEDIUM',61,'2026-05-29 10:00:37','2026-05-29 10:03:00','2026-05-29 10:07:00',NULL,'สาเหตุ: คีย์หัตถการ BIOPSY ไม่ได้\nวิธีแก้ไข: เพิ่มหัตถการในระบบใหม่','2026-05-29 10:30:37','ON_TIME','SOFTWARE',NULL,NULL,NULL,'2026-05-29 10:00:37','2026-05-29 10:20:27'),(93,'TK202600012',71,1,'โปรแกรม HOSxP / โปรแกรมอื่น ๆ ขัดข้อง','กดเรียกคิวไม่ได้ โต๊ะคัดกรอง GP',15,'ลภัสรดา พิมพ์สอาด','098-946-2464',2,'RESOLVED','MEDIUM',58,'2026-06-02 13:07:32','2026-06-02 13:07:00','2026-06-02 13:24:00',NULL,'สาเหตุ: Gateway หยุดทำงาน\nวิธีแก้ไข: รีสตาร์ท gateway','2026-06-02 13:37:33','ON_TIME','SOFTWARE',5,NULL,'2026-06-02 14:42:42','2026-06-02 13:07:32','2026-06-02 14:42:42'),(94,'TK202600013',72,2,'เครื่องพิมพ์ขัดข้อง','ปริ้นท์สีไม่ได้',3,'รุ่งระวี ทิมทอง','063-597-4991',2,'RESOLVED','MEDIUM',58,'2026-06-02 14:22:12','2026-06-02 14:26:00','2026-06-02 14:30:00',NULL,'สาเหตุ: หัวพิมพ์สีฟ้า,ชมพู ตัน\nวิธีแก้ไข: ล้างหัวพิมพ์','2026-06-02 14:52:12','ON_TIME','PRINTER',5,NULL,'2026-06-02 15:06:52','2026-06-02 14:22:12','2026-06-02 15:06:52'),(95,'TK202600014',73,4,'ระบบอินเทอร์เน็ตขัดข้อง','สัญญาณระบบเรียกคิวข้างค่ะ',3,'ทิพยสุดา อินทวารี','083-630-0544',7,'RESOLVED','MEDIUM',61,'2026-06-02 14:39:35','2026-06-02 14:41:00','2026-06-02 14:44:00',NULL,'สาเหตุ: กดเรียกคิวแล้วเสียงไม่ออก\nวิธีแก้ไข: ปิด-เปิด เซอร์วิสระบบคิวใหม่','2026-06-02 14:59:36','ON_TIME','NETWORK',5,NULL,'2026-06-02 14:48:57','2026-06-02 14:39:35','2026-06-02 16:21:57'),(96,'TK202600015',74,3,'เครื่องคอมพิวเตอร์ขัดข้อง','อยู่ดีๆคอมก็ดับเปิดไม่ติด',3,'สุวรรณา เขื่อนแก้ว','086-556-7813',21,'RESOLVED','MEDIUM',58,'2026-06-02 15:45:26','2026-06-02 15:46:00','2026-06-02 15:50:00',NULL,'สาเหตุ: แรมสกปรก\nวิธีแก้ไข: ทำความสะอาดเครื่องและแรม','2026-06-02 16:15:26','ON_TIME','COMPUTER',NULL,NULL,NULL,'2026-06-02 15:45:26','2026-06-02 15:46:53'),(97,'TK202600016',71,1,'โปรแกรม HOSxP / โปรแกรมอื่น ๆ ขัดข้อง','โต๊ะเบอร์ 3 กดเรียกคิวแล้วเรียกคิวเดิมซ้ำ เรียกคิวอื่นไม่ได้ค่ะ',15,'ลภัสรดา พิมพ์สอาด','098-946-2464',2,'RESOLVED','MEDIUM',61,'2026-06-04 08:17:21','2026-06-04 08:20:00','2026-06-04 08:30:00',NULL,'สาเหตุ: ระบบคิวขัดข้อง\nวิธีแก้ไข: แก้ไขโดยการติก auto call','2026-06-04 08:47:22','ON_TIME','SOFTWARE',5,NULL,'2026-06-04 09:17:15','2026-06-04 08:17:21','2026-06-04 09:17:15'),(98,'TK202600017',75,3,'เครื่องคอมพิวเตอร์ขัดข้อง','เปิดไม่ติด',3,'ปานตะวัน มีล้อม','063-639-8514',5,'RESOLVED','MEDIUM',58,'2026-06-04 09:48:17','2026-06-04 09:52:00','2026-06-04 09:58:00',NULL,'สาเหตุ: แรมแจ้งเตือน\nวิธีแก้ไข: ทำความสะอาดแรม','2026-06-04 10:18:18','ON_TIME','COMPUTER',NULL,NULL,NULL,'2026-06-04 09:48:17','2026-06-04 10:25:06');
/*!40000 ALTER TABLE `tickets` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-04 12:53:00
