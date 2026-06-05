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
-- Table structure for table `ticket_logs`
--

DROP TABLE IF EXISTS `ticket_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ticket_logs` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `ticket_id` int unsigned NOT NULL,
  `actor_id` int unsigned NOT NULL COMMENT 'ผู้ดำเนินการ',
  `action` varchar(100) NOT NULL COMMENT 'การกระทำ เช่น STATUS_CHANGE',
  `from_status` varchar(50) DEFAULT NULL COMMENT 'สถานะก่อน',
  `to_status` varchar(50) DEFAULT NULL COMMENT 'สถานะหลัง',
  `note` text COMMENT 'หมายเหตุ',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_logs_actor` (`actor_id`),
  KEY `idx_logs_ticket` (`ticket_id`),
  KEY `idx_logs_created` (`created_at`),
  CONSTRAINT `fk_logs_actor` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_logs_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=234 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='ประวัติ Ticket';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_logs`
--

LOCK TABLES `ticket_logs` WRITE;
/*!40000 ALTER TABLE `ticket_logs` DISABLE KEYS */;
INSERT INTO `ticket_logs` VALUES (155,62,60,'TICKET_CREATED',NULL,'OPEN','สร้าง Ticket ใหม่','2026-05-22 15:57:46'),(157,62,61,'STATUS_CHANGE','OPEN','IN_PROGRESS','รับงาน','2026-05-22 16:00:00'),(158,62,61,'STATUS_CHANGE','IN_PROGRESS','RESOLVED','สาเหตุ: ไม่ได้ตั้งค่าเครื่องพิมพ์\nวิธีแก้ไข: ตั้งค่าเครื่องพิมพ์ให้สามารถเห็นเอกสารก่อนบันทึก เพิ่ม ลบ และแก้ไข้ได้ก่อนกดบันทึกไฟล์เอกสาร','2026-05-22 16:10:00'),(159,62,61,'EDITED',NULL,NULL,'Admin แก้ไขข้อมูลการปิดงาน','2026-05-22 16:08:06'),(160,62,61,'EDITED',NULL,NULL,'Admin แก้ไขข้อมูลการปิดงาน','2026-05-22 16:17:54'),(161,63,62,'TICKET_CREATED',NULL,'OPEN','สร้าง Ticket ใหม่','2026-05-26 08:43:22'),(163,63,61,'STATUS_CHANGE','OPEN','IN_PROGRESS','รับงาน','2026-05-26 08:43:00'),(164,63,61,'STATUS_CHANGE','IN_PROGRESS','RESOLVED','สาเหตุ: ระบบหมึกไม่มีสีในสายทำให้ปริ้นสีไม่ออก\nวิธีแก้ไข: ไล่ระบบหมึกใหม่','2026-05-26 08:58:00'),(165,64,63,'TICKET_CREATED',NULL,'OPEN','สร้าง Ticket ใหม่','2026-05-26 09:25:43'),(167,64,61,'STATUS_CHANGE','OPEN','IN_PROGRESS','รับงาน','2026-05-26 09:27:00'),(168,64,61,'STATUS_CHANGE','IN_PROGRESS','RESOLVED','สาเหตุ: ระบบหมึกไม่มีสีในสายทำให้ปริ้นสีไม่ออก\nวิธีแก้ไข: ไล่ระบบหมึกใหม่','2026-05-26 09:40:00'),(169,65,64,'TICKET_CREATED',NULL,'OPEN','สร้าง Ticket ใหม่','2026-05-26 10:11:41'),(171,65,58,'STATUS_CHANGE','OPEN','IN_PROGRESS','รับงาน','2026-05-26 10:12:00'),(172,65,58,'STATUS_CHANGE','IN_PROGRESS','RESOLVED','สาเหตุ: วินโดวส์แจ้งเตือนอัพเดท\nวิธีแก้ไข: อัพเดทวินโดวส์','2026-05-26 10:17:00'),(173,66,65,'TICKET_CREATED',NULL,'OPEN','สร้าง Ticket ใหม่','2026-05-27 10:17:09'),(175,66,61,'STATUS_CHANGE','OPEN','IN_PROGRESS','รับงาน','2026-05-27 10:18:00'),(176,66,61,'STATUS_CHANGE','IN_PROGRESS','RESOLVED','สาเหตุ: ตลับหมึกพิมพ์มีปัญหา สีออกไม่ครบถ้วน\nวิธีแก้ไข: ทดสอบการพิมพ์และเปลี่ยนหมึกพิมพ์','2026-05-27 10:30:00'),(177,67,66,'TICKET_CREATED',NULL,'OPEN','สร้าง Ticket ใหม่','2026-05-27 11:08:58'),(179,67,61,'STATUS_CHANGE','OPEN','IN_PROGRESS','รับงาน','2026-05-27 11:12:00'),(180,67,61,'STATUS_CHANGE','IN_PROGRESS','RESOLVED','สาเหตุ: ช่องใส่เลขคิวคนไข้หายไป\nวิธีแก้ไข: เลือกเมนูการแสดงคิวคนไข้ในระบบใหม่','2026-05-27 11:20:00'),(188,88,68,'TICKET_CREATED',NULL,'OPEN','สร้าง Ticket ใหม่','2026-05-27 14:11:10'),(190,88,61,'STATUS_CHANGE','OPEN','IN_PROGRESS','รับงาน','2026-05-27 14:11:00'),(191,88,61,'STATUS_CHANGE','IN_PROGRESS','RESOLVED','สาเหตุ: โปรแกรมเข้าใช้งานไม่ได้\nวิธีแก้ไข: ลบแล้วลงโปรแกรมใหม่','2026-05-27 14:20:00'),(192,89,67,'TICKET_CREATED',NULL,'OPEN','สร้าง Ticket ใหม่','2026-05-27 14:22:23'),(194,89,58,'STATUS_CHANGE','OPEN','IN_PROGRESS','รับงาน','2026-05-27 14:23:00'),(195,89,58,'STATUS_CHANGE','IN_PROGRESS','RESOLVED','สาเหตุ: กระดาษติด\nวิธีแก้ไข: ดึงกระดาษออกจาก roll','2026-05-27 14:28:00'),(196,90,60,'TICKET_CREATED',NULL,'OPEN','สร้าง Ticket ใหม่','2026-05-28 14:28:53'),(198,91,69,'TICKET_CREATED',NULL,'OPEN','สร้าง Ticket ใหม่','2026-05-28 14:40:48'),(199,90,61,'STATUS_CHANGE','OPEN','IN_PROGRESS','รับงาน','2026-05-28 14:38:00'),(200,90,61,'STATUS_CHANGE','IN_PROGRESS','RESOLVED','สาเหตุ: เจ้าหน้าที่ไปโดนปุ่มไม่แสดงผลวินิจฉัย\nวิธีแก้ไข: เอาติกไม่แสดงผลวินิจฉัยออก','2026-05-28 14:51:00'),(202,91,61,'STATUS_CHANGE','OPEN','IN_PROGRESS','รับงาน','2026-05-28 14:56:00'),(203,91,61,'STATUS_CHANGE','IN_PROGRESS','RESOLVED','สาเหตุ: ล๊อตวัคซีนไม่ขึ้น\nวิธีแก้ไข: เข้าไปกดปิดและเปิดล๊อตวัคซีนในระบบใหม่','2026-05-28 15:05:00'),(204,92,70,'TICKET_CREATED',NULL,'OPEN','สร้าง Ticket ใหม่','2026-05-29 10:00:37'),(206,92,61,'STATUS_CHANGE','OPEN','IN_PROGRESS','รับงาน','2026-05-29 10:03:00'),(207,92,61,'STATUS_CHANGE','IN_PROGRESS','RESOLVED','สาเหตุ: คีย์หัตถการ BIOPSY ไม่ได้\nวิธีแก้ไข: เพิ่มหัตถการในระบบใหม่','2026-05-29 10:07:00'),(208,93,71,'TICKET_CREATED',NULL,'OPEN','สร้าง Ticket ใหม่','2026-06-02 13:07:32'),(210,94,72,'TICKET_CREATED',NULL,'OPEN','สร้าง Ticket ใหม่','2026-06-02 14:22:12'),(212,94,58,'STATUS_CHANGE','OPEN','IN_PROGRESS','รับงาน','2026-06-02 14:26:00'),(213,94,58,'STATUS_CHANGE','IN_PROGRESS','RESOLVED','สาเหตุ: หัวพิมพ์สีฟ้า,ชมพู ตัน\nวิธีแก้ไข: ล้างหัวพิมพ์','2026-06-02 14:30:00'),(214,93,58,'STATUS_CHANGE','OPEN','IN_PROGRESS','รับงาน','2026-06-02 13:07:00'),(215,93,58,'STATUS_CHANGE','IN_PROGRESS','RESOLVED','สาเหตุ: Gateway หยุดทำงาน\nวิธีแก้ไข: รีสตาร์ท gateway','2026-06-02 13:24:00'),(216,95,73,'TICKET_CREATED',NULL,'OPEN','สร้าง Ticket ใหม่','2026-06-02 14:39:35'),(218,95,61,'STATUS_CHANGE','OPEN','IN_PROGRESS','รับงาน','2026-06-02 14:41:00'),(219,95,61,'STATUS_CHANGE','IN_PROGRESS','RESOLVED','สาเหตุ: กดเรียกคิวแล้วเสียงไม่ออก\nวิธีแก้ไข: ปิด-เปิด เซอร์วิสระบบคิวใหม่','2026-06-02 14:44:00'),(220,96,74,'TICKET_CREATED',NULL,'OPEN','สร้าง Ticket ใหม่','2026-06-02 15:45:26'),(222,96,58,'STATUS_CHANGE','OPEN','IN_PROGRESS','รับงาน','2026-06-02 15:46:00'),(223,96,58,'STATUS_CHANGE','IN_PROGRESS','RESOLVED','สาเหตุ: แรมสกปรก\nวิธีแก้ไข: ทำความสะอาดเครื่องและแรม','2026-06-02 15:50:00'),(224,95,61,'EDITED',NULL,NULL,'Admin แก้ไขข้อมูลการปิดงาน','2026-06-02 16:21:57'),(225,97,71,'TICKET_CREATED',NULL,'OPEN','สร้าง Ticket ใหม่','2026-06-04 08:17:21'),(227,97,61,'STATUS_CHANGE','OPEN','IN_PROGRESS','รับงาน','2026-06-04 08:20:00'),(228,97,61,'STATUS_CHANGE','IN_PROGRESS','RESOLVED','สาเหตุ: ระบบคิวขัดข้อง\nวิธีแก้ไข: แก้ไขโดยการติก auto call','2026-06-04 08:30:00'),(229,98,75,'TICKET_CREATED',NULL,'OPEN','สร้าง Ticket ใหม่','2026-06-04 09:48:17'),(231,98,58,'STATUS_CHANGE','OPEN','IN_PROGRESS','รับงาน','2026-06-04 09:52:00'),(232,98,58,'STATUS_CHANGE','IN_PROGRESS','RESOLVED','สาเหตุ: แรมแจ้งเตือน\nวิธีแก้ไข: ทำความสะอาดแรม','2026-06-04 09:58:00'),(233,98,58,'EDITED',NULL,NULL,'Admin แก้ไขข้อมูลการปิดงาน','2026-06-04 10:25:06');
/*!40000 ALTER TABLE `ticket_logs` ENABLE KEYS */;
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
