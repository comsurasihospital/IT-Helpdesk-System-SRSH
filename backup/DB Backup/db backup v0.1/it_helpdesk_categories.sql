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
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL COMMENT 'ชื่อประเภท',
  `code` varchar(50) NOT NULL,
  `sla_minutes` int unsigned NOT NULL DEFAULT '30' COMMENT 'SLA เป้าหมาย (นาที)',
  `icon` varchar(100) DEFAULT NULL COMMENT 'Bootstrap icon class',
  `color` varchar(20) DEFAULT NULL COMMENT 'Badge color',
  `sort_order` int unsigned NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='ประเภทปัญหา';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'โปรแกรม HOSxP / โปรแกรมอื่น ๆ ขัดข้อง','SOFTWARE',30,'bi-laptop','danger',1,1,'2026-03-06 15:22:45','2026-05-27 14:17:34'),(2,'เครื่องพิมพ์ขัดข้อง','PRINTER',30,'bi-printer','warning',2,1,'2026-03-06 15:22:45','2026-03-06 15:22:45'),(3,'เครื่องคอมพิวเตอร์ขัดข้อง','COMPUTER',30,'bi-pc-display','warning',3,1,'2026-03-06 15:22:45','2026-03-06 15:22:45'),(4,'ระบบอินเทอร์เน็ตขัดข้อง','NETWORK',20,'bi-wifi-off','danger',4,1,'2026-03-06 15:22:45','2026-03-09 14:22:10'),(5,'การขอข้อมูลสารสนเทศทางการแพทย์','INFO_REQ',1440,'bi-database','info',5,1,'2026-03-06 15:22:45','2026-03-09 14:22:10'),(6,'การเผยแพร่ข่าวสาร / Social Media','PUBLISH',1440,'bi-megaphone','primary',6,1,'2026-03-06 15:22:45','2026-03-09 14:22:10');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
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
