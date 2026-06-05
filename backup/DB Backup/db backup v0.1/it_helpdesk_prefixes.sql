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
-- Table structure for table `prefixes`
--

DROP TABLE IF EXISTS `prefixes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prefixes` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `sort_order` tinyint unsigned NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='คำนำหน้าชื่อ';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prefixes`
--

LOCK TABLES `prefixes` WRITE;
/*!40000 ALTER TABLE `prefixes` DISABLE KEYS */;
INSERT INTO `prefixes` VALUES (1,'นาย',1,1),(2,'นาง',2,1),(3,'นางสาว',3,1),(4,'ส.ต.',4,1),(5,'ส.ต.หญิง',5,1),(6,'ส.ท.',6,1),(7,'ส.ท.หญิง',7,1),(8,'ส.อ.',8,1),(9,'ส.อ.หญิง',9,1),(10,'จ.ส.ต.',10,1),(11,'จ.ส.ต.หญิง',11,1),(12,'จ.ส.ท.',12,1),(13,'จ.ส.ท.หญิง',13,1),(14,'จ.ส.อ.',14,1),(15,'จ.ส.อ.หญิง',15,1),(16,'ร.ต.',16,1),(17,'ร.ต.หญิง',17,1),(18,'ร.ท.',18,1),(19,'ร.ท.หญิง',19,1),(20,'ร.อ.',20,1),(21,'ร.อ.หญิง',21,1),(22,'พ.ต.',22,1),(23,'พ.ต.หญิง',23,1),(24,'พ.ท.',24,1),(25,'พ.ท.หญิง',25,1),(26,'พ.อ.',26,1),(27,'พ.อ.หญิง',27,1),(28,'อื่น ๆ',28,1);
/*!40000 ALTER TABLE `prefixes` ENABLE KEYS */;
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
