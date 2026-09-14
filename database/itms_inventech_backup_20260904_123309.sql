DROP TABLE IF EXISTS `cameras`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cameras` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `device_code` varchar(255) NOT NULL,
  `personnel_id` int(11) NOT NULL,
  `device_id` int(11) NOT NULL,
  `division_id` int(11) NOT NULL,
  `acquisition_date` date DEFAULT NULL,
  `acquisition_details` text DEFAULT NULL,
  `brand` varchar(255) DEFAULT NULL,
  `model` varchar(255) DEFAULT NULL,
  `serial_no` varchar(255) DEFAULT NULL,
  `previous_owners_id` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`previous_owners_id`)),
  `created_date` timestamp NULL DEFAULT current_timestamp(),
  `last_update_at` date DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `cameras` VALUES (1,'CAM-4000',4,0,7,'2026-06-04','CCTV unit for office monitoring','Hikvision','DS-2000','SN-CAM-7000',NULL,'2026-04-15 16:00:00',NULL,1),(2,'CAM-4001',5,0,8,'2026-06-21','CCTV unit for office monitoring','Dahua','DS-2001','SN-CAM-7001',NULL,'2025-12-24 16:00:00',NULL,1),(3,'CAM-4002',6,0,9,'2025-12-07','CCTV unit for office monitoring','Hikvision','DS-2002','SN-CAM-7002',NULL,'2026-08-25 16:00:00',NULL,1),(4,'CAM-4003',7,0,10,'2026-02-03','CCTV unit for office monitoring','Dahua','DS-2003','SN-CAM-7003',NULL,'2026-07-27 16:00:00',NULL,1),(5,'CAM-4004',8,0,11,'2026-07-19','CCTV unit for office monitoring','Hikvision','DS-2004','SN-CAM-7004',NULL,'2026-06-24 16:00:00',NULL,1),(6,'CAM-4005',9,0,12,'2026-07-19','CCTV unit for office monitoring','Dahua','DS-2005','SN-CAM-7005',NULL,'2026-01-03 16:00:00',NULL,1);
DROP TABLE IF EXISTS `component_test_imports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `component_test_imports` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `label` varchar(150) DEFAULT NULL,
  `filename` varchar(255) DEFAULT NULL,
  `row_count` int(11) NOT NULL DEFAULT 0,
  `imported_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `component_test_results`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `component_test_results` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `import_id` int(11) NOT NULL,
  `section` varchar(100) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `component` varchar(150) DEFAULT NULL,
  `property` varchar(150) DEFAULT NULL,
  `value` text DEFAULT NULL,
  `status` varchar(30) DEFAULT NULL,
  `finding` text DEFAULT NULL,
  `specification` text DEFAULT NULL,
  `functional_test` varchar(50) DEFAULT NULL,
  `actual_result` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_component_test_results_import_id` (`import_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `desktops`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `desktops` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `personnel_id` int(11) DEFAULT NULL,
  `device_id` int(11) NOT NULL,
  `device_name` varchar(150) NOT NULL,
  `division_id` int(11) DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `os` varchar(100) DEFAULT NULL,
  `is_os_licensed` tinyint(1) DEFAULT NULL,
  `os_license_key` varchar(255) DEFAULT NULL,
  `is_remote_acc` tinyint(1) DEFAULT NULL,
  `endpoint_security_id` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `no_of_installed_anti_virus` int(11) DEFAULT NULL,
  `date_installed` date DEFAULT NULL,
  `guid` varchar(100) DEFAULT NULL,
  `mac_address` varchar(100) DEFAULT NULL,
  `cpu_brand` varchar(100) DEFAULT NULL,
  `cpu_generation` int(11) DEFAULT NULL,
  `cpu_cores` int(11) DEFAULT NULL,
  `gb_ram` int(11) DEFAULT NULL,
  `monitor_brand` varchar(100) DEFAULT NULL,
  `monitor_size_inches` int(11) DEFAULT NULL,
  `no_of_user_accounts` int(11) DEFAULT NULL,
  `user_account_type` longtext DEFAULT NULL,
  `authorized_software` text DEFAULT NULL,
  `unauthorized_software` text DEFAULT NULL,
  `office_application` varchar(150) DEFAULT NULL,
  `is_office_licensed` tinyint(1) DEFAULT NULL,
  `office_license_key` varchar(255) DEFAULT NULL,
  `previous_owners_id` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`previous_owners_id`)),
  `created_date` date DEFAULT current_timestamp(),
  `last_updated_at` date DEFAULT NULL,
  `par_serial_no` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `acquisition_date` date DEFAULT NULL,
  `installed_software` longtext DEFAULT NULL,
  `missing_updates` longtext DEFAULT NULL,
  `usb_history` longtext DEFAULT NULL,
  `network_adapters` longtext DEFAULT NULL,
  `printers_detected` longtext DEFAULT NULL,
  `hotfixes` longtext DEFAULT NULL,
  `last_agent_report_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `desktops` VALUES (1,1,0,'ITMS-ITSD-0100',1,'192.168.1.32','Windows 10 Home Single Language 22H2 (x64)',1,NULL,1,NULL,1,NULL,NULL,'74:3A:F4:9C:1A:44','Intel Core i5-12450H',12,8,8,'Acer KA242Y',24,2,NULL,NULL,NULL,'Microsoft Office LTSC Professional Plus 2021',1,NULL,NULL,'2026-06-22','2026-09-03','PAR-1000',1,'2025-12-22',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(2,2,0,'ITMS-ITSD-0101',2,NULL,'Windows 10 Pro',1,NULL,1,NULL,2,NULL,NULL,NULL,'AMD',12,6,16,'HP W2072a',24,3,NULL,NULL,NULL,'Microsoft Office LTSC Professional Plus 2021',1,NULL,NULL,'2026-03-03',NULL,'PAR-1001',1,'2026-08-20',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(3,3,0,'ITMS-ITSD-0102',3,NULL,'Windows 11 Home Single Language',1,NULL,1,NULL,3,NULL,NULL,NULL,'Intel',12,6,32,'Lenovo LI2054A',24,4,NULL,NULL,NULL,'Microsoft Office LTSC Professional Plus 2021',1,NULL,NULL,'2026-07-09',NULL,'PAR-1002',1,'2026-07-13',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(4,4,0,'ITMS-ITSD-0103',4,NULL,'Windows 11 Pro',1,NULL,1,NULL,4,NULL,NULL,NULL,'AMD',12,6,8,'Acer V196HQL',24,2,NULL,NULL,NULL,'Microsoft Office LTSC Professional Plus 2021',1,NULL,NULL,'2025-12-18',NULL,'PAR-1003',1,'2025-12-22',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(5,5,0,'ITMS-ITSD-0104',5,NULL,'Windows 10 Pro',1,NULL,1,NULL,1,NULL,NULL,NULL,'Intel',12,6,16,'Acer KA242Y',24,3,NULL,NULL,NULL,'Microsoft Office LTSC Professional Plus 2021',1,NULL,NULL,'2026-04-10',NULL,'PAR-1004',1,'2025-12-26',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(6,6,0,'ITMS-ITSD-0105',6,NULL,'Windows 11 Home Single Language',1,NULL,1,NULL,2,NULL,NULL,NULL,'AMD',12,6,32,'HP W2072a',24,4,NULL,NULL,NULL,'Microsoft Office LTSC Professional Plus 2021',1,NULL,NULL,'2026-03-15',NULL,'PAR-1005',1,'2026-08-07',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(7,7,0,'ITMS-ITSD-0106',7,NULL,'Windows 11 Pro',1,NULL,1,NULL,3,NULL,NULL,NULL,'Intel',12,6,8,'Lenovo LI2054A',24,2,NULL,NULL,NULL,'Microsoft Office LTSC Professional Plus 2021',1,NULL,NULL,'2026-06-12',NULL,'PAR-1006',1,'2026-08-05',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(8,8,0,'ITMS-ITSD-0107',8,NULL,'Windows 10 Pro',1,NULL,1,NULL,4,NULL,NULL,NULL,'AMD',12,6,16,'Acer V196HQL',24,3,NULL,NULL,NULL,'Microsoft Office LTSC Professional Plus 2021',1,NULL,NULL,'2026-02-27',NULL,'PAR-1007',1,'2026-05-21',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(9,9,0,'ITMS-ITSD-0108',9,NULL,'Windows 11 Home Single Language',1,NULL,1,NULL,1,NULL,NULL,NULL,'Intel',12,6,32,'Acer KA242Y',24,4,NULL,NULL,NULL,'Microsoft Office LTSC Professional Plus 2021',1,NULL,NULL,'2025-12-20',NULL,'PAR-1008',1,'2026-07-03',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(10,10,0,'ITMS-ITSD-0109',10,NULL,'Windows 11 Pro',1,NULL,1,NULL,2,NULL,NULL,NULL,'AMD',12,6,8,'HP W2072a',24,2,NULL,NULL,NULL,'Microsoft Office LTSC Professional Plus 2021',1,NULL,NULL,'2026-07-17',NULL,'PAR-1009',1,'2026-02-12',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(11,11,0,'ITMS-ITSD-0110',11,NULL,'Windows 10 Pro',1,NULL,1,NULL,3,NULL,NULL,NULL,'Intel',12,6,16,'Lenovo LI2054A',24,3,NULL,NULL,NULL,'Microsoft Office LTSC Professional Plus 2021',1,NULL,NULL,'2026-08-25',NULL,'PAR-1010',1,'2026-04-21',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(12,12,0,'ITMS-ITSD-0111',12,NULL,'Windows 11 Home Single Language',1,NULL,1,NULL,4,NULL,NULL,NULL,'AMD',12,6,32,'Acer V196HQL',24,4,NULL,NULL,NULL,'Microsoft Office LTSC Professional Plus 2021',1,NULL,NULL,'2025-12-13',NULL,'PAR-1011',1,'2026-08-20',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(13,13,0,'ITMS-ITSD-0112',13,NULL,'Windows 11 Pro',1,NULL,1,NULL,1,NULL,NULL,NULL,'Intel',12,6,8,'Acer KA242Y',24,2,NULL,NULL,NULL,'Microsoft Office LTSC Professional Plus 2021',1,NULL,NULL,'2026-01-18',NULL,'PAR-1012',1,'2026-05-03',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(14,14,0,'ITMS-ITSD-0113',14,NULL,'Windows 10 Pro',1,NULL,1,NULL,2,NULL,NULL,NULL,'AMD',12,6,16,'HP W2072a',24,3,NULL,NULL,NULL,'Microsoft Office LTSC Professional Plus 2021',1,NULL,NULL,'2026-08-13',NULL,'PAR-1013',1,'2026-04-22',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(15,15,0,'ITMS-ITSD-0114',15,NULL,'Windows 11 Home Single Language',1,NULL,1,NULL,3,NULL,NULL,NULL,'Intel',12,6,32,'Lenovo LI2054A',24,4,NULL,NULL,NULL,'Microsoft Office LTSC Professional Plus 2021',1,NULL,NULL,'2026-01-21',NULL,'PAR-1014',1,'2026-03-04',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(17,NULL,0,'VIVAMAX',NULL,'192.168.1.187','Microsoft Windows 11 Enterprise 10.0.26100 (64-bit)',NULL,NULL,NULL,NULL,1,NULL,NULL,'F4:4D:30:FD:C9:3C','Intel(R) Core(TM) i7-7700 CPU @ 3.60GHz',NULL,4,12,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-07','2026-09-07','DTVQ8SP191810049229600',1,NULL,'[{\"name\":\"AOMEI Partition Assistant 10.3.0\",\"version\":\"10.3.0\",\"publisher\":\"AOMEI International Network Limited.\",\"install_date\":\"2025-01-22\"},{\"name\":\"Belarc Advisor 12.1\",\"version\":\"12.1.0.0\",\"publisher\":\"Belarc, Inc.\",\"install_date\":null},{\"name\":\"Blackmagic RAW Common Components\",\"version\":\"5.1\",\"publisher\":\"Blackmagic Design\",\"install_date\":\"2026-03-13\"},{\"name\":\"Brave\",\"version\":\"152.1.94.121\",\"publisher\":\"Brave Software Inc\",\"install_date\":\"2026-09-07\"},{\"name\":\"CnCNet Yuri\'s Revenge\",\"version\":\"8.15.0\",\"publisher\":\"cncnet.org\",\"install_date\":\"2025-09-19\"},{\"name\":\"Command and Conquer Red Alert 3 Complete version 1.12\",\"version\":\"1.12\",\"publisher\":\"Electronic Arts\",\"install_date\":\"2026-07-21\"},{\"name\":\"CPUID HWMonitor 1.56\",\"version\":\"1.56\",\"publisher\":\"CPUID, Inc.\",\"install_date\":\"2025-03-28\"},{\"name\":\"DaVinci Resolve Control Panels\",\"version\":\"2.3.4.0\",\"publisher\":\"Blackmagic Design\",\"install_date\":\"2026-03-13\"},{\"name\":\"DiskGenius V6.1.1\",\"version\":null,\"publisher\":\"Yizisoo Software Co., Ltd.\",\"install_date\":\"2026-01-15\"},{\"name\":\"EaseUS Data Recovery Wizard\",\"version\":null,\"publisher\":\"EaseUS Data Recovery Wizard\",\"install_date\":\"2026-01-28\"},{\"name\":\"EPSON L3210 Series Printer Uninstall\",\"version\":null,\"publisher\":\"Seiko Epson Corporation\",\"install_date\":null},{\"name\":\"EPSON L3250 Series Printer Uninstall\",\"version\":null,\"publisher\":\"Seiko Epson Corporation\",\"install_date\":null},{\"name\":\"Epson Printer Connection Checker\",\"version\":\"3.4.3.0\",\"publisher\":\"Seiko Epson Corporation\",\"install_date\":\"2026-04-27\"},{\"name\":\"EpsonNet Print\",\"version\":\"3.3.1.0\",\"publisher\":\"Seiko Epson Corporation\",\"install_date\":\"2026-04-27\"},{\"name\":\"ExpressPCB\",\"version\":\"7.9.0\",\"publisher\":\"ExpressPCB, LLC\",\"install_date\":\"2026-03-16\"},{\"name\":\"Git\",\"version\":\"2.54.0\",\"publisher\":\"The Git Development Community\",\"install_date\":\"2026-05-12\"},{\"name\":\"Google Chrome\",\"version\":\"152.0.7977.76\",\"publisher\":\"Google LLC\",\"install_date\":\"2026-09-04\"},{\"name\":\"Hard Disk Sentinel PRO\",\"version\":\"6.40\",\"publisher\":\"Janos Mathe\",\"install_date\":\"2026-07-30\"},{\"name\":\"HP Dropbox Plugin\",\"version\":\"56.0.472.0\",\"publisher\":\"HP\",\"install_date\":\"2026-06-25\"},{\"name\":\"HP EmailSMTP Plugin\",\"version\":\"56.0.472.0\",\"publisher\":\"HP\",\"install_date\":\"2026-06-25\"},{\"name\":\"HP FTP Plugin\",\"version\":\"56.0.472.0\",\"publisher\":\"HP\",\"install_date\":\"2026-06-25\"},{\"name\":\"HP Google Drive Plugin\",\"version\":\"56.0.472.0\",\"publisher\":\"HP\",\"install_date\":\"2026-06-25\"},{\"name\":\"HP OCR\",\"version\":\"1.0.1019.0\",\"publisher\":\"HP Inc.\",\"install_date\":\"2026-06-25\"},{\"name\":\"HP OneDrive Plugin\",\"version\":\"56.0.472.0\",\"publisher\":\"HP\",\"install_date\":\"2026-06-25\"},{\"name\":\"HP Scan Basic Device Software\",\"version\":\"51.2.5121.22200\",\"publisher\":\"HP Inc.\",\"install_date\":\"2026-06-25\"},{\"name\":\"HP ScanJet Flow 7000 s3 Scan Driver\",\"version\":\"54.0.1044.0\",\"publisher\":\"HP Inc.\",\"install_date\":\"2026-06-25\"},{\"name\":\"HP SFTP Plugin\",\"version\":\"56.0.472.0\",\"publisher\":\"HP Inc.\",\"install_date\":\"2026-06-25\"},{\"name\":\"HP SharePoint Plugin\",\"version\":\"56.0.472.0\",\"publisher\":\"HP\",\"install_date\":\"2026-06-25\"},{\"name\":\"HWiNFO64 Version 7.62\",\"version\":\"7.62\",\"publisher\":\"Martin Malik, REALiX s.r.o.\",\"install_date\":\"2025-01-22\"},{\"name\":\"ImgBurn\",\"version\":\"2.5.8.0\",\"publisher\":\"LIGHTNING UK!\",\"install_date\":\"2025-02-04\"},{\"name\":\"IntelliJ IDEA 2026.1.3\",\"version\":\"261.25134.95\",\"publisher\":\"JetBrains s.r.o.\",\"install_date\":null},{\"name\":\"K-Lite Codec Pack 18.7.5 Full\",\"version\":\"18.7.5\",\"publisher\":\"KLCP\",\"install_date\":\"2025-01-22\"},{\"name\":\"Microsoft .NET Runtime - 6.0.36 (x64)\",\"version\":\"6.0.36.34214\",\"publisher\":\"Microsoft Corporation\",\"install_date\":null},{\"name\":\"Microsoft Edge\",\"version\":\"150.0.4078.65\",\"publisher\":\"Microsoft Corporation\",\"install_date\":\"2026-07-12\"},{\"name\":\"Microsoft Office Professional Plus 2021 - en-us\",\"version\":\"16.0.20131.20112\",\"publisher\":\"Microsoft Corporation\",\"install_date\":null},{\"name\":\"Microsoft Teams Meeting Add-in for Microsoft Office\",\"version\":\"1.26.20101\",\"publisher\":\"Microsoft\",\"install_date\":\"2026-09-01\"},{\"name\":\"Microsoft Update Health Tools\",\"version\":\"3.74.0.0\",\"publisher\":\"Microsoft Corporation\",\"install_date\":\"2025-01-23\"},{\"name\":\"Microsoft Visual C++ 2008 Redistributable - x64 9.0.30729.17\",\"version\":\"9.0.30729\",\"publisher\":\"Microsoft Corporation\",\"install_date\":\"2025-01-22\"},{\"name\":\"Microsoft Visual C++ 2008 Redistributable - x64 9.0.30729.4048\",\"version\":\"9.0.30729.4048\",\"publisher\":\"Microsoft Corporation\",\"install_date\":\"2025-02-17\"},{\"name\":\"Microsoft Visual C++ 2008 Redistributable - x64 9.0.30729.4148\",\"version\":\"9.0.30729.4148\",\"publisher\":\"Microsoft Corporation\",\"install_date\":\"2026-07-07\"},{\"name\":\"Microsoft Visual C++ 2008 Redistributable - x64 9.0.30729.6161\",\"version\":\"9.0.30729.6161\",\"publisher\":\"Microsoft Corporation\",\"install_date\":\"2025-02-25\"},{\"name\":\"Microsoft Visual C++ 2008 Redistributable - x86 9.0.30729.17\",\"version\":\"9.0.30729\",\"publisher\":\"Microsoft Corporation\",\"install_date\":\"2025-01-22\"},{\"name\":\"Microsoft Visual C++ 2008 Redistributable - x86 9.0.30729.4148\",\"version\":\"9.0.30729.4148\",\"publisher\":\"Microsoft Corporation\",\"install_date\":\"2026-07-07\"},{\"name\":\"Microsoft Visual C++ 2008 Redistributable - x86 9.0.30729.6161\",\"version\":\"9.0.30729.6161\",\"publisher\":\"Microsoft Corporation\",\"install_date\":\"2025-02-25\"},{\"name\":\"Microsoft Visual C++ 2010  x64 Redistributable - 10.0.40219\",\"version\":\"10.0.40219\",\"publisher\":\"Microsoft Corporation\",\"install_date\":\"2025-01-28\"},{\"name\":\"Microsoft Visual C++ 2010  x86 Redistributable - 10.0.40219\",\"version\":\"10.0.40219\",\"publisher\":\"Microsoft Corporation\",\"install_date\":\"2025-01-28\"},{\"name\":\"Microsoft Visual C++ 2012 Redistributable (x64) - 11.0.61030\",\"version\":\"11.0.61030.0\",\"publisher\":\"Microsoft Corporation\",\"install_date\":null},{\"name\":\"Microsoft Visual C++ 2012 Redistributable (x86) - 11.0.61030\",\"version\":\"11.0.61030.0\",\"publisher\":\"Microsoft Corporation\",\"install_date\":null},{\"name\":\"Microsoft Visual C++ 2013 Redistributable (x64) - 12.0.30501\",\"version\":\"12.0.30501.0\",\"publisher\":\"Microsoft Corporation\",\"install_date\":null},{\"name\":\"Microsoft Visual C++ 2013 Redistributable (x64) - 12.0.40664\",\"version\":\"12.0.40664.0\",\"publisher\":\"Microsoft Corporation\",\"install_date\":null},{\"name\":\"Microsoft Visual C++ 2013 Redistributable (x86) - 12.0.30501\",\"version\":\"12.0.30501.0\",\"publisher\":\"Microsoft Corporation\",\"install_date\":null},{\"name\":\"Microsoft Visual C++ 2013 Redistributable (x86) - 12.0.40664\",\"version\":\"12.0.40664.0\",\"publisher\":\"Microsoft Corporation\",\"install_date\":null},{\"name\":\"Microsoft Visual C++ 2015-2022 Redistributable (x64) - 14.51.36231\",\"version\":\"14.51.36231.0\",\"publisher\":\"Microsoft Corporation\",\"install_date\":null},{\"name\":\"Microsoft Visual C++ 2015-2022 Redistributable (x86) - 14.51.36231\",\"version\":\"14.51.36231.0\",\"publisher\":\"Microsoft Corporation\",\"install_date\":null},{\"name\":\"Nitro Pro\",\"version\":\"13.70.0.30\",\"publisher\":\"Nitro\",\"install_date\":\"2025-07-09\"},{\"name\":\"Node.js\",\"version\":\"24.19.0\",\"publisher\":\"Node.js Foundation\",\"install_date\":\"2026-08-13\"},{\"name\":\"NVIDIA FrameView SDK 1.2.7704.31296923\",\"version\":\"1.2.7704.31296923\",\"publisher\":\"NVIDIA Corporation\",\"install_date\":\"2026-03-13\"},{\"name\":\"NVIDIA GeForce Experience 3.24.0.135\",\"version\":\"3.24.0.135\",\"publisher\":\"NVIDIA Corporation\",\"install_date\":\"2026-03-13\"},{\"name\":\"NVIDIA Graphics Driver 475.14\",\"version\":\"475.14\",\"publisher\":\"NVIDIA Corporation\",\"install_date\":\"2026-03-13\"},{\"name\":\"NVIDIA HD Audio Driver 1.3.38.60\",\"version\":\"1.3.38.60\",\"publisher\":\"NVIDIA Corporation\",\"install_date\":\"2026-03-13\"},{\"name\":\"NVIDIA PhysX System Software 9.19.0218\",\"version\":\"9.19.0218\",\"publisher\":\"NVIDIA Corporation\",\"install_date\":\"2026-03-13\"},{\"name\":\"RAV Network Protection\",\"version\":\"7.7.7\",\"publisher\":\"Reason Cybersecurity Inc.\",\"install_date\":null},{\"name\":\"Realtek High Definition Audio Driver\",\"version\":\"6.0.1.8117\",\"publisher\":\"Realtek Semiconductor Corp.\",\"install_date\":null},{\"name\":\"SMADAV version 15.6.0\",\"version\":\"15.6.0\",\"publisher\":\"Smadsoft\",\"install_date\":\"2026-02-09\"},{\"name\":\"TeraBox\",\"version\":\"1.45.0\",\"publisher\":\"Flextech Inc.\",\"install_date\":null},{\"name\":\"Update for Windows 10 for x64-based Systems (KB5001716)\",\"version\":\"8.94.0.0\",\"publisher\":\"Microsoft Corporation\",\"install_date\":\"2025-01-23\"},{\"name\":\"vMix\",\"version\":null,\"publisher\":\"StudioCoast\",\"install_date\":\"2026-08-20\"},{\"name\":\"vMix Social\",\"version\":null,\"publisher\":\"StudioCoast Pty Ltd\",\"install_date\":\"2026-08-20\"},{\"name\":\"vMix Video Codec version 4.15\",\"version\":\"4.15\",\"publisher\":\"StudioCoast Pty Ltd\",\"install_date\":\"2026-08-20\"},{\"name\":\"WebAdvisor by McAfee\",\"version\":\"4.1.2.111\",\"publisher\":\"McAfee, LLC\",\"install_date\":null},{\"name\":\"Windows Driver Package - Silicon Laboratories Inc. (silabser) Ports  (05/23/2018 6.7.6.2130)\",\"version\":\"05/23/2018 6.7.6.2130\",\"publisher\":\"Silicon Laboratories Inc.\",\"install_date\":null},{\"name\":\"WinRAR 6.23 (64-bit)\",\"version\":\"6.23.0\",\"publisher\":\"win.rar GmbH\",\"install_date\":null},{\"name\":\"XAMPP\",\"version\":\"8.0.30-0\",\"publisher\":\"Apache Friends\",\"install_date\":\"2026-08-03\"},{\"name\":\"YTD Video Downloader 5.7.1\",\"version\":\"5.7.1\",\"publisher\":\"GreenTree Applications SRL\",\"install_date\":null}]','[{\"title\":\"Update for Windows Security platform - KB5007651 (Version 10.0.29628.1000)\",\"kb\":\"KB5007651\",\"severity\":null},{\"title\":\"Windows Malicious Software Removal Tool x64 - v5.144 (KB890830)\",\"kb\":\"KB890830\",\"severity\":null},{\"title\":\"Security Intelligence Update for Microsoft Defender Antivirus - KB2267602 (Version 1.459.86.0) - Current Channel (Broad)\",\"kb\":\"KB2267602\",\"severity\":null},{\"title\":\"2026-08 .NET Framework Security Update (KB5120710)\",\"kb\":\"KB5120710\",\"severity\":null},{\"title\":\"Windows 11, version 24H2\",\"kb\":\"KB5121003\",\"severity\":null}]','[{\"name\":\"Realtek USB CD-ROM USB Device\",\"serial\":\"000001&0\",\"last_seen_utc\":\"2026-02-04T07:18:40Z\"},{\"name\":\"ADATA USB Flash Drive USB Device\",\"serial\":\"21B09044401400FA&0\",\"last_seen_utc\":\"2026-01-15T02:11:59Z\"},{\"name\":\"General UDisk USB Device\",\"serial\":\"6&1d881e48&0&_&0\",\"last_seen_utc\":\"2026-02-13T03:39:20Z\"},{\"name\":\"Generic Flash Disk USB Device\",\"serial\":\"52FFCF6D&0\",\"last_seen_utc\":\"2025-10-29T07:18:26Z\"},{\"name\":\"Generic Flash Disk USB Device\",\"serial\":\"C34312FC&0\",\"last_seen_utc\":\"2026-03-02T00:11:17Z\"},{\"name\":\"JetFlash Transcend 32GB USB Device\",\"serial\":\"18CA31B0&0\",\"last_seen_utc\":\"2026-07-22T07:44:17Z\"},{\"name\":\"JMicron USB Device\",\"serial\":\"RANDOM__A8F2718A252D&0\",\"last_seen_utc\":\"2026-01-15T04:22:20Z\"},{\"name\":\"Kingston DataTraveler 2.0 USB Device\",\"serial\":\"60A44C425490FF71E81C6671&0\",\"last_seen_utc\":\"2026-02-18T03:09:09Z\"},{\"name\":\"Kingston DataTraveler 3.0 USB Device\",\"serial\":\"20CF30E11746F3B1D63AD4E0&0\",\"last_seen_utc\":\"2026-09-03T00:49:55Z\"},{\"name\":\"Kingston DataTraveler 3.0 USB Device\",\"serial\":\"E0D55E62907817105886068F&0\",\"last_seen_utc\":\"2026-07-10T05:48:34Z\"},{\"name\":\"Kingston DataTraveler 3.0 USB Device\",\"serial\":\"E0D55E6CBC96171058920C3B&0\",\"last_seen_utc\":\"2026-07-14T07:51:45Z\"},{\"name\":\"Kingston DataTraveler 3.0 USB Device\",\"serial\":\"E0D55EA574921661492E14E7&0\",\"last_seen_utc\":\"2025-11-11T00:58:38Z\"},{\"name\":\"Lexar USB Flash Drive USB Device\",\"serial\":\"AAQE357PXCKL51WT&0\",\"last_seen_utc\":\"2026-03-02T00:09:28Z\"},{\"name\":\"SDXC Card\",\"serial\":\"0000\",\"last_seen_utc\":\"2025-11-05T03:32:08Z\"},{\"name\":\"Realtek RTL9210 NVME USB Device\",\"serial\":\"012345678905&0\",\"last_seen_utc\":\"2026-06-17T01:24:40Z\"},{\"name\":\"SanDisk SanDisk 3.2 Gen1 USB Device\",\"serial\":\"A2003296770E0D34&0\",\"last_seen_utc\":\"2026-02-10T05:52:22Z\"},{\"name\":\"SanDisk Ultra USB Device\",\"serial\":\"4C530001011116103135&0\",\"last_seen_utc\":\"2025-10-29T07:11:40Z\"},{\"name\":\"SanDisk Ultra USB Device\",\"serial\":\"4C530001241206117573&0\",\"last_seen_utc\":\"2025-11-12T02:27:13Z\"},{\"name\":\"SanDisk Ultra USB Device\",\"serial\":\"4C531001481210121390&0\",\"last_seen_utc\":\"2026-06-17T01:43:03Z\"},{\"name\":\"SanDisk Ultra USB 3.0 USB Device\",\"serial\":\"4C530001201017115053&0\",\"last_seen_utc\":\"2025-12-10T04:09:18Z\"},{\"name\":\"StoreJet Transcend USB Device\",\"serial\":\"00000000000000000000&0\",\"last_seen_utc\":\"2026-02-05T02:32:13Z\"},{\"name\":\"StoreJet Transcend USB Device\",\"serial\":\"_____WD-WXH1AC6KYTVK&0\",\"last_seen_utc\":\"2026-01-15T05:50:52Z\"},{\"name\":\"TOSHIBA External USB 3.0 USB Device\",\"serial\":\"20131024000279C&0\",\"last_seen_utc\":\"2026-01-08T05:06:20Z\"},{\"name\":\"Ugreen SDMSGL3224 USB Device\",\"serial\":\"000000000032&0\",\"last_seen_utc\":\"2026-07-30T07:33:26Z\"},{\"name\":\"Ugreen TFM2GL3224 USB Device\",\"serial\":\"000000000032&1\",\"last_seen_utc\":\"2026-07-30T07:33:26Z\"},{\"name\":\"USB2.0 Flash Disk USB Device\",\"serial\":\"1980022307430437&0\",\"last_seen_utc\":\"2025-11-05T07:10:17Z\"},{\"name\":\"VendorCo ProductCode USB Device\",\"serial\":\"5445821080101709841&0\",\"last_seen_utc\":\"2025-12-02T03:11:36Z\"},{\"name\":\"VendorCo ProductCode USB Device\",\"serial\":\"8364241115815666129&0\",\"last_seen_utc\":\"2026-03-17T06:04:28Z\"},{\"name\":\" USB  SanDisk 3.2Gen1 USB Device\",\"serial\":\"0401f35eec201eebb2d9e92bd7acf87d78c27d824073894a44640f2df5891be\",\"last_seen_utc\":\"2026-02-09T02:58:17Z\"}]','[{\"description\":\"Realtek PCIe GBE Family Controller #2\",\"mac_address\":\"F4:4D:30:FD:C9:3C\",\"ip_address\":\"192.168.1.187\",\"dhcp_enabled\":true,\"gateway\":\"192.168.1.1\"}]','[{\"name\":\"OneNote (Desktop)\",\"driver_name\":\"Send to Microsoft OneNote 16 Driver\",\"port_name\":\"nul:\"},{\"name\":\"Nitro PDF Creator\",\"driver_name\":\"Nitro PDF Driver 13\",\"port_name\":\"Nitro PDF 13 Port:\"},{\"name\":\"Microsoft XPS Document Writer\",\"driver_name\":\"Microsoft XPS Document Writer v4\",\"port_name\":\"PORTPROMPT:\"},{\"name\":\"Microsoft Print to PDF\",\"driver_name\":\"Microsoft Print To PDF\",\"port_name\":\"PORTPROMPT:\"},{\"name\":\"Fax\",\"driver_name\":\"Microsoft Shared Fax Driver\",\"port_name\":\"SHRFAX:\"}]','[{\"id\":\"KB5101001\",\"description\":\"Update\",\"installed_on\":\"2026-08-07\"},{\"id\":\"KB5095093\",\"description\":\"Update\",\"installed_on\":\"2026-06-25\"},{\"id\":\"KB5095182\",\"description\":\"Update\",\"installed_on\":\"2026-06-24\"}]','2026-09-07 08:11:51');
DROP TABLE IF EXISTS `device_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `device_types` (
  `id` int(11) NOT NULL,
  `type` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `device_types` VALUES (1,'Desktop'),(2,'Laptop'),(3,'Printer'),(4,'Switch'),(5,'Router'),(6,'Firewall');
DROP TABLE IF EXISTS `devices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `devices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `personnel_id` int(11) DEFAULT NULL,
  `device_id` int(11) DEFAULT NULL,
  `device_code` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `device_code` (`device_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `divisions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `divisions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `division` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `divisions` VALUES (1,'ITSD'),(2,'SMD'),(3,'ISSD'),(4,'ITPMD'),(5,'PTD'),(6,'DMD'),(7,'ARMD'),(8,'PTDLAB'),(9,'CI'),(10,'PCR'),(11,'LS'),(12,'IHSS'),(13,'BFS'),(14,'SAO'),(15,'SF'),(16,'PCC-SF'),(17,'TECHSUPP'),(18,'PSMU');
DROP TABLE IF EXISTS `endpoint_security`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `endpoint_security` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `antivirus` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `endpoint_security` VALUES (1,'Trendmicro'),(2,'Sophos'),(3,'Cybereason'),(4,'Bitdefender'),(5,'UTMStack'),(6,'Qualys'),(7,'Avast'),(8,'Windows Defender'),(9,'eScan'),(10,'Cynet'),(11,'Others');
DROP TABLE IF EXISTS `firewalls`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `firewalls` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `personnel_id` int(11) NOT NULL,
  `division_id` int(11) NOT NULL,
  `device_id` int(11) NOT NULL,
  `manufacturer` varchar(255) DEFAULT NULL,
  `model` varchar(255) DEFAULT NULL,
  `serial_no` varchar(255) DEFAULT NULL,
  `no_of_ports` int(11) DEFAULT NULL,
  `no_of_active_ports` int(11) DEFAULT NULL,
  `firmware_version` varchar(255) DEFAULT NULL,
  `management_interface_type` varchar(255) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `is_remotely_accessible` tinyint(1) DEFAULT NULL,
  `remote_connection_details` text DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `pnp_focal_person` varchar(255) DEFAULT NULL,
  `contact_details` int(11) DEFAULT NULL,
  `acquisition_date` date DEFAULT NULL,
  `acquisition_type` varchar(255) DEFAULT NULL,
  `acquisition_details` text DEFAULT NULL,
  `previous_owners_id` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`previous_owners_id`)),
  `created_date` date NOT NULL DEFAULT current_timestamp(),
  `last_updated_at` date DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `firewalls` VALUES (1,16,6,0,'Fortinet','FW-3000','SN-FW-6000',8,6,'v6.4.2','Web GUI','Server Room',1,1,'SSH via VPN',NULL,'Network Admin',2147483647,'2026-06-26','Purchase','Purchased via public bidding',NULL,'2026-04-01',NULL),(2,17,7,0,'Sophos','FW-3001','SN-FW-6001',8,6,'v6.4.2','Web GUI','Server Room',1,1,'SSH via VPN',NULL,'Network Admin',2147483647,'2026-03-17','Purchase','Purchased via public bidding',NULL,'2026-01-19',NULL),(3,18,8,0,'pfSense','FW-3002','SN-FW-6002',8,6,'v6.4.2','Web GUI','Server Room',1,1,'SSH via VPN',NULL,'Network Admin',2147483647,'2026-03-09','Purchase','Purchased via public bidding',NULL,'2026-04-10',NULL);
DROP TABLE IF EXISTS `headsets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `headsets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `device_code` varchar(255) NOT NULL,
  `personnel_id` int(11) NOT NULL,
  `device_id` int(11) NOT NULL,
  `division_id` int(11) NOT NULL,
  `acquisition_date` date DEFAULT NULL,
  `acquisition_details` text DEFAULT NULL,
  `brand` varchar(255) DEFAULT NULL,
  `model` varchar(255) DEFAULT NULL,
  `serial_no` varchar(255) DEFAULT NULL,
  `previous_owners_id` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`previous_owners_id`)),
  `created_date` timestamp NULL DEFAULT current_timestamp(),
  `last_update_at` date DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `headsets` VALUES (1,'HS-5000',10,0,8,'2026-01-31','For video conferencing','Logitech','H-100','SN-HS-8000',NULL,'2026-08-16 16:00:00',NULL,1),(2,'HS-5001',11,0,9,'2026-05-23','For video conferencing','Jabra','H-101','SN-HS-8001',NULL,'2026-06-07 16:00:00',NULL,1),(3,'HS-5002',12,0,10,'2026-03-29','For video conferencing','Logitech','H-102','SN-HS-8002',NULL,'2026-02-28 16:00:00',NULL,1),(4,'HS-5003',13,0,11,'2026-01-11','For video conferencing','Jabra','H-103','SN-HS-8003',NULL,'2026-05-27 16:00:00',NULL,1),(5,'HS-5004',14,0,12,'2026-01-04','For video conferencing','Logitech','H-104','SN-HS-8004',NULL,'2026-03-02 16:00:00',NULL,1);
DROP TABLE IF EXISTS `laptops`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `laptops` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `personnel_id` int(11) DEFAULT NULL,
  `device_id` int(11) NOT NULL,
  `device_name` varchar(150) NOT NULL,
  `division_id` int(11) DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `os` varchar(100) DEFAULT NULL,
  `is_os_licensed` tinyint(1) DEFAULT NULL,
  `os_license_key` varchar(255) DEFAULT NULL,
  `is_remote_acc` tinyint(1) DEFAULT NULL,
  `endpoint_security_id` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `no_of_installed_anti_virus` int(11) DEFAULT NULL,
  `date_installed` date DEFAULT NULL,
  `guid` varchar(100) DEFAULT NULL,
  `mac_address` varchar(100) DEFAULT NULL,
  `cpu_brand` varchar(100) DEFAULT NULL,
  `cpu_generation` int(11) DEFAULT NULL,
  `cpu_cores` int(11) DEFAULT NULL,
  `gb_ram` int(11) DEFAULT NULL,
  `monitor_brand` varchar(100) DEFAULT NULL,
  `monitor_size_inches` int(11) DEFAULT NULL,
  `no_of_user_accounts` int(11) DEFAULT NULL,
  `user_account_type` longtext DEFAULT NULL,
  `authorized_software` text DEFAULT NULL,
  `unauthorized_software` text DEFAULT NULL,
  `office_application` varchar(150) DEFAULT NULL,
  `is_office_licensed` tinyint(1) DEFAULT NULL,
  `office_license_key` varchar(255) DEFAULT NULL,
  `previous_owners_id` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`previous_owners_id`)),
  `created_date` date DEFAULT current_timestamp(),
  `last_updated_at` date DEFAULT NULL,
  `par_serial_no` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `acquisition_date` date DEFAULT NULL,
  `installed_software` longtext DEFAULT NULL,
  `missing_updates` longtext DEFAULT NULL,
  `usb_history` longtext DEFAULT NULL,
  `network_adapters` longtext DEFAULT NULL,
  `printers_detected` longtext DEFAULT NULL,
  `hotfixes` longtext DEFAULT NULL,
  `last_agent_report_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `laptops` VALUES (1,6,0,'ITMS-LT-0200',3,NULL,NULL,1,NULL,1,NULL,NULL,NULL,NULL,NULL,NULL,11,NULL,NULL,NULL,NULL,1,NULL,NULL,NULL,'Microsoft 365 Apps for Business',1,NULL,NULL,'2026-02-12',NULL,'PAR-2000',1,'2026-05-07',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(2,7,0,'ITMS-LT-0201',4,NULL,'Windows 11 Home Single Language',1,NULL,1,NULL,2,NULL,NULL,NULL,'Intel',11,4,16,NULL,NULL,2,NULL,NULL,NULL,'Microsoft 365 Apps for Business',1,NULL,NULL,'2026-07-02',NULL,'PAR-2001',1,'2026-06-28',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(3,8,0,'ITMS-LT-0202',5,NULL,'Windows 11 Pro',1,NULL,1,NULL,3,NULL,NULL,NULL,'AMD',11,4,8,NULL,NULL,1,NULL,NULL,NULL,'Microsoft 365 Apps for Business',1,NULL,NULL,'2026-03-06',NULL,'PAR-2002',1,'2026-04-27',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(4,9,0,'ITMS-LT-0203',6,NULL,'Windows 10 Pro',1,NULL,1,NULL,1,NULL,NULL,NULL,'Intel',11,4,16,NULL,NULL,2,NULL,NULL,NULL,'Microsoft 365 Apps for Business',1,NULL,NULL,'2025-12-01',NULL,'PAR-2003',1,'2026-07-13',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(5,10,0,'ITMS-LT-0204',7,NULL,'Windows 11 Home Single Language',1,NULL,1,NULL,2,NULL,NULL,NULL,'AMD',11,4,8,NULL,NULL,1,NULL,NULL,NULL,'Microsoft 365 Apps for Business',1,NULL,NULL,'2026-05-29',NULL,'PAR-2004',1,'2025-12-06',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(6,11,0,'ITMS-LT-0205',8,NULL,'Windows 11 Pro',1,NULL,1,NULL,3,NULL,NULL,NULL,'Intel',11,4,16,NULL,NULL,2,NULL,NULL,NULL,'Microsoft 365 Apps for Business',1,NULL,NULL,'2026-01-30',NULL,'PAR-2005',1,'2026-02-08',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(7,12,0,'ITMS-LT-0206',9,NULL,'Windows 10 Pro',1,NULL,1,NULL,1,NULL,NULL,NULL,'AMD',11,4,8,NULL,NULL,1,NULL,NULL,NULL,'Microsoft 365 Apps for Business',1,NULL,NULL,'2026-07-07',NULL,'PAR-2006',1,'2026-04-12',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(8,13,0,'ITMS-LT-0207',10,NULL,'Windows 11 Home Single Language',1,NULL,1,NULL,2,NULL,NULL,NULL,'Intel',11,4,16,NULL,NULL,2,NULL,NULL,NULL,'Microsoft 365 Apps for Business',1,NULL,NULL,'2026-06-07',NULL,'PAR-2007',1,'2025-11-17',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(9,14,0,'ITMS-LT-0208',11,NULL,'Windows 11 Pro',1,NULL,1,NULL,3,NULL,NULL,NULL,'AMD',11,4,8,NULL,NULL,1,NULL,NULL,NULL,'Microsoft 365 Apps for Business',1,NULL,NULL,'2025-12-08',NULL,'PAR-2008',1,'2026-06-15',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(10,15,0,'ITMS-LT-0209',12,NULL,'Windows 10 Pro',1,NULL,1,NULL,1,NULL,NULL,NULL,'Intel',11,4,16,NULL,NULL,2,NULL,NULL,NULL,'Microsoft 365 Apps for Business',1,NULL,NULL,'2026-03-26',NULL,'PAR-2009',1,'2026-04-26',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(16,NULL,0,'ACELAZO',NULL,'192.168.1.32','Microsoft Windows 10 Home Single Language 10.0.19045 (64-bit)',NULL,NULL,NULL,NULL,1,NULL,NULL,'74:3A:F4:9C:1A:44','12th Gen Intel(R) Core(TM) i5-12450H',NULL,8,8,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-06','2026-09-06','27GBB23C01801635',1,NULL,'[{\"name\":\"3uTools\",\"version\":\"9.08.006\",\"publisher\":\"Shenzhen Aidapu Network Technology Co.,Ltd.\",\"install_date\":null},{\"name\":\"Anki Launcher\",\"version\":\"25.09\",\"publisher\":null,\"install_date\":null},{\"name\":\"Apple Mobile Device Support\",\"version\":\"19.4.0.10\",\"publisher\":\"Apple Inc.\",\"install_date\":\"2026-08-28\"},{\"name\":\"Arduino IDE 2.3.10\",\"version\":\"2.3.10\",\"publisher\":\"Arduino SA\",\"install_date\":null},{\"name\":\"Belarc Advisor 13.1\",\"version\":\"13.1.0.0\",\"publisher\":\"Belarc, Inc.\",\"install_date\":null},{\"name\":\"Brave\",\"version\":\"152.1.94.121\",\"publisher\":\"Brave Software Inc\",\"install_date\":\"2026-09-05\"},{\"name\":\"Cisco Packet Tracer 9.0.0 64Bit\",\"version\":\"9.0.0.810\",\"publisher\":\"Cisco Systems, Inc.\",\"install_date\":\"2026-06-08\"},{\"name\":\"Copilot\",\"version\":\"152.0.4191.66\",\"publisher\":\"Microsoft Corporation\",\"install_date\":\"2026-09-06\"},{\"name\":\"Discord\",\"version\":\"1.0.9256\",\"publisher\":\"Discord Inc.\",\"install_date\":null},{\"name\":\"EPSON L120 Series Printer Uninstall\",\"version\":null,\"publisher\":\"SEIKO EPSON Corporation\",\"install_date\":null},{\"name\":\"Git\",\"version\":\"2.54.0\",\"publisher\":\"The Git Development Community\",\"install_date\":\"2026-06-07\"},{\"name\":\"Google Chrome\",\"version\":\"152.0.7977.76\",\"publisher\":\"Google LLC\",\"install_date\":\"2026-09-04\"},{\"name\":\"Google Cloud SDK\",\"version\":null,\"publisher\":\"Google LLC\",\"install_date\":null},{\"name\":\"Huawei PC Manager(Multi-screen Collaboration and Official Driver)\",\"version\":\"14.0.7.260\",\"publisher\":\"Huawei Device Co., Ltd.\",\"install_date\":null},{\"name\":\"HW OSD\",\"version\":\"14.0.5.300\",\"publisher\":\"Huawei Device Co., Ltd.\",\"install_date\":null},{\"name\":\"iDevice Panic Log Analyzer\",\"version\":\"1.7.4\",\"publisher\":\"Wayne Bonnici\",\"install_date\":\"2026-08-28\"},{\"name\":\"Microsoft 365 Apps for enterprise - en-us\",\"version\":\"16.0.20326.20132\",\"publisher\":\"Microsoft Corporation\",\"install_date\":null},{\"name\":\"Microsoft Azure CLI (64-bit)\",\"version\":\"2.89.1\",\"publisher\":\"Microsoft Corporation\",\"install_date\":\"2026-08-24\"},{\"name\":\"Microsoft Edge\",\"version\":\"152.0.4191.66\",\"publisher\":\"Microsoft Corporation\",\"install_date\":\"2026-09-06\"},{\"name\":\"Microsoft OneDrive\",\"version\":\"26.150.0804.0011\",\"publisher\":\"Microsoft Corporation\",\"install_date\":null},{\"name\":\"Microsoft Teams Meeting Add-in for Microsoft Office\",\"version\":\"1.26.20101\",\"publisher\":\"Microsoft\",\"install_date\":\"2026-08-23\"},{\"name\":\"Microsoft Update Health Tools\",\"version\":\"3.74.0.0\",\"publisher\":\"Microsoft Corporation\",\"install_date\":\"2026-06-03\"},{\"name\":\"Microsoft Visual C++ v14 Redistributable (x64) - 14.50.35719\",\"version\":\"14.50.35719.0\",\"publisher\":\"Microsoft Corporation\",\"install_date\":null},{\"name\":\"Microsoft Visual C++ v14 Redistributable (x86) - 14.50.35719\",\"version\":\"14.50.35719.0\",\"publisher\":\"Microsoft Corporation\",\"install_date\":null},{\"name\":\"Microsoft Visual Studio Code (User)\",\"version\":\"1.136.1\",\"publisher\":\"Microsoft Corporation\",\"install_date\":\"2026-09-04\"},{\"name\":\"Node.js\",\"version\":\"24.16.0\",\"publisher\":\"Node.js Foundation\",\"install_date\":\"2026-06-07\"},{\"name\":\"OBS Studio\",\"version\":\"32.1.2\",\"publisher\":\"OBS Project\",\"install_date\":null},{\"name\":\"osquery\",\"version\":\"5.23.1\",\"publisher\":\"osquery\",\"install_date\":\"2026-07-10\"},{\"name\":\"Postman x64 12.21.8\",\"version\":\"12.21.8\",\"publisher\":\"Postman\",\"install_date\":\"2026-07-31\"},{\"name\":\"PowerToys (Preview) x64\",\"version\":\"0.100.2\",\"publisher\":\"Microsoft Corporation\",\"install_date\":\"2026-07-29\"},{\"name\":\"Python 3.14.6\",\"version\":\"3.14-64\",\"publisher\":\"Python Software Foundation\",\"install_date\":\"2026-07-13\"},{\"name\":\"Rave 1.18.22\",\"version\":\"1.18.22\",\"publisher\":\"Rave Inc.\",\"install_date\":null},{\"name\":\"Roblox Player for acelazo\\u0000 \",\"version\":null,\"publisher\":\"Roblox Corporation\",\"install_date\":null},{\"name\":\"Telegram Desktop\",\"version\":\"7.1.2\",\"publisher\":\"Telegram FZ-LLC\",\"install_date\":\"2026-08-27\"},{\"name\":\"Update for x64-based Windows Systems (KB5001716)\",\"version\":\"8.94.0.0\",\"publisher\":\"Microsoft Corporation\",\"install_date\":\"2026-06-04\"},{\"name\":\"Viber\",\"version\":\"28.7.0.0\",\"publisher\":\"2010-2026 Viber Media S.a.r.l\",\"install_date\":\"2026-08-11\"},{\"name\":\"VMware Workstation\",\"version\":\"26.0.0\",\"publisher\":\"VMware, Inc.\",\"install_date\":\"2026-06-03\"},{\"name\":\"WDT_Device_Driver\",\"version\":null,\"publisher\":null,\"install_date\":null},{\"name\":\"WinRAR 7.23 (64-bit)\",\"version\":\"7.23.0\",\"publisher\":\"win.rar GmbH\",\"install_date\":null},{\"name\":\"WinSCP 6.5.6\",\"version\":\"6.5.6\",\"publisher\":\"Martin Prikryl\",\"install_date\":\"2026-06-04\"},{\"name\":\"XAMPP\",\"version\":\"8.0.30-0\",\"publisher\":\"Apache Friends\",\"install_date\":\"2026-07-22\"}]',NULL,'[{\"name\":\"General UDisk USB Device\",\"serial\":\"2410091011575277856213&0\",\"last_seen_utc\":\"2026-08-24T00:18:02Z\"},{\"name\":\"General UDisk USB Device\",\"serial\":\"6&21158d69&0&_&0\",\"last_seen_utc\":\"2026-09-06T04:19:05Z\"},{\"name\":\"Generic USB Flash Disk USB Device\",\"serial\":\"6&177e8a76&0\",\"last_seen_utc\":\"2026-06-02T23:12:23Z\"},{\"name\":\"Kingston DataTraveler 3.0 USB Device\",\"serial\":\"20CF30E11746F3B1D63AD4E0&0\",\"last_seen_utc\":\"2026-09-06T23:42:16Z\"}]','[{\"description\":\"Intel(R) Wi-Fi 6 AX201 160MHz\",\"mac_address\":\"74:3A:F4:9C:1A:44\",\"ip_address\":\"192.168.1.32\",\"dhcp_enabled\":true,\"gateway\":\"192.168.1.1\"},{\"description\":\"VMware Virtual Ethernet Adapter for VMnet1\",\"mac_address\":\"00:50:56:C0:00:01\",\"ip_address\":\"169.254.2.28\",\"dhcp_enabled\":true,\"gateway\":null},{\"description\":\"VMware Virtual Ethernet Adapter for VMnet8\",\"mac_address\":\"00:50:56:C0:00:08\",\"ip_address\":\"169.254.29.123\",\"dhcp_enabled\":true,\"gateway\":null}]','[{\"name\":\"OneNote (Desktop)\",\"driver_name\":\"Send to Microsoft OneNote 16 Driver\",\"port_name\":\"nul:\"},{\"name\":\"OneNote for Windows 10\",\"driver_name\":\"Microsoft Software Printer Driver\",\"port_name\":\"Microsoft.Office.OneNote_16001.14326.22594.0_x64__8wekyb3d8bbwe_microsoft.onenoteim_S-1-5-21-1373294663-1518574233-1064641401-1000\"},{\"name\":\"Microsoft XPS Document Writer\",\"driver_name\":\"Microsoft XPS Document Writer v4\",\"port_name\":\"PORTPROMPT:\"},{\"name\":\"Microsoft Print to PDF\",\"driver_name\":\"Microsoft Print To PDF\",\"port_name\":\"PORTPROMPT:\"},{\"name\":\"Fax\",\"driver_name\":\"Microsoft Shared Fax Driver\",\"port_name\":\"SHRFAX:\"},{\"name\":\"EPSON L3110 Series\",\"driver_name\":\"Epson ESC/P-R V4 Class Driver\",\"port_name\":\"USB003\"},{\"name\":\"EPSON L120 Series\",\"driver_name\":\"EPSON L120 Series\",\"port_name\":\"USB001\"}]','[{\"id\":\"KB5066130\",\"description\":\"Update\",\"installed_on\":\"2026-06-03\"},{\"id\":\"KB5066135\",\"description\":\"Update\",\"installed_on\":\"2025-10-11\"},{\"id\":\"KB5011048\",\"description\":\"Update\",\"installed_on\":\"2026-06-03\"},{\"id\":\"KB5015684\",\"description\":\"Update\",\"installed_on\":\"2025-10-11\"},{\"id\":\"KB5072653\",\"description\":\"Security Update\",\"installed_on\":\"2026-06-03\"},{\"id\":\"KB5066791\",\"description\":\"Security Update\",\"installed_on\":\"2025-10-11\"},{\"id\":\"KB5014032\",\"description\":\"Security Update\",\"installed_on\":\"2025-10-11\"},{\"id\":\"KB5028380\",\"description\":\"Update\",\"installed_on\":\"2025-10-11\"},{\"id\":\"KB5066790\",\"description\":\"Security Update\",\"installed_on\":\"2025-10-11\"},{\"id\":\"KB5071982\",\"description\":\"Security Update\",\"installed_on\":\"2026-06-03\"},{\"id\":\"KB5075039\",\"description\":\"Security Update\",\"installed_on\":\"2026-07-03\"}]','2026-09-07 07:55:43');
DROP TABLE IF EXISTS `others`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `others` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `personnel_id` int(11) NOT NULL,
  `division_id` int(11) NOT NULL,
  `brand` varchar(255) DEFAULT NULL,
  `model` varchar(255) DEFAULT NULL,
  `serial_no` varchar(255) DEFAULT NULL,
  `acquisition_details` text DEFAULT NULL,
  `acquisition_date` date DEFAULT NULL,
  `previous_owners_id` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`previous_owners_id`)),
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_date` date NOT NULL DEFAULT current_timestamp(),
  `last_update_at` date DEFAULT NULL,
  `device_name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `others` VALUES (1,29,12,'Generic','MISC-100','SN-OT-12000','Miscellaneous office equipment','2026-04-17',NULL,1,'2026-02-13',NULL,'Label Printer 1'),(2,30,13,'Local Brand','MISC-101','SN-OT-12001','Miscellaneous office equipment','2026-07-19',NULL,1,'2026-01-18',NULL,'Label Printer 2'),(3,31,14,'Generic','MISC-102','SN-OT-12002','Miscellaneous office equipment','2025-12-10',NULL,1,'2026-03-25',NULL,'Label Printer 3');
DROP TABLE IF EXISTS `personnels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `personnels` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `division_id` int(11) NOT NULL,
  `rank_id` int(11) NOT NULL,
  `first_name` varchar(255) NOT NULL,
  `middle_name` varchar(255) DEFAULT NULL,
  `last_name` varchar(255) NOT NULL,
  `created_by` int(11) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `personnels` VALUES (1,1,1,'Juan',NULL,'Santos',1,1),(2,2,4,'Maria',NULL,'Torres',1,1),(3,3,7,'Jose',NULL,'Gonzales',1,1),(4,4,10,'Ana',NULL,'Marquez',1,1),(5,5,13,'Pedro',NULL,'Valdez',1,1),(6,6,2,'Carmen',NULL,'Garcia',1,1),(7,7,5,'Antonio',NULL,'Aquino',1,1),(8,8,8,'Rosa',NULL,'Navarro',1,1),(9,9,11,'Manuel',NULL,'Roque',1,1),(10,10,14,'Elena',NULL,'Bautista',1,1),(11,11,3,'Ricardo',NULL,'Villanueva',1,1),(12,12,6,'Teresa',NULL,'Salazar',1,1),(13,13,9,'Eduardo',NULL,'Bernardo',1,1),(14,14,12,'Luz',NULL,'Reyes',1,1),(15,15,1,'Fernando',NULL,'Flores',1,1),(16,16,4,'Corazon',NULL,'Fernandez',1,1),(17,17,7,'Roberto',NULL,'Rivera',1,1),(18,18,10,'Angelica',NULL,'Ignacio',1,1),(19,1,13,'Arnel',NULL,'Mendoza',1,1),(20,2,2,'Josefina',NULL,'Pascual',1,1),(21,3,5,'Carlo',NULL,'Domingo',1,1),(22,4,8,'Ma. Victoria',NULL,'Tolentino',1,1),(23,5,11,'Dennis',NULL,'Ocampo',1,1),(24,6,14,'Grace',NULL,'De Guzman',1,1),(25,7,3,'Michael',NULL,'Castillo',1,1),(26,8,6,'Jasmine',NULL,'Mercado',1,1),(27,9,9,'Ronald',NULL,'Cruz',1,1),(28,10,12,'Kristine',NULL,'Ramos',1,1),(29,11,1,'Alvin',NULL,'Del Rosario',1,1),(30,12,4,'Charmaine',NULL,'Aguilar',1,1),(31,13,7,'Bryan',NULL,'Santos',1,1),(32,14,10,'Aiza',NULL,'Torres',1,1),(33,15,13,'Christian',NULL,'Gonzales',1,1),(34,16,2,'Lorna',NULL,'Marquez',1,1),(35,17,5,'Noel',NULL,'Valdez',1,1),(36,18,8,'Divina',NULL,'Garcia',1,1),(37,1,11,'Randy',NULL,'Aquino',1,1),(38,2,14,'Precious',NULL,'Navarro',1,1),(39,3,3,'Gerald',NULL,'Roque',1,1),(40,4,6,'Marites',NULL,'Bautista',1,1);
DROP TABLE IF EXISTS `printers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `printers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `personnel_id` int(11) NOT NULL,
  `device_id` int(11) NOT NULL,
  `division_id` int(11) NOT NULL,
  `acquisition_date` date DEFAULT NULL,
  `acquisition_details` text DEFAULT NULL,
  `brand` varchar(255) DEFAULT NULL,
  `model` varchar(255) DEFAULT NULL,
  `previous_owners_id` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`previous_owners_id`)),
  `created_date` date NOT NULL DEFAULT current_timestamp(),
  `last_update_at` date DEFAULT NULL,
  `serial_no` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `printers` VALUES (1,3,0,2,'2026-05-13','Purchased via public bidding','Canon','G2010',NULL,'2025-12-09',NULL,'SN-PR-3000',1),(2,4,0,3,'2026-01-24','Purchased via public bidding','Epson','L3110',NULL,'2026-07-09',NULL,'SN-PR-3001',1),(3,5,0,4,'2026-03-07','Purchased via public bidding','HP','LaserJet Pro M15w',NULL,'2026-04-17',NULL,'SN-PR-3002',1),(4,6,0,5,'2026-06-30','Purchased via public bidding','Brother','HL-L2350DW',NULL,'2026-06-09',NULL,'SN-PR-3003',1),(5,7,0,6,'2026-06-16','Purchased via public bidding','Canon','G2010',NULL,'2026-02-21',NULL,'SN-PR-3004',1),(6,8,0,7,'2026-06-19','Purchased via public bidding','Epson','L3110',NULL,'2025-12-14',NULL,'SN-PR-3005',1),(7,9,0,8,'2026-02-23','Purchased via public bidding','HP','LaserJet Pro M15w',NULL,'2026-06-18',NULL,'SN-PR-3006',1),(8,10,0,9,'2026-05-13','Purchased via public bidding','Brother','HL-L2350DW',NULL,'2026-04-10',NULL,'SN-PR-3007',1);
DROP TABLE IF EXISTS `ranks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ranks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `rank` varchar(255) NOT NULL,
  `sort_order` int(11) DEFAULT 999,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `ranks` VALUES (1,'NUP',14),(2,'PAT',13),(3,'PCPL',12),(4,'PSSG',11),(5,'PMSG',10),(6,'PSMS',9),(7,'PCMS',8),(8,'PEMS',7),(9,'PLT',6),(10,'PCPT',5),(11,'PMAJ',4),(12,'PLTCOL',3),(13,'PCOL',2),(14,'PBGEN',1);
DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `role_name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `roles` VALUES (1,'superadmin'),(2,'admin'),(3,'encoder');
DROP TABLE IF EXISTS `routers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `routers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `personnel_id` int(11) NOT NULL,
  `device_id` int(11) NOT NULL,
  `manufacturer` varchar(255) DEFAULT NULL,
  `model` varchar(255) DEFAULT NULL,
  `serial_no` varchar(255) DEFAULT NULL,
  `no_of_ports` int(11) DEFAULT NULL,
  `no_of_active_ports` int(11) DEFAULT NULL,
  `active_port_ip_address_range` varchar(255) DEFAULT NULL,
  `firmware_version` varchar(255) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `is_remotely_accessible` tinyint(1) DEFAULT NULL,
  `remote_connection_details` text DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `pnp_focal_person` varchar(255) DEFAULT NULL,
  `contact_details` int(11) DEFAULT NULL,
  `acquisition_date` date DEFAULT NULL,
  `acquisition_type` varchar(255) DEFAULT NULL,
  `previous_owners_id` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`previous_owners_id`)),
  `created_date` date DEFAULT current_timestamp(),
  `last_update_at` date DEFAULT NULL,
  `division_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `routers` VALUES (1,9,0,'Cisco','Model-1000','SN-RT-4000',8,4,'192.168.1.0/24','v1.2.3','Server Room',1,1,'SSH via VPN',NULL,'Network Admin',2147483647,'2026-05-09','Purchase',NULL,'2025-12-27',NULL,4),(2,10,0,'TP-Link','Model-1001','SN-RT-4001',8,4,'192.168.1.0/24','v1.2.3','Server Room',1,1,'SSH via VPN',NULL,'Network Admin',2147483647,'2026-02-23','Purchase',NULL,'2026-04-11',NULL,5),(3,11,0,'MikroTik','Model-1002','SN-RT-4002',8,4,'192.168.1.0/24','v1.2.3','Server Room',1,1,'SSH via VPN',NULL,'Network Admin',2147483647,'2026-06-30','Purchase',NULL,'2026-07-21',NULL,6),(4,12,0,'Ubiquiti','Model-1003','SN-RT-4003',8,4,'192.168.1.0/24','v1.2.3','Server Room',1,1,'SSH via VPN',NULL,'Network Admin',2147483647,'2026-04-04','Purchase',NULL,'2026-06-02',NULL,7),(5,13,0,'Cisco','Model-1004','SN-RT-4004',8,4,'192.168.1.0/24','v1.2.3','Server Room',1,1,'SSH via VPN',NULL,'Network Admin',2147483647,'2026-08-06','Purchase',NULL,'2026-04-20',NULL,8),(6,14,0,'TP-Link','Model-1005','SN-RT-4005',8,4,'192.168.1.0/24','v1.2.3','Server Room',1,1,'SSH via VPN',NULL,'Network Admin',2147483647,'2026-04-06','Purchase',NULL,'2026-04-19',NULL,9);
DROP TABLE IF EXISTS `security_assessment_findings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `security_assessment_findings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `assessment_id` int(11) NOT NULL,
  `table_no` tinyint(4) DEFAULT NULL,
  `section` varchar(50) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `component` varchar(100) DEFAULT NULL,
  `property` varchar(150) DEFAULT NULL,
  `value` text DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL,
  `finding` text DEFAULT NULL,
  `specifications` text DEFAULT NULL,
  `functional_test` text DEFAULT NULL,
  `actual_result` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `assessment_id` (`assessment_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5095 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `security_assessment_findings` VALUES (4801,20,1,'SECURITY ASSESSMENT','ASSESSMENT','Foren','Version','5','INFO','FOREN assessment engine version detected.',NULL,NULL,NULL),(4802,20,1,'SECURITY ASSESSMENT','ASSESSMENT','Foren','Administrator',NULL,'WARN','FOREN is NOT running with administrator privileges.',NULL,NULL,NULL),(4803,20,1,'SECURITY ASSESSMENT','ASSESSMENT','Foren','Assessment Start','2026-09-02 20:01:53','INFO','Firmware, hardware and network security assessment started.',NULL,NULL,NULL),(4804,20,1,'SECURITY ASSESSMENT','SYSTEM','Computer','Detection','Unable to detect computer system','WARN',NULL,NULL,NULL,NULL),(4805,20,1,'SECURITY ASSESSMENT','CPU','Processor','Detection','Unable to detect CPU','WARN',NULL,NULL,NULL,NULL),(4806,20,1,'SECURITY ASSESSMENT','MOTHERBOARD','Baseboard','Manufacturer','Acer','INFO',NULL,NULL,NULL,NULL),(4807,20,1,'SECURITY ASSESSMENT','MOTHERBOARD','Baseboard','Product','Veriton M4690G','INFO',NULL,NULL,NULL,NULL),(4808,20,1,'SECURITY ASSESSMENT','MOTHERBOARD','Baseboard','Version','1.0','INFO',NULL,NULL,NULL,NULL),(4809,20,1,'SECURITY ASSESSMENT','MOTHERBOARD','Baseboard','Serial Number','DBVWR1100130183FA630E1','INFO',NULL,NULL,NULL,NULL),(4810,20,1,'SECURITY ASSESSMENT','SECURITY','Secure Boot','Status','DISABLED','WARN',NULL,NULL,NULL,NULL),(4811,20,1,'SECURITY ASSESSMENT','SECURITY','TPM','TPM Present','NO','FAIL',NULL,NULL,NULL,NULL),(4812,20,1,'SECURITY ASSESSMENT','SECURITY','TPM','TPM Ready','NO','WARN',NULL,NULL,NULL,NULL),(4813,20,1,'SECURITY ASSESSMENT','SECURITY','TPM','TPM Enabled','NO','WARN',NULL,NULL,NULL,NULL),(4814,20,1,'SECURITY ASSESSMENT','SECURITY','TPM','TPM Activated','NO','INFO',NULL,NULL,NULL,NULL),(4815,20,1,'SECURITY ASSESSMENT','SECURITY','TPM','Manufacturer',NULL,'INFO',NULL,NULL,NULL,NULL),(4816,20,1,'SECURITY ASSESSMENT','SECURITY','TPM','Manufacturer Version',NULL,'INFO',NULL,NULL,NULL,NULL),(4817,20,1,'SECURITY ASSESSMENT','SECURITY','TPM','Specification Version',NULL,'INFO',NULL,NULL,NULL,NULL),(4818,20,1,'SECURITY ASSESSMENT','RAM','Memory Module','Manufacturer','Kingston','INFO',NULL,NULL,NULL,NULL),(4819,20,1,'SECURITY ASSESSMENT','RAM','Memory Module','Part Number','ACR32D4U2S8MF-16','INFO',NULL,NULL,NULL,NULL),(4820,20,1,'SECURITY ASSESSMENT','RAM','Memory Module','Capacity','16.00 GB','INFO',NULL,NULL,NULL,NULL),(4821,20,1,'SECURITY ASSESSMENT','RAM','Memory Module','Speed','3200 MHz','INFO',NULL,NULL,NULL,NULL),(4822,20,1,'SECURITY ASSESSMENT','RAM','Memory Module','Serial Number','05E2D92A','INFO',NULL,NULL,NULL,NULL),(4823,20,1,'SECURITY ASSESSMENT','RAM','Memory Module','Slot','DIMM1','INFO',NULL,NULL,NULL,NULL),(4824,20,1,'SECURITY ASSESSMENT','GPU','Graphics Adapter','Name','NVIDIA GeForce GTX 1650','INFO',NULL,NULL,NULL,NULL),(4825,20,1,'SECURITY ASSESSMENT','GPU','Graphics Adapter','Driver Version','30.0.14.7280','INFO',NULL,NULL,NULL,NULL),(4826,20,1,'SECURITY ASSESSMENT','GPU','Graphics Adapter','VRAM','4.00 GB','INFO',NULL,NULL,NULL,NULL),(4827,20,1,'SECURITY ASSESSMENT','GPU','Graphics Adapter','Resolution','1920x1080','INFO',NULL,NULL,NULL,NULL),(4828,20,1,'SECURITY ASSESSMENT','GPU','Graphics Adapter','Status','OK','PASS',NULL,NULL,NULL,NULL),(4829,20,1,'SECURITY ASSESSMENT','STORAGE','Disk','Model','KINGSTON SNVS250G','INFO',NULL,NULL,NULL,NULL),(4830,20,1,'SECURITY ASSESSMENT','STORAGE','Disk','Interface','SCSI','INFO',NULL,NULL,NULL,NULL),(4831,20,1,'SECURITY ASSESSMENT','STORAGE','Disk','Media Type','Fixed hard disk media','INFO',NULL,NULL,NULL,NULL),(4832,20,1,'SECURITY ASSESSMENT','STORAGE','Disk','Capacity','232.88 GB','INFO',NULL,NULL,NULL,NULL),(4833,20,1,'SECURITY ASSESSMENT','STORAGE','Disk','Serial Number','0000_0000_0000_0000_0026_B768_5B00_69A5.','INFO',NULL,NULL,NULL,NULL),(4834,20,1,'SECURITY ASSESSMENT','STORAGE','Disk','Firmware Revision','S8J41100','INFO',NULL,NULL,NULL,NULL),(4835,20,1,'SECURITY ASSESSMENT','STORAGE','Disk','Health Status','OK','PASS',NULL,NULL,NULL,NULL),(4836,20,1,'SECURITY ASSESSMENT','STORAGE','Disk','Model','TOSHIBA DT01ACA050 LENOVO','INFO',NULL,NULL,NULL,NULL),(4837,20,1,'SECURITY ASSESSMENT','STORAGE','Disk','Interface','IDE','INFO',NULL,NULL,NULL,NULL),(4838,20,1,'SECURITY ASSESSMENT','STORAGE','Disk','Media Type','Fixed hard disk media','INFO',NULL,NULL,NULL,NULL),(4839,20,1,'SECURITY ASSESSMENT','STORAGE','Disk','Capacity','465.76 GB','INFO',NULL,NULL,NULL,NULL),(4840,20,1,'SECURITY ASSESSMENT','STORAGE','Disk','Serial Number','87N9L03AS','INFO',NULL,NULL,NULL,NULL),(4841,20,1,'SECURITY ASSESSMENT','STORAGE','Disk','Firmware Revision','MS1OA7R0','INFO',NULL,NULL,NULL,NULL),(4842,20,1,'SECURITY ASSESSMENT','STORAGE','Disk','Health Status','OK','PASS',NULL,NULL,NULL,NULL),(4843,20,1,'SECURITY ASSESSMENT','OPERATING SYSTEM','Windows','Edition','Microsoft Windows 10 Pro','INFO',NULL,NULL,NULL,NULL),(4844,20,1,'SECURITY ASSESSMENT','OPERATING SYSTEM','Windows','Version','10.0.19045','INFO',NULL,NULL,NULL,NULL),(4845,20,1,'SECURITY ASSESSMENT','OPERATING SYSTEM','Windows','Display Version','22H2','INFO',NULL,NULL,NULL,NULL),(4846,20,1,'SECURITY ASSESSMENT','OPERATING SYSTEM','Windows','Build','19045.6466','INFO',NULL,NULL,NULL,NULL),(4847,20,1,'SECURITY ASSESSMENT','OPERATING SYSTEM','Windows','Architecture','64-bit','INFO',NULL,NULL,NULL,NULL),(4848,20,1,'SECURITY ASSESSMENT','SECURITY','VBS','Status','Unable to query Device Guard','INFO',NULL,NULL,NULL,NULL),(4849,20,1,'SECURITY ASSESSMENT','SECURITY','Microsoft Defender','Antivirus Enabled','True','PASS',NULL,NULL,NULL,NULL),(4850,20,1,'SECURITY ASSESSMENT','SECURITY','Microsoft Defender','Real-Time Protection','True','PASS',NULL,NULL,NULL,NULL),(4851,20,1,'SECURITY ASSESSMENT','SECURITY','Microsoft Defender','Antispyware','True','PASS',NULL,NULL,NULL,NULL),(4852,20,1,'SECURITY ASSESSMENT','SECURITY','Microsoft Defender','Engine Version','1.1.26070.7','INFO',NULL,NULL,NULL,NULL),(4853,20,1,'SECURITY ASSESSMENT','SECURITY','Microsoft Defender','Security Intelligence','1.457.446.0','INFO',NULL,NULL,NULL,NULL),(4854,20,1,'SECURITY ASSESSMENT','SECURITY','Windows Firewall','Domain Profile','ENABLED','PASS',NULL,NULL,NULL,NULL),(4855,20,1,'SECURITY ASSESSMENT','SECURITY','Windows Firewall','Private Profile','ENABLED','PASS',NULL,NULL,NULL,NULL),(4856,20,1,'SECURITY ASSESSMENT','SECURITY','Windows Firewall','Public Profile','ENABLED','PASS',NULL,NULL,NULL,NULL),(4857,20,1,'SECURITY ASSESSMENT','NETWORK','Network Adapter','Name','Hyper-V Virtual Ethernet Adapter','INFO',NULL,NULL,NULL,NULL),(4858,20,1,'SECURITY ASSESSMENT','NETWORK','Network Adapter','Manufacturer','Microsoft','INFO',NULL,NULL,NULL,NULL),(4859,20,1,'SECURITY ASSESSMENT','NETWORK','Network Adapter','MAC Address','00:15:5D:DD:D9:05','INFO',NULL,NULL,NULL,NULL),(4860,20,1,'SECURITY ASSESSMENT','NETWORK','Network Adapter','Adapter Type','Ethernet 802.3','INFO',NULL,NULL,NULL,NULL),(4861,20,1,'SECURITY ASSESSMENT','NETWORK','Network Adapter','Name','Intel(R) Ethernet Connection (17) I219-V','INFO',NULL,NULL,NULL,NULL),(4862,20,1,'SECURITY ASSESSMENT','NETWORK','Network Adapter','Manufacturer','Intel','INFO',NULL,NULL,NULL,NULL),(4863,20,1,'SECURITY ASSESSMENT','NETWORK','Network Adapter','MAC Address','D4:61:37:01:52:A1','INFO',NULL,NULL,NULL,NULL),(4864,20,1,'SECURITY ASSESSMENT','NETWORK','Network Adapter','Adapter Type','Ethernet 802.3','INFO',NULL,NULL,NULL,NULL),(4865,20,1,'SECURITY ASSESSMENT','NETWORK INTEGRITY','Active Connections','Established TCP Connections','208','INFO','Active TCP connections enumerated.',NULL,NULL,NULL),(4866,20,1,'SECURITY ASSESSMENT','NETWORK INTEGRITY','Internet Connections','Public Remote Connections','18','INFO','Connections to publicly routable remote IP addresses.',NULL,NULL,NULL),(4867,20,1,'SECURITY ASSESSMENT','NETWORK INTEGRITY','Geolocation','Foreign Destinations','0','PASS','No active established TCP connections geolocated outside the Philippines.',NULL,NULL,NULL),(4868,20,1,'SECURITY ASSESSMENT','STORAGE','System Drive','Drive','C:','INFO',NULL,NULL,NULL,NULL),(4869,20,1,'SECURITY ASSESSMENT','STORAGE','System Drive','File System','NTFS','INFO',NULL,NULL,NULL,NULL),(4870,20,1,'SECURITY ASSESSMENT','STORAGE','System Drive','Free Space','21.05 GB','INFO',NULL,NULL,NULL,NULL),(4871,20,1,'SECURITY ASSESSMENT','STORAGE','System Drive','Capacity','232.63 GB','INFO',NULL,NULL,NULL,NULL),(4872,20,1,'SECURITY ASSESSMENT','ASSESSMENT','Security Risk','Risk Score','45 / 100','WARN',NULL,NULL,NULL,NULL),(4873,20,1,'SECURITY ASSESSMENT','ASSESSMENT','Security Risk','Risk Level','HIGH','WARN',NULL,NULL,NULL,NULL),(4874,20,1,'SECURITY ASSESSMENT','ASSESSMENT','Foren','Assessment Duration','58.46 seconds','INFO',NULL,NULL,NULL,NULL),(4875,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'No obvious suspicious indicator detected.',NULL,NULL,NULL),(4876,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'No obvious suspicious indicator detected.',NULL,NULL,NULL),(4877,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'No obvious suspicious indicator detected.',NULL,NULL,NULL),(4878,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'No obvious suspicious indicator detected.',NULL,NULL,NULL),(4879,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4880,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4881,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4882,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4883,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4884,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4885,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4886,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4887,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4888,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4889,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4890,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4891,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4892,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4893,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4894,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4895,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4896,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4897,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4898,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4899,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4900,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4901,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4902,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4903,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4904,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4905,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4906,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4907,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4908,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4909,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4910,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4911,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4912,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4913,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4914,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4915,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4916,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4917,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4918,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4919,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4920,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4921,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4922,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4923,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4924,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4925,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4926,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4927,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4928,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4929,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4930,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4931,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4932,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4933,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4934,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4935,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4936,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4937,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4938,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4939,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'No obvious suspicious indicator detected.',NULL,NULL,NULL),(4940,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4941,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4942,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4943,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4944,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4945,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4946,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4947,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4948,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4949,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4950,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4951,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4952,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4953,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4954,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4955,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4956,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4957,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4958,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4959,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4960,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4961,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4962,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4963,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4964,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4965,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4966,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4967,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4968,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4969,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4970,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4971,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4972,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4973,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4974,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4975,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4976,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4977,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4978,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4979,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4980,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4981,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4982,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4983,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4984,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4985,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4986,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4987,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4988,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'process executable path unavailable; no reverse DNS hostname available.',NULL,NULL,NULL),(4989,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'no reverse DNS hostname available.',NULL,NULL,NULL),(4990,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'No obvious suspicious indicator detected.',NULL,NULL,NULL),(4991,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'No obvious suspicious indicator detected.',NULL,NULL,NULL),(4992,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4993,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4994,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(4995,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'no reverse DNS hostname available.',NULL,NULL,NULL),(4996,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'No obvious suspicious indicator detected.',NULL,NULL,NULL),(4997,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'no reverse DNS hostname available.',NULL,NULL,NULL),(4998,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'No obvious suspicious indicator detected.',NULL,NULL,NULL),(4999,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'no reverse DNS hostname available.',NULL,NULL,NULL),(5000,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'no reverse DNS hostname available.',NULL,NULL,NULL),(5001,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5002,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'No obvious suspicious indicator detected.',NULL,NULL,NULL),(5003,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'No obvious suspicious indicator detected.',NULL,NULL,NULL),(5004,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5005,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5006,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'No obvious suspicious indicator detected.',NULL,NULL,NULL),(5007,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5008,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5009,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5010,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5011,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5012,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5013,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5014,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5015,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5016,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5017,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5018,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5019,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5020,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5021,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5022,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5023,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5024,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5025,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5026,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5027,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5028,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5029,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5030,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5031,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5032,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5033,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5034,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5035,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5036,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5037,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5038,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5039,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5040,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5041,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5042,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5043,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5044,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5045,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5046,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5047,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5048,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5049,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5050,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5051,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5052,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5053,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5054,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5055,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5056,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5057,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5058,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5059,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5060,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5061,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5062,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5063,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5064,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5065,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5066,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5067,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5068,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5069,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5070,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5071,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5072,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5073,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5074,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5075,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5076,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5077,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5078,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5079,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5080,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5081,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5082,20,2,'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION',NULL,NULL,NULL,NULL,NULL,'Private/local network connection.',NULL,NULL,NULL),(5083,20,3,'FUNCTIONAL TESTING','SYSTEM','Operating System',NULL,NULL,'PASS','Operating system successfully enumerated.',NULL,NULL,NULL),(5084,20,3,'FUNCTIONAL TESTING','INPUT','Keyboard',NULL,NULL,'WARNING','Keyboard detected. Detection alone does not prove that every key is functional.',NULL,NULL,NULL),(5085,20,3,'FUNCTIONAL TESTING','INPUT','Mouse / Touchpad',NULL,NULL,'WARNING','Pointing device detected. Detection alone does not prove movement, buttons, or touchpad gestures are functional.',NULL,NULL,NULL),(5086,20,3,'FUNCTIONAL TESTING','SYSTEM','Computer',NULL,NULL,'PASS','Computer system information successfully enumerated.',NULL,NULL,NULL),(5087,20,3,'FUNCTIONAL TESTING','HARDWARE','CPU',NULL,NULL,'PASS','CPU successfully enumerated.',NULL,NULL,NULL),(5088,20,3,'FUNCTIONAL TESTING','HARDWARE','Memory',NULL,NULL,'PASS','Memory module detected and reported by Windows.',NULL,NULL,NULL),(5089,20,3,'FUNCTIONAL TESTING','HARDWARE','Motherboard',NULL,NULL,'PASS','Motherboard information successfully enumerated.',NULL,NULL,NULL),(5090,20,3,'FUNCTIONAL TESTING','FIRMWARE','BIOS / UEFI',NULL,NULL,'PASS','BIOS/UEFI information successfully enumerated.',NULL,NULL,NULL),(5091,20,3,'FUNCTIONAL TESTING','SECURITY','TPM',NULL,NULL,'WARNING','No TPM was reported by Windows.',NULL,NULL,NULL),(5092,20,3,'FUNCTIONAL TESTING','SECURITY','Secure Boot',NULL,NULL,'WARNING','Secure Boot state successfully checked.',NULL,NULL,NULL),(5093,20,3,'FUNCTIONAL TESTING','HARDWARE','GPU',NULL,NULL,'PASS','GPU/display adapter successfully enumerated.',NULL,NULL,NULL),(5094,20,3,'FUNCTIONAL TESTING','DISPLAY','Monitor',NULL,NULL,NULL,NULL,NULL,NULL,NULL);
DROP TABLE IF EXISTS `security_assessments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `security_assessments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `serial_no` varchar(255) DEFAULT NULL,
  `device_type` enum('desktops','laptops') DEFAULT NULL,
  `device_id` int(11) DEFAULT NULL,
  `foren_version` varchar(20) DEFAULT NULL,
  `ran_as_admin` tinyint(1) DEFAULT NULL,
  `assessed_at` datetime DEFAULT NULL,
  `duration_seconds` decimal(6,2) DEFAULT NULL,
  `motherboard_manufacturer` varchar(150) DEFAULT NULL,
  `motherboard_product` varchar(150) DEFAULT NULL,
  `motherboard_serial` varchar(255) DEFAULT NULL,
  `cpu_summary` varchar(255) DEFAULT NULL,
  `ram_manufacturer` varchar(100) DEFAULT NULL,
  `ram_capacity` varchar(50) DEFAULT NULL,
  `ram_speed` varchar(50) DEFAULT NULL,
  `gpu_name` varchar(150) DEFAULT NULL,
  `gpu_vram` varchar(50) DEFAULT NULL,
  `os_edition` varchar(150) DEFAULT NULL,
  `os_build` varchar(50) DEFAULT NULL,
  `secure_boot_status` varchar(20) DEFAULT NULL,
  `tpm_present` tinyint(1) DEFAULT NULL,
  `tpm_ready` tinyint(1) DEFAULT NULL,
  `tpm_enabled` tinyint(1) DEFAULT NULL,
  `defender_enabled` tinyint(1) DEFAULT NULL,
  `defender_realtime` tinyint(1) DEFAULT NULL,
  `firewall_domain` tinyint(1) DEFAULT NULL,
  `firewall_private` tinyint(1) DEFAULT NULL,
  `firewall_public` tinyint(1) DEFAULT NULL,
  `established_tcp_connections` int(11) DEFAULT NULL,
  `public_remote_connections` int(11) DEFAULT NULL,
  `foreign_destinations` int(11) DEFAULT NULL,
  `risk_score` int(11) DEFAULT NULL,
  `risk_level` varchar(20) DEFAULT NULL,
  `hostname` varchar(150) DEFAULT NULL,
  `computer_name` varchar(150) DEFAULT NULL,
  `ip_address` varchar(255) DEFAULT NULL,
  `mac_address` varchar(255) DEFAULT NULL,
  `username` varchar(150) DEFAULT NULL,
  `domain_workgroup` varchar(150) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `serial_no` (`serial_no`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `security_assessments` VALUES (6,'PAR-1000','desktops',1,'5',1,'2026-08-20 09:12:00',41.20,'Dell','OptiPlex 7090',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Windows 10 Pro','19045','ENABLED',1,NULL,NULL,1,NULL,1,1,1,NULL,NULL,NULL,18,'LOW','ITSD-PC01','ITSD-PC01','192.168.10.11','00:15:5D:01:AA:01','jsantos','WORKGROUP','2026-08-20 01:15:00'),(7,'PAR-1001','desktops',2,'5',0,'2026-08-21 10:05:00',38.70,'Dell','OptiPlex 7090',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Windows 10 Home','19044','DISABLED',0,NULL,NULL,1,NULL,1,0,1,NULL,NULL,NULL,58,'MEDIUM','SMD-PC02','SMD-PC02','192.168.10.12','00:15:5D:01:AA:02','mreyes','WORKGROUP','2026-08-22 00:40:00'),(8,'PAR-1002','desktops',3,'5',0,'2026-08-25 14:22:00',52.00,'HP','ProDesk 400 G7',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Windows 10 Home','19042','DISABLED',0,NULL,NULL,0,NULL,0,0,1,NULL,NULL,NULL,82,'HIGH','ISSD-PC03','ISSD-PC03','192.168.10.13','00:15:5D:01:AA:03','cdelacruz','WORKGROUP','2026-08-26 03:05:00'),(9,'PAR-1003','desktops',4,'5',1,'2026-08-28 16:47:00',44.90,'Acer','Veriton X4665G',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Windows 11 Pro','22631','ENABLED',1,NULL,NULL,1,NULL,1,1,1,NULL,NULL,NULL,9,'LOW','ITPMD-PC04','ITPMD-PC04','192.168.10.14','00:15:5D:01:AA:04','agarcia','WORKGROUP','2026-08-29 01:00:00'),(10,'PAR-1004','desktops',5,'5',0,'2026-09-01 13:10:00',47.30,'Acer','Veriton X4665G',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Windows 10 Pro','19045','ENABLED',1,NULL,NULL,0,NULL,1,1,0,NULL,NULL,NULL,47,'MEDIUM','PTD-PC05','PTD-PC05','192.168.10.15','00:15:5D:01:AA:05','rlopez','WORKGROUP','2026-09-01 07:30:00'),(11,'PAR-2000','laptops',1,'5',0,'2026-08-19 11:00:00',39.50,'Lenovo','ThinkPad T14',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Windows 11 Pro','22631','ENABLED',1,NULL,NULL,1,NULL,1,1,1,NULL,NULL,NULL,24,'LOW','ISSD-LT01','ISSD-LT01','192.168.10.21','00:15:5D:02:BB:01','ktan','WORKGROUP','2026-08-19 06:10:00'),(12,'PAR-2001','laptops',2,'5',0,'2026-08-23 09:33:00',43.10,'Lenovo','ThinkPad T14',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Windows 10 Pro','19044','DISABLED',1,NULL,NULL,1,NULL,0,1,1,NULL,NULL,NULL,61,'MEDIUM','ITPMD-LT02','ITPMD-LT02','192.168.10.22','00:15:5D:02:BB:02','fbautista','WORKGROUP','2026-08-23 08:00:00'),(13,'PAR-2002','laptops',3,'5',1,'2026-08-30 15:18:00',55.60,'Dell','Latitude 5420',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Windows 10 Home','19042','DISABLED',0,NULL,NULL,0,NULL,0,0,0,NULL,NULL,NULL,91,'HIGH','PTD-LT03','PTD-LT03','192.168.10.23','00:15:5D:02:BB:03','nvillanueva','WORKGROUP','2026-08-31 00:20:00'),(14,'PAR-2003','laptops',4,'5',0,'2026-09-02 10:41:00',40.00,'Dell','Latitude 5420',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Windows 11 Pro','22631','ENABLED',1,NULL,NULL,1,NULL,1,1,1,NULL,NULL,NULL,13,'LOW','DMD-LT04','DMD-LT04','192.168.10.24','00:15:5D:02:BB:04','jmendoza','WORKGROUP','2026-09-02 05:00:00'),(16,NULL,NULL,NULL,'5',0,'2026-08-24 08:55:00',60.20,'Gigabyte','B450M DS3H',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Windows 10 Home','19041','DISABLED',0,NULL,NULL,0,NULL,0,0,0,NULL,NULL,NULL,76,'HIGH','UNKNOWN-PC01',NULL,'192.168.10.90','00:1A:2B:3C:4D:01',NULL,'WORKGROUP','2026-08-24 02:10:00'),(17,NULL,NULL,NULL,'5',0,'2026-08-27 17:30:00',49.40,'ASUS','PRIME B560M-A',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Windows 11 Home','22621','ENABLED',0,NULL,NULL,1,NULL,1,1,1,NULL,NULL,NULL,33,'MEDIUM','UNKNOWN-PC02',NULL,'192.168.10.91','00:1A:2B:3C:4D:02',NULL,'WORKGROUP','2026-08-27 11:00:00'),(18,NULL,NULL,NULL,'5',1,'2026-09-03 09:05:00',35.90,'MSI','B450M PRO-VDH',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Windows 10 Pro','19045','ENABLED',1,NULL,NULL,1,NULL,1,1,1,NULL,NULL,NULL,15,'LOW','UNKNOWN-PC03',NULL,'192.168.10.92','00:1A:2B:3C:4D:03',NULL,'WORKGROUP','2026-09-03 03:20:00'),(20,'DBVWR1100130183FA630E1',NULL,NULL,'5',0,NULL,58.46,'Acer','Veriton M4690G','DBVWR1100130183FA630E1','Unable to detect CPU','Kingston','16.00 GB','3200 MHz','NVIDIA GeForce GTX 1650','4.00 GB','Microsoft Windows 10 Pro','19045.6466','DISABLED',0,0,0,1,1,1,1,1,208,18,0,45,'HIGH',NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-07 06:17:31');
DROP TABLE IF EXISTS `splitters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `splitters` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `personnel_id` int(11) NOT NULL,
  `division_id` int(11) NOT NULL,
  `brand` varchar(255) DEFAULT NULL,
  `model` varchar(255) DEFAULT NULL,
  `serial_no` varchar(255) DEFAULT NULL,
  `hdmi_in` int(11) DEFAULT NULL,
  `hdmi_out` int(11) DEFAULT NULL,
  `no_of_ports` int(11) DEFAULT NULL,
  `acquisition_details` text DEFAULT NULL,
  `acquisition_date` date DEFAULT NULL,
  `previous_owners_id` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`previous_owners_id`)),
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_date` date NOT NULL DEFAULT current_timestamp(),
  `last_update_at` date DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `splitters` VALUES (1,21,9,'Ugreen','SPL-100','SN-SPL-9000',1,2,2,'For dual-monitor setup','2026-08-31',NULL,1,'2025-12-11',NULL),(2,22,10,'Orico','SPL-101','SN-SPL-9001',1,2,2,'For dual-monitor setup','2026-06-11',NULL,1,'2026-06-13',NULL),(3,23,11,'Ugreen','SPL-102','SN-SPL-9002',1,2,2,'For dual-monitor setup','2026-07-29',NULL,1,'2026-08-19',NULL);
DROP TABLE IF EXISTS `switchers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `switchers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `personnel_id` int(11) NOT NULL,
  `division_id` int(11) NOT NULL,
  `brand` varchar(255) DEFAULT NULL,
  `model` varchar(255) DEFAULT NULL,
  `serial_no` varchar(255) DEFAULT NULL,
  `hdmi_in` int(11) DEFAULT NULL,
  `hdmi_out` int(11) DEFAULT NULL,
  `no_of_ports` int(11) DEFAULT NULL,
  `acquisition_details` text DEFAULT NULL,
  `acquisition_date` date DEFAULT NULL,
  `previous_owners_id` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`previous_owners_id`)),
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_date` date NOT NULL DEFAULT current_timestamp(),
  `last_update_at` date DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `switchers` VALUES (1,23,10,'Orico','SWH-100','SN-SWH-10000',2,1,2,'For shared monitor between two PCs','2026-02-01',NULL,1,'2026-04-09',NULL),(2,24,11,'Ugreen','SWH-101','SN-SWH-10001',2,1,2,'For shared monitor between two PCs','2026-08-15',NULL,1,'2026-04-19',NULL),(3,25,12,'Orico','SWH-102','SN-SWH-10002',2,1,2,'For shared monitor between two PCs','2026-06-10',NULL,1,'2026-02-27',NULL);
DROP TABLE IF EXISTS `switches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `switches` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `personnel_id` int(11) NOT NULL,
  `division_id` int(11) NOT NULL,
  `device_id` int(11) NOT NULL,
  `manufacturer` varchar(255) NOT NULL,
  `model` varchar(255) NOT NULL,
  `serial_no` varchar(255) NOT NULL,
  `no_of_ports` int(11) NOT NULL,
  `no_of_active_ports` int(11) NOT NULL,
  `no_of_managed` int(11) NOT NULL,
  `no_of_unmanaged` int(11) NOT NULL,
  `firmware_version` varchar(255) NOT NULL,
  `is_vlan_supported` tinyint(1) NOT NULL,
  `location` varchar(255) NOT NULL,
  `is_status` tinyint(1) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `is_remote_access` tinyint(1) NOT NULL,
  `remote_connection_details` text NOT NULL,
  `remarks` text NOT NULL,
  `pnp_focal_person` varchar(255) NOT NULL,
  `contact_details` varchar(50) NOT NULL,
  `acquisition_date` date DEFAULT NULL,
  `acquisition_type` varchar(255) NOT NULL,
  `acquisition_details` text NOT NULL,
  `previous_owners_id` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`previous_owners_id`)),
  `created_date` date NOT NULL DEFAULT current_timestamp(),
  `last_update_at` date DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `switches` VALUES (1,13,5,0,'TP-Link','SW-2000','SN-SW-5000',24,20,24,0,'v2.0.1',1,'Server Room',1,1,0,'','No issues reported','Network Admin','09171234567','2025-12-31','Purchase','Purchased via public bidding',NULL,'2026-07-10',NULL),(2,14,6,0,'MikroTik','SW-2001','SN-SW-5001',24,20,24,0,'v2.0.1',1,'Server Room',1,1,0,'','No issues reported','Network Admin','09171234567','2025-12-11','Purchase','Purchased via public bidding',NULL,'2026-03-13',NULL),(3,15,7,0,'Ubiquiti','SW-2002','SN-SW-5002',24,20,24,0,'v2.0.1',1,'Server Room',1,1,0,'','No issues reported','Network Admin','09171234567','2026-01-07','Purchase','Purchased via public bidding',NULL,'2026-02-05',NULL),(4,16,8,0,'Cisco','SW-2003','SN-SW-5003',24,20,24,0,'v2.0.1',1,'Server Room',1,1,0,'','No issues reported','Network Admin','09171234567','2026-08-08','Purchase','Purchased via public bidding',NULL,'2026-03-13',NULL),(5,17,9,0,'TP-Link','SW-2004','SN-SW-5004',24,20,24,0,'v2.0.1',1,'Server Room',1,1,0,'','No issues reported','Network Admin','09171234567','2026-03-11','Purchase','Purchased via public bidding',NULL,'2026-05-21',NULL);
DROP TABLE IF EXISTS `ups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ups` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `personnel_id` int(11) NOT NULL,
  `division_id` int(11) NOT NULL,
  `brand` varchar(255) DEFAULT NULL,
  `model` varchar(255) DEFAULT NULL,
  `serial_no` varchar(255) DEFAULT NULL,
  `capacity_va` int(11) DEFAULT NULL,
  `capacity_watts` int(11) DEFAULT NULL,
  `battery_type` varchar(255) DEFAULT NULL,
  `backup_time` int(11) DEFAULT NULL,
  `input_voltage` int(11) DEFAULT NULL,
  `output_voltage` int(11) DEFAULT NULL,
  `acquisition_details` text DEFAULT NULL,
  `acquisition_date` date DEFAULT NULL,
  `previous_owners_id` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`previous_owners_id`)),
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_date` date NOT NULL DEFAULT current_timestamp(),
  `last_update_at` date DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `ups` VALUES (1,26,11,'APC','UPS-1000','SN-UPS-11000',650,390,'Lead-acid',15,220,220,'For server room backup power','2026-03-13',NULL,1,'2026-02-19',NULL),(2,27,12,'CyberPower','UPS-1001','SN-UPS-11001',650,390,'Lead-acid',15,220,220,'For server room backup power','2025-12-26',NULL,1,'2026-06-12',NULL),(3,28,13,'APC','UPS-1002','SN-UPS-11002',650,390,'Lead-acid',15,220,220,'For server room backup power','2026-05-26',NULL,1,'2026-06-09',NULL),(4,29,14,'CyberPower','UPS-1003','SN-UPS-11003',650,390,'Lead-acid',15,220,220,'For server room backup power','2026-06-28',NULL,1,'2026-03-12',NULL);
DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `role_id` int(11) NOT NULL,
  `division_id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `rank_id` int(11) NOT NULL,
  `first_name` varchar(255) NOT NULL,
  `middle_name` varchar(255) DEFAULT NULL,
  `last_name` varchar(255) NOT NULL,
  `username` varchar(255) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `creator_user_id` int(11) NOT NULL,
  `created_date` date NOT NULL DEFAULT current_timestamp(),
  `last_update_at` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
