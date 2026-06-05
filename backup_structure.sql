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
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `ticket_id` int unsigned DEFAULT NULL,
  `user_id` int unsigned NOT NULL COMMENT 'ผู้รับการแจ้งเตือน',
  `type` varchar(100) NOT NULL COMMENT 'ประเภท เช่น TICKET_CREATED',
  `channel` enum('LINE','EMAIL','SYSTEM') NOT NULL DEFAULT 'LINE',
  `title` varchar(300) NOT NULL,
  `message` text NOT NULL,
  `is_sent` tinyint(1) NOT NULL DEFAULT '0',
  `sent_at` datetime DEFAULT NULL,
  `error_msg` text COMMENT 'ข้อผิดพลาด (ถ้ามี)',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notif_user` (`user_id`),
  KEY `idx_notif_is_sent` (`is_sent`),
  KEY `idx_notif_ticket` (`ticket_id`),
  CONSTRAINT `fk_notif_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='การแจ้งเตือน';
/*!40101 SET character_set_client = @saved_cs_client */;

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
-- Table structure for table `system_settings`
--

DROP TABLE IF EXISTS `system_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_settings` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL,
  `value` text,
  `description` varchar(300) DEFAULT NULL,
  `updated_by` int unsigned DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='ตั้งค่าระบบ';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ticket_attachments`
--

DROP TABLE IF EXISTS `ticket_attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ticket_attachments` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `ticket_id` int unsigned NOT NULL,
  `file_name` varchar(300) NOT NULL COMMENT 'ชื่อไฟล์ต้นฉบับ',
  `file_path` varchar(500) NOT NULL COMMENT 'Path เก็บในเซิร์ฟเวอร์',
  `file_size` int unsigned DEFAULT NULL COMMENT 'ขนาดไฟล์ (bytes)',
  `mime_type` varchar(100) DEFAULT NULL COMMENT 'MIME type',
  `uploaded_by` int unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_attachments_user` (`uploaded_by`),
  KEY `idx_attachments_ticket` (`ticket_id`),
  CONSTRAINT `fk_attachments_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_attachments_user` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=64 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='ไฟล์แนบ Ticket';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ticket_comments`
--

DROP TABLE IF EXISTS `ticket_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ticket_comments` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `ticket_id` int unsigned NOT NULL,
  `user_id` int unsigned NOT NULL,
  `comment` text NOT NULL,
  `is_internal` tinyint(1) NOT NULL DEFAULT '0' COMMENT '1 = Admin เห็นเท่านั้น',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_comments_user` (`user_id`),
  KEY `idx_comments_ticket` (`ticket_id`),
  CONSTRAINT `fk_comments_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_comments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='ความคิดเห็น Ticket';
/*!40101 SET character_set_client = @saved_cs_client */;

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
) ENGINE=InnoDB AUTO_INCREMENT=150 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='ประวัติ Ticket';
/*!40101 SET character_set_client = @saved_cs_client */;

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
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Ticket การแจ้งซ่อม';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `prefix_id` int unsigned DEFAULT NULL,
  `line_user_id` varchar(100) DEFAULT NULL COMMENT 'LINE User ID',
  `line_display_name` varchar(200) DEFAULT NULL COMMENT 'LINE Display Name',
  `line_picture_url` varchar(500) DEFAULT NULL COMMENT 'LINE Profile Picture URL',
  `first_name` varchar(100) NOT NULL COMMENT 'ชื่อ',
  `last_name` varchar(100) NOT NULL COMMENT 'นามสกุล',
  `phone` varchar(20) DEFAULT NULL COMMENT 'เบอร์โทรศัพท์',
  `department_id` int unsigned DEFAULT NULL COMMENT 'แผนก',
  `role` enum('USER','ADMIN','SUPERVISOR') NOT NULL DEFAULT 'USER',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `last_login_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `line_user_id` (`line_user_id`),
  KEY `idx_users_line_user_id` (`line_user_id`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_department` (`department_id`),
  KEY `fk_users_prefix` (`prefix_id`),
  CONSTRAINT `fk_users_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_users_prefix` FOREIGN KEY (`prefix_id`) REFERENCES `prefixes` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=58 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='ผู้ใช้งานระบบ';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Temporary view structure for view `v_dashboard_summary`
--

DROP TABLE IF EXISTS `v_dashboard_summary`;
/*!50001 DROP VIEW IF EXISTS `v_dashboard_summary`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_dashboard_summary` AS SELECT 
 1 AS `total_tickets`,
 1 AS `open_tickets`,
 1 AS `in_progress_tickets`,
 1 AS `resolved_tickets`,
 1 AS `cancelled_tickets`,
 1 AS `sla_breached`,
 1 AS `avg_satisfaction`,
 1 AS `avg_resolve_minutes`,
 1 AS `today_tickets`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_report_by_category`
--

DROP TABLE IF EXISTS `v_report_by_category`;
/*!50001 DROP VIEW IF EXISTS `v_report_by_category`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_report_by_category` AS SELECT 
 1 AS `id`,
 1 AS `category_name`,
 1 AS `category_code`,
 1 AS `sla_minutes`,
 1 AS `total_tickets`,
 1 AS `resolved`,
 1 AS `pending`,
 1 AS `sla_breached`,
 1 AS `avg_satisfaction`,
 1 AS `avg_resolve_minutes`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_report_by_department`
--

DROP TABLE IF EXISTS `v_report_by_department`;
/*!50001 DROP VIEW IF EXISTS `v_report_by_department`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_report_by_department` AS SELECT 
 1 AS `department_id`,
 1 AS `department_name`,
 1 AS `department_code`,
 1 AS `total_tickets`,
 1 AS `resolved`,
 1 AS `pending`,
 1 AS `sla_breached`,
 1 AS `avg_satisfaction`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_report_monthly`
--

DROP TABLE IF EXISTS `v_report_monthly`;
/*!50001 DROP VIEW IF EXISTS `v_report_monthly`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_report_monthly` AS SELECT 
 1 AS `report_year`,
 1 AS `report_month`,
 1 AS `report_ym`,
 1 AS `total`,
 1 AS `resolved`,
 1 AS `cancelled`,
 1 AS `pending`,
 1 AS `sla_breached`,
 1 AS `avg_satisfaction`,
 1 AS `avg_resolve_hours`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_tickets_full`
--

DROP TABLE IF EXISTS `v_tickets_full`;
/*!50001 DROP VIEW IF EXISTS `v_tickets_full`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_tickets_full` AS SELECT 
 1 AS `id`,
 1 AS `ticket_no`,
 1 AS `user_id`,
 1 AS `assigned_to`,
 1 AS `status`,
 1 AS `priority`,
 1 AS `title`,
 1 AS `description`,
 1 AS `reporter_prefix`,
 1 AS `reporter_name`,
 1 AS `reporter_phone`,
 1 AS `reporter_dept_id`,
 1 AS `reporter_prefix_name`,
 1 AS `reporter_department_name`,
 1 AS `resolution_note`,
 1 AS `sla_due_at`,
 1 AS `sla_status`,
 1 AS `satisfaction_score`,
 1 AS `satisfaction_note`,
 1 AS `rated_at`,
 1 AS `opened_at`,
 1 AS `accepted_at`,
 1 AS `resolved_at`,
 1 AS `cancelled_at`,
 1 AS `created_at`,
 1 AS `updated_at`,
 1 AS `line_user_id`,
 1 AS `user_prefix_id`,
 1 AS `user_prefix`,
 1 AS `first_name`,
 1 AS `last_name`,
 1 AS `user_name`,
 1 AS `user_phone`,
 1 AS `department_id`,
 1 AS `department_name`,
 1 AS `admin_first_name`,
 1 AS `admin_last_name`,
 1 AS `admin_name`,
 1 AS `category_name`,
 1 AS `category_code`,
 1 AS `sla_minutes`,
 1 AS `resolve_minutes`,
 1 AS `accept_minutes`*/;
SET character_set_client = @saved_cs_client;

--
-- Final view structure for view `v_dashboard_summary`
--

/*!50001 DROP VIEW IF EXISTS `v_dashboard_summary`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_dashboard_summary` AS select count(0) AS `total_tickets`,sum((`tickets`.`status` = 'OPEN')) AS `open_tickets`,sum((`tickets`.`status` = 'IN_PROGRESS')) AS `in_progress_tickets`,sum((`tickets`.`status` = 'RESOLVED')) AS `resolved_tickets`,sum((`tickets`.`status` = 'CANCELLED')) AS `cancelled_tickets`,sum((`tickets`.`sla_status` = 'BREACHED')) AS `sla_breached`,round(avg(`tickets`.`satisfaction_score`),2) AS `avg_satisfaction`,round(avg((case when (`tickets`.`status` = 'RESOLVED') then timestampdiff(MINUTE,`tickets`.`opened_at`,`tickets`.`resolved_at`) end)),0) AS `avg_resolve_minutes`,sum((cast(`tickets`.`opened_at` as date) = curdate())) AS `today_tickets` from `tickets` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_report_by_category`
--

/*!50001 DROP VIEW IF EXISTS `v_report_by_category`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_report_by_category` AS select `c`.`id` AS `id`,`c`.`name` AS `category_name`,`c`.`code` AS `category_code`,`c`.`sla_minutes` AS `sla_minutes`,count(`t`.`id`) AS `total_tickets`,sum((`t`.`status` = 'RESOLVED')) AS `resolved`,sum((`t`.`status` in ('OPEN','IN_PROGRESS'))) AS `pending`,sum((`t`.`sla_status` = 'BREACHED')) AS `sla_breached`,round(avg(`t`.`satisfaction_score`),2) AS `avg_satisfaction`,round(avg((case when (`t`.`status` = 'RESOLVED') then timestampdiff(MINUTE,`t`.`opened_at`,`t`.`resolved_at`) end)),0) AS `avg_resolve_minutes` from (`categories` `c` left join `tickets` `t` on((`t`.`category_id` = `c`.`id`))) group by `c`.`id`,`c`.`name`,`c`.`code`,`c`.`sla_minutes` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_report_by_department`
--

/*!50001 DROP VIEW IF EXISTS `v_report_by_department`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_report_by_department` AS select `d`.`id` AS `department_id`,`d`.`name` AS `department_name`,`d`.`code` AS `department_code`,count(`t`.`id`) AS `total_tickets`,sum((`t`.`status` = 'RESOLVED')) AS `resolved`,sum((`t`.`status` in ('OPEN','IN_PROGRESS'))) AS `pending`,sum((`t`.`sla_status` = 'BREACHED')) AS `sla_breached`,round(avg(`t`.`satisfaction_score`),2) AS `avg_satisfaction` from ((`departments` `d` left join `users` `u` on((`u`.`department_id` = `d`.`id`))) left join `tickets` `t` on((`t`.`user_id` = `u`.`id`))) group by `d`.`id`,`d`.`name`,`d`.`code` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_report_monthly`
--

/*!50001 DROP VIEW IF EXISTS `v_report_monthly`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_report_monthly` AS select year(`tickets`.`opened_at`) AS `report_year`,month(`tickets`.`opened_at`) AS `report_month`,date_format(`tickets`.`opened_at`,'%Y-%m') AS `report_ym`,count(0) AS `total`,sum((`tickets`.`status` = 'RESOLVED')) AS `resolved`,sum((`tickets`.`status` = 'CANCELLED')) AS `cancelled`,sum((`tickets`.`status` in ('OPEN','IN_PROGRESS'))) AS `pending`,sum((`tickets`.`sla_status` = 'BREACHED')) AS `sla_breached`,round(avg(`tickets`.`satisfaction_score`),2) AS `avg_satisfaction`,round((avg((case when (`tickets`.`status` = 'RESOLVED') then timestampdiff(MINUTE,`tickets`.`opened_at`,`tickets`.`resolved_at`) end)) / 60),2) AS `avg_resolve_hours` from `tickets` group by year(`tickets`.`opened_at`),month(`tickets`.`opened_at`),date_format(`tickets`.`opened_at`,'%Y-%m') */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_tickets_full`
--

/*!50001 DROP VIEW IF EXISTS `v_tickets_full`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_tickets_full` AS select `t`.`id` AS `id`,`t`.`ticket_no` AS `ticket_no`,`t`.`user_id` AS `user_id`,`t`.`assigned_to` AS `assigned_to`,`t`.`status` AS `status`,`t`.`priority` AS `priority`,`t`.`title` AS `title`,`t`.`description` AS `description`,`t`.`reporter_prefix` AS `reporter_prefix`,`t`.`reporter_name` AS `reporter_name`,`t`.`reporter_phone` AS `reporter_phone`,`t`.`reporter_dept_id` AS `reporter_dept_id`,`rp`.`name` AS `reporter_prefix_name`,coalesce(`rd`.`name`,`d`.`name`) AS `reporter_department_name`,`t`.`resolution_note` AS `resolution_note`,`t`.`sla_due_at` AS `sla_due_at`,`t`.`sla_status` AS `sla_status`,`t`.`satisfaction_score` AS `satisfaction_score`,`t`.`satisfaction_note` AS `satisfaction_note`,`t`.`rated_at` AS `rated_at`,`t`.`opened_at` AS `opened_at`,`t`.`accepted_at` AS `accepted_at`,`t`.`resolved_at` AS `resolved_at`,`t`.`cancelled_at` AS `cancelled_at`,`t`.`created_at` AS `created_at`,`t`.`updated_at` AS `updated_at`,`u`.`line_user_id` AS `line_user_id`,`u`.`prefix_id` AS `user_prefix_id`,`up`.`name` AS `user_prefix`,`u`.`first_name` AS `first_name`,`u`.`last_name` AS `last_name`,concat(coalesce(`up`.`name`,''),' ',`u`.`first_name`,' ',`u`.`last_name`) AS `user_name`,`u`.`phone` AS `user_phone`,`u`.`department_id` AS `department_id`,`d`.`name` AS `department_name`,`a`.`first_name` AS `admin_first_name`,`a`.`last_name` AS `admin_last_name`,concat(coalesce(`ap`.`name`,''),' ',coalesce(`a`.`first_name`,''),' ',coalesce(`a`.`last_name`,'')) AS `admin_name`,`c`.`name` AS `category_name`,`c`.`code` AS `category_code`,`c`.`sla_minutes` AS `sla_minutes`,(case when ((`t`.`resolved_at` is not null) and (`t`.`opened_at` is not null)) then timestampdiff(MINUTE,`t`.`opened_at`,`t`.`resolved_at`) else NULL end) AS `resolve_minutes`,(case when ((`t`.`accepted_at` is not null) and (`t`.`opened_at` is not null)) then timestampdiff(MINUTE,`t`.`opened_at`,`t`.`accepted_at`) else NULL end) AS `accept_minutes` from ((((((((`tickets` `t` join `users` `u` on((`u`.`id` = `t`.`user_id`))) left join `prefixes` `up` on((`up`.`id` = `u`.`prefix_id`))) left join `users` `a` on((`a`.`id` = `t`.`assigned_to`))) left join `prefixes` `ap` on((`ap`.`id` = `a`.`prefix_id`))) join `departments` `d` on((`d`.`id` = `u`.`department_id`))) left join `departments` `rd` on((`rd`.`id` = `t`.`reporter_dept_id`))) left join `prefixes` `rp` on((`rp`.`id` = `t`.`reporter_prefix`))) join `categories` `c` on((`c`.`id` = `t`.`category_id`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-23 10:18:24
