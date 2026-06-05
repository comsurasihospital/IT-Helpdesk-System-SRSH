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
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL COMMENT 'ชื่อหน่วยงาน',
  `code` varchar(20) NOT NULL COMMENT 'รหัสหน่วยงาน',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='หน่วยงาน / แผนก';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (1,'ศูนย์เทคโนโลยีสารสนเทศ','IT',1,'2026-03-06 15:22:45','2026-03-09 15:01:27'),(2,'กองตรวจโรคผู้ป่วยนอก','OPD',1,'2026-03-06 15:22:45','2026-05-27 14:27:52'),(3,'วอร์ดพิเศษ','IPD',1,'2026-03-06 15:22:45','2026-03-09 15:01:27'),(4,'ห้องฉุกเฉิน','ER',1,'2026-03-06 15:22:45','2026-03-09 15:01:27'),(5,'การเงิน','MONEY',1,'2026-03-06 15:22:45','2026-03-09 15:11:59'),(6,'กองบังคับการ','HR',1,'2026-03-06 15:22:45','2026-03-09 15:01:27'),(7,'กองเภสัชกรรม','PHARM',1,'2026-03-06 15:22:45','2026-03-10 10:38:15'),(8,'พยาธิวิทยา','LAB',1,'2026-03-06 15:22:45','2026-03-09 15:01:27'),(9,'รังสีวิทยา','XRAY',1,'2026-03-06 15:22:45','2026-03-11 15:26:14'),(10,'ส่งกำลังและบริการ','PUR',1,'2026-03-06 15:22:45','2026-03-09 15:01:27'),(11,'ซักรีด','WASH',1,'2026-03-06 15:22:45','2026-03-09 15:11:59'),(12,'สูทกรรม','NUTRI',1,'2026-03-06 15:22:45','2026-03-09 15:01:27'),(13,'ผู้บังคับบัญชา','ADMIN',1,'2026-03-06 15:22:45','2026-03-09 15:02:26'),(14,'สำนักงานผู้บังคับบัญชา','BOSS',1,'2026-03-09 15:02:26','2026-03-09 15:02:26'),(15,'งบประมาณ','BG',1,'2026-03-09 15:11:59','2026-03-09 15:11:59'),(16,'สวัสดิการ','BG2',1,'2026-03-09 15:11:59','2026-03-09 15:11:59'),(17,'ไตเทียม','PT',1,'2026-03-09 15:11:59','2026-03-09 15:11:59'),(18,'ศูนย์บริการสิทธิ์และจัดเก็บเงินรายได้','CLAIM',1,'2026-03-09 15:11:59','2026-03-09 15:11:59'),(19,'ICU','ICU',1,'2026-03-09 15:11:59','2026-03-09 15:11:59'),(20,'กายภาพบำบัด','PHY',1,'2026-03-09 15:11:59','2026-03-09 15:11:59'),(21,'กองทันตกรรม','DENT',1,'2026-03-09 15:11:59','2026-03-09 15:11:59'),(22,'ออร์โธปิดิกส์','ORTHO',1,'2026-03-09 15:11:59','2026-03-09 15:11:59'),(23,'กองการพยาบาล','NUR',1,'2026-03-09 15:11:59','2026-03-09 15:11:59'),(24,'ห้องผ่าตัด','OR',1,'2026-03-09 15:11:59','2026-03-09 15:11:59'),(25,'เวชระเบียน','TB',1,'2026-03-09 15:11:59','2026-03-09 15:11:59'),(26,'แพทย์แผนไทย','TM',1,'2026-03-09 15:11:59','2026-03-09 15:11:59'),(27,'จ่ายกลาง','JK',1,'2026-03-09 15:11:59','2026-03-09 15:11:59'),(28,'พลขับ','DRI',1,'2026-03-09 15:11:59','2026-03-09 15:11:59'),(29,'เวชกรรมป้องกัน','VP',1,'2026-03-09 15:12:26','2026-03-09 15:12:26'),(30,'กองร้อยพลเสนารักษ์','ROI',1,'2026-03-09 15:12:50','2026-03-09 15:12:50'),(31,'ตรวจสุขภาพประจำปี','CHKUP',1,'2026-03-11 15:25:50','2026-03-11 15:26:14');
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-04 12:53:01
