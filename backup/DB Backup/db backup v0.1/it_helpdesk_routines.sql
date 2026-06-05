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
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-04 12:53:01
