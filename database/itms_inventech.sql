-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 03, 2026 at 02:44 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `itms_inventech`
--

-- --------------------------------------------------------

--
-- Table structure for table `cameras`
--

CREATE TABLE `cameras` (
  `id` int(11) NOT NULL,
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
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `desktops`
--

CREATE TABLE `desktops` (
  `id` int(11) NOT NULL,
  `personnel_id` int(11) NOT NULL,
  `device_id` int(11) NOT NULL,
  `device_name` varchar(150) NOT NULL,
  `division_id` int(11) NOT NULL,
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
  `acquisition_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `desktops`
--

INSERT INTO `desktops` (`id`, `personnel_id`, `device_id`, `device_name`, `division_id`, `ip_address`, `os`, `is_os_licensed`, `os_license_key`, `is_remote_acc`, `endpoint_security_id`, `no_of_installed_anti_virus`, `date_installed`, `guid`, `mac_address`, `cpu_brand`, `cpu_generation`, `cpu_cores`, `gb_ram`, `monitor_brand`, `monitor_size_inches`, `no_of_user_accounts`, `user_account_type`, `authorized_software`, `unauthorized_software`, `office_application`, `is_office_licensed`, `office_license_key`, `previous_owners_id`, `created_date`, `last_updated_at`, `par_serial_no`, `is_active`, `acquisition_date`) VALUES
(1, 8, 0, 'ITMS-ITSD-0037', 1, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"8\"]', 1, NULL, NULL, ' D4:61:37:01:52:39', 'Intel', 12, 6, 16, 'Acer KA242Y', 24, 4, '[{\"name\":\"Administrator\",\"type\":\"Admin\"},{\"name\":\"arren\",\"type\":\"Admin\"},{\"name\":\"SU\",\"type\":\"Admin\"},{\"name\":\"SAS ADMIN\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, '[]', '2026-06-24', NULL, NULL, 1, NULL),
(2, 9, 0, 'ITMS-ITSD-0030', 1, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\",\"3\",\"4\",\"8\",\"9\"]', 5, NULL, NULL, '6C:4B:90:22:89:50', 'Inter', 7, 4, 16, 'HP W2072a', 20, 4, '[{\"name\":\"macalapano\",\"type\":\"User\"},{\"name\":\"PNP-ITMS\",\"type\":\"Admin\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC 2024', 1, NULL, '[]', '2026-06-24', NULL, NULL, 1, NULL),
(3, 11, 0, 'ITMS-TSD-0036', 1, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\",\"4\",\"8\",\"9\"]', 4, NULL, NULL, 'D4:61:37:01:4F:A6', 'INTEL', 12, 6, 16, 'Acer KA242Y / AOC 1950', 24, 3, '[{\"name\":\"hrali\",\"type\":\"User\"},{\"name\":\"su\",\"type\":\"Admin\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, '[]', '2026-06-24', NULL, NULL, 1, NULL),
(4, 12, 0, 'ITMS-ITSD-148', 1, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"4\",\"8\"]', 2, NULL, NULL, ' D4:61:37:01:4E:EB', 'Intel', 12, 6, 16, 'Acer KA242Y', 24, 3, '[{\"name\":\"acer\",\"type\":\"Admin\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft 365 Apps for Enterprise', 1, NULL, '[]', '2026-06-24', NULL, NULL, 1, NULL),
(5, 13, 0, 'ITMS-ITSD-0028', 1, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\",\"4\",\"8\",\"9\"]', 4, NULL, NULL, 'D4:61:37:01:51:4E', 'Inter', 12, 6, 16, 'Acer KA242Y', 24, 5, '[{\"name\":\"ragabriel\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"},{\"name\":\"ITSD\",\"type\":\"User\"},{\"name\":\"Guest\",\"type\":\"User\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, '[]', '2026-06-24', NULL, NULL, 1, NULL),
(6, 14, 0, 'ITMS-ITSD-0025', 1, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\",\"4\",\"8\",\"9\"]', 4, NULL, NULL, 'D4:61:37:01:4F:C0', 'Inter', 12, 6, 16, 'Acer KA242Y', 24, 3, '[{\"name\":\"admin\",\"type\":\"Admin\"},{\"name\":\"mddelacruz\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-06-24', NULL, NULL, 1, NULL),
(7, 15, 0, 'ITMS-ITSD-0031', 1, NULL, 'Windows 10 Pro', 1, NULL, 1, '[\"2\",\"4\",\"8\",\"10\"]', 4, NULL, NULL, 'D4:61:37:01:52:A1', 'Intel', 12, 6, 16, 'Acer KA242Y / Acer V196HQL', 24, 4, '[{\"name\":\"ebnavarro\",\"type\":\"Admin\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"},{\"name\":\"Guest\",\"type\":\"User\"}]', NULL, NULL, 'Microsoft 365 Apps for Business', 1, NULL, NULL, '2026-06-24', NULL, NULL, 1, NULL),
(8, 16, 0, 'ITMS-ITSD-0034', 1, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"4\",\"8\"]', 2, NULL, NULL, 'D4:61:37:01:52:93', 'Inter', 12, 6, 16, 'Acer KA242Y', 24, 4, '[{\"name\":\"Administrator\",\"type\":\"Admin\"},{\"name\":\"joeym\",\"type\":\"\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-06-24', NULL, NULL, 1, NULL),
(9, 17, 0, 'ITMS-LO-221', 1, NULL, 'Windows 11 Home Single Language', 1, NULL, 1, '[\"2\",\"3\",\"8\"]', 3, NULL, NULL, '10:B1:DF:98:87:ED', 'Intel', 12, 6, 16, 'Acer VG240Y S', 24, 5, '[{\"name\":\"ITMS\",\"type\":\"Admin\"},{\"name\":\"ITMS Conference\",\"type\":\"Admin\"},{\"name\":\"Room\",\"type\":\"\"},{\"name\":\"SAS Admin\",\"type\":\"Admin\"},{\"name\":\"admin\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft 365 Personal', 1, NULL, NULL, '2026-06-24', NULL, NULL, 1, NULL),
(10, 18, 0, 'ITMS-ITSD-0033', 1, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"6\",\"8\",\"9\"]', 3, NULL, NULL, 'D4:61:37:01:4F:81', 'Intel', 12, 6, 16, 'Acer KA242Y', 24, 3, '[{\"name\":\"mdpimentel\",\"type\":\"\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-06-24', NULL, NULL, 1, NULL),
(11, 19, 0, 'ITMS-ITSD-0022', 1, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\",\"8\",\"9\",\"10\",\"11\"]', 5, NULL, NULL, 'D4:61:37:01:4E:D6', 'Inter', 12, 6, 16, 'Acer KA242Y', 24, 5, '[{\"name\":\"mldimaculangan\",\"type\":\"User\"},{\"name\":\"su\",\"type\":\"Admin\"},{\"name\":\"ADMIN\",\"type\":\"Admin\"},{\"name\":\"ITSD GUEST\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-06-24', NULL, NULL, 1, NULL),
(12, 20, 0, 'ITMS-ITSD-0020', 1, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\",\"8\",\"9\"]', 3, NULL, NULL, 'D4:61:37:01:50:1C', 'Intel', 12, 6, 16, 'Acer KA242Y', 24, 3, '[{\"name\":\"pa.ramos\",\"type\":\"Admin\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"SU\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-06-24', NULL, NULL, 1, NULL),
(13, 21, 0, 'DESKTOP-055U73P', 1, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"8\"]', NULL, NULL, NULL, NULL, 'Intel', 12, 6, 16, NULL, NULL, 0, '[]', NULL, NULL, 'Other', 1, NULL, '[]', '2026-06-24', NULL, NULL, 1, NULL),
(14, 22, 0, 'ITMS-ITSD-0027', 1, NULL, 'Windows 10 Pro', 1, NULL, 1, '[\"4\",\"8\"]', 2, NULL, NULL, '50:65:F3:2D:D8:A1', 'Inter', 4, 4, 6, 'Lenovo LEN LI2054A', 19, 3, '[{\"name\":\"lvseculles\",\"type\":\"Admin\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office Professional Plus 2013', 1, NULL, NULL, '2026-06-25', NULL, NULL, 1, NULL),
(15, 23, 0, 'ITMS-ITSD-0021', 1, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\",\"8\",\"9\"]', 3, NULL, NULL, ' D4:61:37:01:52:82', 'Inter', 12, 6, 16, 'Acer KA242Y', 24, 4, '[{\"name\":\"rn.rosete\",\"type\":\"Admin\"},{\"name\":\"Su\",\"type\":\"Admin\"},{\"name\":\"PNP-ITMS\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-06-25', NULL, NULL, 1, NULL),
(16, 24, 0, 'ITMS-ITSD-0024', 1, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"6\"]', 1, NULL, NULL, ' CC:96:E5:15:23:2B', 'Intel', 13, 16, 32, 'Acer KA242Y', 24, 3, '[{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"Shine\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office Professional 2021', 1, NULL, NULL, '2026-06-25', NULL, NULL, 1, NULL),
(17, 26, 0, 'ITMS_ITSD-OLCIM', 1, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\",\"4\",\"8\",\"9\",\"10\"]', 5, NULL, NULL, 'D4:61:37:01:51:4B', 'Intel', 12, 6, 16, 'Acer KA242Y', 24, 4, '[{\"name\":\"apruaro\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"ITSD\",\"type\":\"User\"},{\"name\":\"SU\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-06-25', NULL, NULL, 1, NULL),
(18, 27, 0, 'ITMS-ITSD-0035', 1, NULL, 'Windows 10 Pro', 1, NULL, 1, '[\"1\",\"2\",\"4\",\"8\"]', 5, NULL, NULL, ' F0:A7:31:29:9B:ED', 'Intel', 7, 4, 8, 'Acer V196HQL', 19, 5, '[{\"name\":\"ITSD\",\"type\":\"Admin\"},{\"name\":\"OJT\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"},{\"name\":\"gdbejarin\",\"type\":\"User\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, '[]', '2026-06-25', NULL, NULL, 1, NULL),
(19, 28, 0, 'ITMS-ITSD-0052', 1, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"4\",\"7\",\"10\",\"11\"]', 4, NULL, NULL, '98:EE:CB:4E:BF:82', 'Intel', 6, 4, 8, 'BenQ G910WAL', 19, 4, '[{\"name\":\"LOT\",\"type\":\"User\"},{\"name\":\"rbpaulo\",\"type\":\"User\"},{\"name\":\"sgbinarao\",\"type\":\"User\"},{\"name\":\"SU\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, '[]', '2026-06-25', NULL, NULL, 1, NULL),
(20, 252, 0, 'NETWORK-MONITOR (SERVER FARM)', 15, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"11\"]', 1, NULL, NULL, NULL, 'Intel', 10, NULL, 16, NULL, NULL, 0, '[]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, '[]', '2026-06-25', NULL, NULL, 1, NULL),
(21, 29, 0, 'ITMS-ITSD-0040', 1, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"11\"]', NULL, NULL, NULL, NULL, 'Intel', 14, 10, 16, 'Xitrix', NULL, 0, '[]', NULL, NULL, 'Microsoft Office Home 2024', 1, NULL, NULL, '2026-06-25', NULL, NULL, 1, NULL),
(22, 30, 0, 'ITMS-ITSD-0014', 1, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"9\"]', 1, NULL, NULL, ' F4:B5:20:77:48:A6', 'Intel', 14, 10, 16, 'Xitrix', 24, 4, '[{\"name\":\"ctdelaperi\",\"type\":\"User\"},{\"name\":\"mbalde\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"SU\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office Home 2024', 1, NULL, NULL, '2026-06-25', NULL, NULL, 1, NULL),
(23, 31, 0, 'ITMS-ITSD-0017', 1, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\",\"4\",\"8\",\"9\"]', 4, NULL, NULL, ' D4:61:37:01:52:BF', 'Intel', 12, 6, 16, 'Acer KA242Y ', 24, 6, '[{\"name\":\"guguifayajr\",\"type\":\"User\"},{\"name\":\"admin\",\"type\":\"Admin\"},{\"name\":\"jaildefonso\",\"type\":\"User\"},{\"name\":\"SA\",\"type\":\"Admin\"},{\"name\":\"SU\",\"type\":\"Admin\"},{\"name\":\"PNP-ITMS\",\"type\":\"User\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-06-25', NULL, NULL, 1, NULL),
(24, 32, 0, 'ITMS-ITSD-0013', 1, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"8\",\"9\"]', 2, NULL, NULL, ' D4:61:37:01:52:5A', 'Intel', 12, 6, 16, 'Acer KA242Y/Lenovo LI2215sD', 24, 2, '[{\"name\":\"jbalegre\",\"type\":\"User\"},{\"name\":\"SU\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-06-25', NULL, NULL, 1, NULL),
(25, 33, 0, 'ITMS-ITSD-0015', 1, NULL, 'Windows 10 Pro', 1, NULL, 1, '[\"2\",\"8\"]', 2, NULL, NULL, ' 94:C6:91:F9:7B:B1', 'AMD', 9, 4, 8, 'Acer V196HQL', 18, 4, '[{\"name\":\"cmhernandez\",\"type\":\"User\"},{\"name\":\"FOR ALL\",\"type\":\"Admin\"},{\"name\":\"jffloro\",\"type\":\"Admin\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office Professional Plus 2019', 1, NULL, NULL, '2026-06-25', NULL, NULL, 1, NULL),
(26, 34, 0, 'ITMS-ITSD-0038', 1, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\",\"6\",\"9\"]', 3, NULL, NULL, ' D4:61:37:00:88:C3', 'Intel', 12, 4, 8, 'Acer', NULL, 3, '[{\"name\":\"mdcbaclig\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"SU\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-06-25', NULL, NULL, 1, NULL),
(27, 35, 0, 'ITMS-ITSD-0012', 1, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\",\"4\",\"8\",\"9\"]', 4, NULL, NULL, ' D4:61:37:01:52:BB', 'Intel ', 12, 6, 16, 'Acer KA242Y', 24, 5, '[{\"name\":\"mbalde\",\"type\":\"User\"},{\"name\":\"NMS\",\"type\":\"User\"},{\"name\":\"SU\",\"type\":\"Admin\"},{\"name\":\"acbilloso\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-06-25', NULL, NULL, 1, NULL),
(28, 36, 0, 'ITMS-ITSD-0011', 1, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\",\"4\",\"8\",\"9\",\"10\"]', 6, NULL, NULL, ' D4:61:37:01:52:AA', 'Intel', 12, 6, 16, 'Acer KA242Y', 24, 3, '[{\"name\":\"azmoslares\",\"type\":\"Admin\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"SU\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-06-25', NULL, NULL, 1, NULL),
(29, 37, 0, 'ITMS-ITSD-0039', 1, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"9\"]', 1, NULL, NULL, ' A8:59:5F:28:1E:3C', 'Intel', 14, 10, 16, 'Xitrix', 24, 3, '[{\"name\":\"SU\",\"type\":\"Admin\"},{\"name\":\"User-PC\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office Home 2024', 1, NULL, NULL, '2026-06-25', NULL, NULL, 1, NULL),
(30, 38, 0, 'ITMS-ITSD-0026', 1, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\"]', 2, NULL, NULL, ' D4:61:37:01:54:8F', 'Intel', 12, 6, 16, 'Acer KA242Y', 24, 8, '[{\"name\":\"azbayaua\",\"type\":\"User\"},{\"name\":\"JAguarin\",\"type\":\"User\"},{\"name\":\"MDavid\",\"type\":\"User\"},{\"name\":\"MTon-ogan\",\"type\":\"User\"},{\"name\":\"NSantos\",\"type\":\"User\"},{\"name\":\"RGTM\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"Helpdesk\",\"type\":\"User\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-06-25', NULL, NULL, 1, NULL),
(31, 39, 0, 'ITMS-SAO-0022', 14, NULL, 'Windows 11 Home Single Language', 1, NULL, 1, '[\"2\",\"4\",\"8\"]', 3, NULL, NULL, '88:AE:DD:25:E1:5E', 'Intel ', 12, 12, 16, 'Acer K242HYL', 24, 2, '[{\"name\":\"63995\",\"type\":\"Admin\"},{\"name\":\"defaultuser100000\",\"type\":\"User\"}]', NULL, NULL, 'Microsoft 365 Apps for Enterprise', 1, NULL, NULL, '2026-06-25', NULL, NULL, 1, NULL),
(32, 40, 0, ' ITMS-PSMU-0033', 18, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\",\"4\",\"8\",\"9\",\"11\"]', 5, NULL, NULL, ' 04:EC:D8:06:B1:39', 'Intel', 12, 4, 8, 'Acer', 24, 3, '[{\"name\":\"ddfranco\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-06-29', NULL, NULL, 1, NULL),
(33, 42, 0, 'ITMS-ARMD-119', 7, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"11\"]', NULL, NULL, NULL, NULL, 'intel', 12, 6, 16, 'acer', NULL, 0, '[]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-06-29', NULL, NULL, 1, NULL),
(34, 45, 0, 'ITMS-ARMD-91', 7, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"11\"]', NULL, NULL, NULL, NULL, 'Intel i5', 14, 10, 16, 'Acer', NULL, 0, '[]', NULL, NULL, 'Microsoft Office Home 2024', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(35, 43, 0, 'ITMS-ARMD-129 ', 7, NULL, 'Windows 10 Home Single Language', 1, NULL, 1, '[\"2\",\"4\",\"8\"]', 3, NULL, NULL, NULL, 'Intel i5', 10, 6, 8, 'Acer', 22, 2, '[{\"name\":\"su\",\"type\":\"Admin\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"}]', NULL, NULL, 'Other', 1, NULL, '[]', '2026-07-02', NULL, NULL, 1, NULL),
(36, 70, 0, ' ITMS-ARMD-121', 7, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\",\"4\",\"11\"]', 3, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', 22, 2, '[{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(37, 44, 0, 'ITMS-ARMD-94', 7, NULL, 'Windows 11 Home Single Language', 1, NULL, 1, '[\"2\",\"8\"]', 3, NULL, NULL, NULL, 'Intel i5', 13, 10, 8, 'Acer', 22, 2, '[{\"name\":\"PNP ITMS 1\",\"type\":\"Admin\"},{\"name\":\"SU\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft 365 Apps for Enterprise', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(38, 46, 0, 'ITMS-ARMD-129', 7, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\",\"4\",\"8\"]', 3, NULL, NULL, NULL, 'Intel i5', 11, 6, 8, 'Acer', 22, 2, '[{\"name\":\"su\",\"type\":\"Admin\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"}]', NULL, NULL, 'Other', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(39, 47, 0, 'ITMS-ARMD-110', 7, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"11\"]', NULL, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', NULL, 0, '[]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(40, 48, 0, 'ITMS-ARMD-102', 7, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"11\"]', NULL, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', NULL, 0, '[]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(41, 49, 0, 'ITMS-ARMD-120', 7, NULL, 'Windows 11 Home Single Language', 1, NULL, 1, '[\"11\"]', NULL, NULL, NULL, NULL, 'Intel i7', 10, 8, 8, 'Acer', NULL, 0, '[]', NULL, NULL, 'Microsoft Office Professional Plus 2016', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(42, 50, 0, 'ITMS-ARMD-109', 7, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\",\"4\",\"8\"]', 3, NULL, NULL, NULL, 'Intel i7', 8, 6, 16, 'Acer', 19, 3, '[{\"name\":\"nabaclig\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office Professional Plus 2019', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(43, 51, 0, 'ITMS-ARMD-101', 7, NULL, 'Windows 11 Pro for Workstations', 1, NULL, 1, '[\"11\"]', NULL, NULL, NULL, NULL, 'Intel i7', 11, 8, 16, NULL, NULL, 0, '[]', NULL, NULL, 'Microsoft Office Professional Plus 2019', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(44, 52, 0, 'ITMS-ARMD-118', 7, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"11\"]', NULL, NULL, NULL, NULL, 'Intel i5', 13, 10, 8, NULL, NULL, 0, '[]', NULL, NULL, 'Microsoft Office Home & Student 2021', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(45, 53, 0, 'ITMS-ARMD-104', 7, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"11\"]', NULL, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, NULL, NULL, 0, '[]', NULL, NULL, 'Other', 1, NULL, '[]', '2026-07-02', NULL, NULL, 1, NULL),
(46, 54, 0, 'ITMS-ARMD-123', 7, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"11\"]', NULL, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, NULL, NULL, 0, '[]', NULL, NULL, 'Microsoft Office Professional 2021', 1, NULL, '[]', '2026-07-02', NULL, NULL, 1, NULL),
(47, 55, 0, 'ITMS-ARMD-103', 7, NULL, 'Windows 11 Pro', 0, NULL, 1, '[\"11\"]', NULL, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, NULL, NULL, 0, '[]', NULL, NULL, 'Other', 1, NULL, '[]', '2026-07-02', NULL, NULL, 1, NULL),
(48, 56, 0, 'ITMS-ARMD-93', 7, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"11\"]', NULL, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, NULL, NULL, 0, '[]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(49, 57, 0, 'ITMS-ARMD-106', 7, NULL, 'Windows 10 Home', 1, NULL, 1, '[\"11\"]', NULL, NULL, NULL, NULL, 'Intel i5', 11, 6, 8, NULL, NULL, 0, '[]', NULL, NULL, 'Microsoft 365 Apps for Enterprise', 1, NULL, '[]', '2026-07-02', NULL, NULL, 1, NULL),
(50, 62, 0, 'ITMS-ARMD-125', 7, NULL, 'Windows 10 Pro', 1, NULL, 1, '[\"11\"]', NULL, NULL, NULL, NULL, 'AMD', 7, 4, 8, NULL, NULL, 0, '[]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, '[]', '2026-07-02', NULL, NULL, 1, NULL),
(51, 59, 0, 'ITMS-ARMD-107', 7, NULL, 'Windows 11 Pro', 0, NULL, 1, '[\"11\"]', NULL, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, NULL, NULL, 0, '[]', NULL, NULL, 'Other', 1, NULL, '[]', '2026-07-02', NULL, NULL, 1, NULL),
(52, 60, 0, 'ITMS-ARMD-112', 7, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"11\"]', NULL, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, NULL, NULL, 0, '[]', NULL, NULL, 'Other', 1, NULL, '[]', '2026-07-02', NULL, NULL, 1, NULL),
(53, 61, 0, 'ITMS-ARMD-108', 7, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"11\"]', NULL, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, NULL, NULL, 0, '[]', NULL, NULL, 'Other', 1, NULL, '[]', '2026-07-02', NULL, NULL, 1, NULL),
(54, 62, 0, 'ITMS-ARMD-111', 7, NULL, 'Windows 11 Home Single Language', 1, NULL, 1, '[\"11\"]', NULL, NULL, NULL, NULL, 'Intel i5', 11, 6, 8, NULL, NULL, 0, '[]', NULL, NULL, 'Microsoft Office Professional Plus 2016', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(55, 64, 0, 'ITMS-ARMD-92', 7, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"11\"]', NULL, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, NULL, NULL, 0, '[]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, '[]', '2026-07-02', NULL, NULL, 1, NULL),
(56, 65, 0, 'ITMS-ARMD-126', 7, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"11\"]', NULL, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, NULL, NULL, 0, '[]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(57, 67, 0, 'ITMS-ARMD-114', 7, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"11\"]', NULL, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, NULL, NULL, 0, '[]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(58, 67, 0, 'ITMS-ARMD-121', 7, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\",\"4\",\"11\"]', 3, NULL, NULL, NULL, 'Intel i5', 11, 6, 8, 'AUS', 22, 3, '[{\"name\":\"aoparis\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft 365 Apps for Enterprise', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(59, 68, 0, 'ITMS-ARMD-99', 7, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"11\"]', NULL, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, NULL, NULL, 0, '[]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(60, 69, 0, 'ITMS-ARMD-105', 7, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"11\"]', NULL, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, NULL, NULL, 0, '[]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(61, 71, 0, 'ITMS-ARMD-115', 7, NULL, 'Windows 10 Pro', 1, NULL, 1, '[\"2\",\"4\",\"8\"]', 3, NULL, NULL, NULL, 'intel i7', 7, 4, 8, 'acer', 19, 3, '[{\"name\":\"ARMD\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft 365 Apps for Enterprise', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(62, 84, 0, 'ITMS-ISSD-0014 ', 3, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"4\",\"9\"]', 2, NULL, NULL, NULL, 'intel i5', 12, 6, 16, 'acer', 24, 3, '[{\"name\":\"rsonil\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(63, 85, 0, 'ITMS-ISSD-19', 3, NULL, 'Windows 11 Home Single Language', 1, NULL, 1, '[\"2\",\"4\",\"8\",\"11\"]', 4, NULL, NULL, NULL, 'intel i5', 12, 6, 16, 'HPN', 24, 3, '[{\"name\":\"jpbantiyan\",\"type\":\"Admin\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"Guest User\",\"type\":\"User\"}]', NULL, NULL, 'Microsoft Office Home & Student 2021', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(64, 86, 0, ' ITMS-ISSD-0010 ', 3, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"8\",\"9\"]', 2, NULL, NULL, NULL, 'intel i5', 12, 6, 16, 'acer', 24, 4, '[{\"name\":\"mamsalaya\",\"type\":\"User\"},{\"name\":\"PNP-ITMS\",\"type\":\"Admin\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(65, 72, 0, 'ITMS-ISSD-0020', 3, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\",\"6\",\"8\",\"9\"]', 4, NULL, NULL, NULL, 'intel i5', 12, 6, 16, 'acer', 24, 4, '[{\"name\":\"accaballa\",\"type\":\"User\"},{\"name\":\"nssantos\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(66, 73, 0, 'ITMS-ISSD-0012', 3, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"8\",\"9\"]', 2, NULL, NULL, NULL, 'intel i5', 12, 6, 16, 'acer', 24, 2, '[{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(67, 77, 0, ' ITMS-ISSD-0017', 3, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\",\"4\",\"8\",\"9\"]', 4, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', 24, 3, '[{\"name\":\"laalfabeto\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(68, 79, 0, 'ITMS-ISSD-0011', 3, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"8\",\"9\"]', 2, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', 24, 3, '[{\"name\":\"mtbillote\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(69, 80, 0, 'ITMS-ISSD-0022', 3, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"8\",\"9\"]', NULL, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', 24, 0, '[]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(70, 83, 0, ' ITMS-ISSD-0023', 3, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"9\"]', 1, NULL, NULL, NULL, 'Intel i5', 14, 10, 16, 'XCC', 24, 4, '[{\"name\":\"accaballa\",\"type\":\"User\"},{\"name\":\"mjdeguzman\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office Home 2024', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(71, 81, 0, ' ITMS-ISSD-28', 3, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"4\",\"8\"]', 2, NULL, NULL, NULL, 'Intel i7', 11, 8, 16, 'Acer', 23, 5, '[{\"name\":\"ISSD\",\"type\":\"Admin\"},{\"name\":\"pfdimaculangan\",\"type\":\"User\"},{\"name\":\"rrmananon\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft 365 Apps for Enterprise', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(72, 78, 0, 'ITMS-ISSD-0021', 3, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\",\"4\",\"8\"]', 3, NULL, NULL, NULL, 'Intel i5', 11, 8, 16, 'Acer', 23, 3, '[{\"name\":\"mgmorales\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft 365 Apps for Enterprise', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(73, 82, 0, ' ITMS-ISSD-0015', 3, NULL, 'Windows 11 Pro', 0, NULL, 1, '[\"8\",\"9\"]', 2, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', 24, 4, '[{\"name\":\"ljpansoy\",\"type\":\"User\"},{\"name\":\"PNP-ITMS\",\"type\":\"Admin\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(74, 74, 0, 'ITMS-ISSD-0018', 3, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"6\",\"8\",\"9\"]', 3, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', 24, 3, '[{\"name\":\"gtsocorro\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(75, 76, 0, 'ITMS-ISSD-0013', 3, NULL, 'Windows 11 Home Single Language', 1, NULL, 0, '[\"1\",\"2\",\"4\",\"8\"]', NULL, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'HPN HP', 24, 5, '[{\"name\":\"ISSD-ADMIN\",\"type\":\"Admin\"},{\"name\":\"admin\",\"type\":\"Admin\"},{\"name\":\"lltorrano\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office Home & Student 2021', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(76, 75, 0, 'ITMS-ISSD-0016', 3, NULL, 'Windows 11 Home Single Language', 1, NULL, 1, '[\"4\",\"8\"]', 2, NULL, NULL, NULL, 'Intel i5', 12, 6, 8, 'HP W2072a', 20, 3, '[{\"name\":\"ISSD\",\"type\":\"Admin\"},{\"name\":\"jvvillavicencio\",\"type\":\"User\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft 365 Apps for Enterprise', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(77, 87, 0, 'ITMS-ISSD-VA', 3, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\",\"4\",\"8\",\"9\"]', 4, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', 22, 3, '[{\"name\":\"issdadmin\",\"type\":\"Admin\"},{\"name\":\"knfrias\",\"type\":\"User\"},{\"name\":\"nbbuensuceso\",\"type\":\"User\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(78, 108, 0, ' ITMS-PSMU-0030 ', 6, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"4\",\"8\"]', 2, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', 24, 3, '[{\"name\":\"rbcelario\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft 365 Apps for Enterprise', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(79, 107, 0, ' ITMS-OCS-65', 6, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"1\",\"2\",\"4\",\"8\",\"9\"]', 5, NULL, NULL, NULL, 'Intel i3', 12, 4, 8, 'Acer', 24, 3, '[{\"name\":\"cvsang-an\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(80, 92, 0, ' ITMS-DMD-0037', 6, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\",\"4\",\"8\",\"9\"]', 4, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', 25, 3, '[{\"name\":\"gebalucanag\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(81, 94, 0, 'ITMS-DMD-0016', 6, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\",\"4\",\"8\",\"9\"]', 4, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', 24, 4, '[{\"name\":\"admin\",\"type\":\"Admin\"},{\"name\":\"DMD HRMIS\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(82, 101, 0, ': ITMS-DMD-0028 ', 6, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"9\"]', 1, NULL, NULL, NULL, 'Intel i5', 14, 10, 16, 'XCC', 24, 3, '[{\"name\":\"rcdelacruz\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office Home 2024', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(83, 97, 0, ' ITMS-DMD-0039', 6, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\",\"4\",\"8\",\"9\"]', 4, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', 24, 3, '[{\"name\":\"jvdimaculangan\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(84, 98, 0, ' ITMS-DMD-0019', 6, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\",\"4\",\"8\",\"9\"]', 4, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', 24, 1, '[{\"name\":\"madomingo\",\"type\":\"User\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(85, 105, 0, ' ITMS-DMD-0026 ', 6, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\",\"8\",\"9\"]', 3, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', 24, 4, '[{\"name\":\"mdenriquez\",\"type\":\"User\"},{\"name\":\"itmsitsdsuperuser\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Other', 1, NULL, '[]', '2026-07-02', NULL, NULL, 1, NULL),
(86, 93, 0, 'ITMS-DMD-0042 ', 6, NULL, 'Windows 11 Home Single Language', 1, NULL, 1, '[\"4\",\"8\"]', 2, NULL, NULL, NULL, 'Intel i5', 6, 4, 8, 'Acer', 19, 4, '[{\"name\":\"NUP Jane S Galban\",\"type\":\"User\"},{\"name\":\"ITSD\",\"type\":\"Admin\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office Professional Plus 2019', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(87, 102, 0, 'ITMS-LS-211', 6, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"11\"]', NULL, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, NULL, NULL, 0, '[]', NULL, NULL, 'Microsoft Office Home & Student 2021', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(88, 103, 0, ' ITMS-DMD-0022', 6, NULL, 'Windows 11 Pro', 0, NULL, 1, '[\"2\",\"8\",\"9\"]', 2, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', 24, 3, '[{\"name\":\"rimadayag\",\"type\":\"User\"},{\"name\":\"su\",\"type\":\"Admin\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(89, 96, 0, ' ITMS-DMD-0038', 6, NULL, 'Windows 11 Pro', 1, NULL, 0, '[\"4\",\"8\"]', 2, NULL, NULL, NULL, 'Intel i5', 12, 6, 8, 'Acer', 22, 3, '[{\"name\":\"jremesa\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office Home & Student 2021', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(90, 88, 0, 'ITMS-DMD-0015', 6, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"4\",\"8\"]', 2, NULL, NULL, NULL, 'Intel i5', 12, 6, 8, 'Acer', 24, 4, '[{\"name\":\"mmfmulano\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"},{\"name\":\"clolivar\",\"type\":\"User\"}]', NULL, NULL, 'Microsoft Office Home & Student 2021', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(91, 100, 0, ' ITMS-DMD-0032 ', 6, NULL, 'Windows 11 Pro', 0, NULL, 0, '[\"4\",\"8\"]', 2, NULL, NULL, NULL, 'Intel i5', 12, 6, 8, 'Acer', 22, 3, '[{\"name\":\"rmongkingco\",\"type\":\"User\"},{\"name\":\"SAS ADMIN\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office Home & Student 2021', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(92, 104, 0, ' ITMS-DMD-0036', 6, NULL, 'Windows 11 Home Single Language', 1, NULL, 1, '[\"2\",\"4\",\"6\"]', 3, NULL, NULL, NULL, 'Intel i5', 13, 10, 8, 'Acer', 22, 3, '[{\"name\":\"srpastor\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(93, 99, 0, ' ITMS-DMD-0020', 6, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"4\",\"8\"]', 2, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', 24, 2, '[{\"name\":\"preci\",\"type\":\"User\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(94, 106, 0, ' ITMS-DMD-0024', 6, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"1\",\"2\",\"4\"]', 3, NULL, NULL, NULL, 'Intel i7', 8, 6, 16, 'Lenovo', 22, 3, '[{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"},{\"name\":\"waramos\",\"type\":\"User\"}]', NULL, NULL, 'Microsoft 365 Apps for Enterprise', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(95, 89, 0, 'ITMS-DMD-0023', 6, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\",\"4\",\"9\"]', 3, NULL, NULL, NULL, 'Intel i5', 112, 6, 16, 'Acer', 24, 2, '[{\"name\":\"dbraymundo\",\"type\":\"User\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(96, 91, 0, ': ITMS-DMD-0029 ', 6, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"9\"]', 1, NULL, NULL, NULL, 'Intel i5', 14, 10, 16, 'XCC XPN', 24, 3, '[{\"name\":\"gcrecuenco\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office Home 2024', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(97, 90, 0, ' ITMS-DMD-0010', 6, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"4\",\"8\",\"9\"]', 3, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', 24, 4, '[{\"name\":\"dtvillamin\",\"type\":\"User\"},{\"name\":\"PNP-ITMS\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, '[]', '2026-07-02', NULL, NULL, 1, NULL),
(98, 95, 0, 'ITMS-DMD-0018', 6, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"9\"]', 1, NULL, NULL, NULL, 'Intel i5', 14, 10, 16, 'XCC XPN', 24, 3, '[{\"name\":\"jbvillas\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office Home 2024', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(99, 123, 0, 'ITMS-SMD-0025', 2, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"4\",\"8\",\"9\"]', 3, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', 24, 4, '[{\"name\":\"PNP-ITMS\",\"type\":\"Admin\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"ktulpindo\",\"type\":\"User\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(100, 111, 0, ' ITMS-SMD-0027', 2, NULL, 'Windows 11 Home Single Language', 1, NULL, 1, '[\"2\",\"4\",\"8\"]', NULL, NULL, NULL, NULL, 'Intel i7', 10, 8, 8, 'HPN HP', 24, 4, '[{\"name\":\"admin\",\"type\":\"Admin\"},{\"name\":\"afacuesta\",\"type\":\"User\"},{\"name\":\"su\",\"type\":\"Admin\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft 365 Apps for Enterprise', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(101, 120, 0, 'ITMS-SMD-0031', 2, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"8\"]', 1, NULL, NULL, NULL, 'Intel i7', 10, 8, 16, 'Dell', 23, 3, '[{\"name\":\"NUP Paul D Agripa\",\"type\":\"Admin\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Other', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(102, 113, 0, ' ITMS-SMD-0016', 2, NULL, 'Windows 11 Pro', 1, NULL, 0, '[\"8\",\"9\"]', 2, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', 24, 4, '[{\"name\":\"aalmarchar\",\"type\":\"User\"},{\"name\":\"PNP-ITMS\",\"type\":\"Admin\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(103, 117, 0, ' ITMS-SMD-182', 2, NULL, 'Windows 10 Home Single Language', 1, NULL, 1, '[\"4\"]', 1, NULL, NULL, NULL, 'Intel i5', 6, 4, 8, 'LENOVO LEN', 19, 2, '[{\"name\":\"maarce\",\"type\":\"\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office Professional Plus 2013', 1, NULL, '[]', '2026-07-02', NULL, NULL, 1, NULL),
(104, 119, 0, ' ITMS-SMD-0024', 2, NULL, 'Windows 11 Home Single Language', 1, NULL, 1, '[\"2\",\"3\",\"8\"]', 3, NULL, NULL, NULL, 'Intel i7', 9, 8, 8, 'HPN HP', 24, 3, '[{\"name\":\"mdcabañas\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft 365 Apps for Enterprise', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(105, 110, 0, ' ITMS-SMD-0022', 2, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"8\",\"9\"]', 2, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', 24, 4, '[{\"name\":\"apdelacruz\",\"type\":\"User\"},{\"name\":\"PNP-ITMS\",\"type\":\"Admin\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(106, 115, 0, ' ITMS-SMD-0011', 2, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"8\",\"9\"]', 2, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', 24, 3, '[{\"name\":\"dvparanada\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(107, 118, 0, 'ITMS-SMD-0030', 2, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"8\",\"9\"]', 2, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', 24, 4, '[{\"name\":\"msmallillin\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"smd admin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(108, 109, 0, ': ITMS-SMD-0019', 2, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"8\",\"9\"]', 2, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', 24, 2, '[{\"name\":\"PNP-ITMS\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(109, 114, 0, 'ITMS-SMD-185', 2, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"8\",\"9\"]', 2, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', 24, 2, '[{\"name\":\"PNP-ITMS\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(110, 112, 0, 'ITMS-SMD-0029 ', 2, NULL, 'Windows 11 Pro', 1, NULL, 0, '[\"8\",\"9\"]', 2, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', 24, 3, '[{\"name\":\"aaridulme\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(111, 121, 0, 'ITMS-SMD-0017 ', 2, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"9\"]', 2, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', 24, 1, '[{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, '[]', '2026-07-02', NULL, NULL, 1, NULL),
(112, 122, 0, ' ITMS-SMD-0023', 2, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"4\",\"11\"]', 2, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'LENOVO LEN', 20, 3, '[{\"name\":\"PNP-ITMS\",\"type\":\"Admin\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office Professional 2021', 1, NULL, NULL, '2026-07-02', NULL, NULL, 1, NULL),
(113, 124, 0, 'PTDLAB-01', 8, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\",\"4\"]', 2, NULL, NULL, NULL, 'AMD Ryzen 7', 4, 8, 16, 'Lenovo S22e-20', 22, 2, '[{\"name\":\"PTDLAB 01\",\"type\":\"Admin\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft 365 Apps for Enterprise', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(114, 125, 0, 'PTDLAB-02', 8, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\"]', 1, NULL, NULL, NULL, 'AMD Ryzen 7', 4, 8, 16, 'Lenovo S22e-20', 22, 3, '[{\"name\":\"ADMIN\",\"type\":\"Admin\"},{\"name\":\"PTDLAB 02\",\"type\":\"Admin\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft 365 Personal', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(115, 126, 0, 'PTDLAB-03', 8, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"11\"]', NULL, NULL, NULL, NULL, 'AMD Ryzen 7', 4, 8, 16, NULL, NULL, 0, '[]', NULL, NULL, 'Microsoft 365 Apps for Enterprise', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(116, 127, 0, 'PTDLAB-04', 8, NULL, 'Windows 11 Pro', 1, NULL, 0, '[\"2\",\"8\"]', 2, NULL, NULL, NULL, 'AMD Ryzen 7', 4, 8, 16, 'Lenovo S22e-20', 22, 4, '[{\"name\":\"ADMN\",\"type\":\"Admin\"},{\"name\":\"PTDLAB-04\",\"type\":\"Admin\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft 365 Apps for Enterprise', 1, NULL, '[]', '2026-07-03', NULL, NULL, 1, NULL),
(117, 128, 0, 'PTDLAB-05', 8, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\",\"8\"]', 2, NULL, NULL, NULL, 'AMD Ryzen 7', 4, 8, 16, 'Lenovo S22e-20', 22, 4, '[{\"name\":\"ADMIN\",\"type\":\"Admin\"},{\"name\":\"PTDLAB-05\",\"type\":\"Admin\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft 365 Apps for Enterprise', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(118, 129, 0, 'PTDLAB-06', 8, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\",\"8\"]', 2, NULL, NULL, NULL, 'AMD Ryzen 7', 4, 8, 16, 'Lenovo S22e-20', 22, 4, '[{\"name\":\"admin\",\"type\":\"Admin\"},{\"name\":\"PTDLAB-06\",\"type\":\"Admin\"},{\"name\":\"SAS\",\"type\":\"Admin\"},{\"name\":\"SU\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(119, 130, 0, 'ITMS-PTDLAB-07', 8, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\",\"8\"]', 2, NULL, NULL, NULL, 'AMD Ryzen 7', 4, 8, 16, 'Lenovo S22e-20', 22, 3, '[{\"name\":\"ADMIN\",\"type\":\"Admin\"},{\"name\":\"PTDLAB-01\",\"type\":\"Admin\"},{\"name\":\"SASADMIN\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office Home & Business 2021', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(120, 131, 0, 'ITMS-PTDLAB-08', 8, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\",\"8\"]', 2, NULL, NULL, NULL, 'AMD Ryzen 7', 4, 8, 16, 'Lenovo S22e-20', 22, 3, '[{\"name\":\"ADMIN\",\"type\":\"Admin\"},{\"name\":\"PTDLAB 2\",\"type\":\"Admin\"},{\"name\":\"SASADMIN\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office Home & Business 2021', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(121, 132, 0, 'PTDLAB-011', 8, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\"]', 1, NULL, NULL, NULL, 'AMD Ryzen 7', 4, 8, 16, 'Lenovo S22e-20', 22, 1, '[{\"name\":\"SAS ADMIN\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(122, 133, 0, 'ITMS-PTDLAB-012', 8, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\"]', 1, NULL, NULL, NULL, 'AMD Ryzen 7', 4, 8, 16, 'Lenovo S22e-20', 22, 4, '[{\"name\":\"ADMIN\",\"type\":\"Admin\"},{\"name\":\"PTDLAB-13\",\"type\":\"User\"},{\"name\":\"SASADMIN\",\"type\":\"Admin\"},{\"name\":\"SU\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office Home & Student 2019', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(123, 134, 0, 'PTDLAB-13', 8, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\",\"8\"]', NULL, NULL, NULL, NULL, 'AMD Ryzen 7', 4, 8, 16, 'Lenovo S22e-20', 22, 3, '[{\"name\":\"ADMIN\",\"type\":\"Admin\"},{\"name\":\"PTDLAB-14\",\"type\":\"User\"},{\"name\":\"SAS ADMIN\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(124, 135, 0, 'ITMS-PTDLAB-16', 8, NULL, 'Windows 10 Pro', 1, NULL, 1, '[\"2\"]', 1, NULL, NULL, NULL, 'AMD A8 PRO', 7, 4, 8, 'HP V193b', 19, 1, '[{\"name\":\"PTDLAB 16\",\"type\":\"User\"}]', NULL, NULL, 'Other', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(125, 136, 0, 'PTDLAB-18', 8, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\"]', 1, NULL, NULL, NULL, 'AMD Ryzen 7', 4, 8, 16, 'Lenovo S22e-20', 22, 3, '[{\"name\":\"ADMIN\",\"type\":\"Admin\"},{\"name\":\"PTDLAB 018\",\"type\":\"User\"},{\"name\":\"SASADMIN\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(126, 137, 0, 'PTDLAB-019', 8, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\",\"4\",\"8\"]', 3, NULL, NULL, NULL, 'AMD Ryzen 7', 4, 8, 16, 'Lenovo S22e-20', 22, 4, '[{\"name\":\"ADMIN\",\"type\":\"Admin\"},{\"name\":\"PTDLAB-19\",\"type\":\"User\"},{\"name\":\"SAS ADMIN\",\"type\":\"Admin\"},{\"name\":\"SU\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft 365 Apps for Enterprise', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(127, 138, 0, 'PTDLAB-020', 8, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\"]', 1, NULL, NULL, NULL, 'AMD Ryzen 7', 4, 8, 16, 'Lenovo S22e-20', 22, 4, '[{\"name\":\"ADMIN\",\"type\":\"Admin\"},{\"name\":\"PTDLAB-24\",\"type\":\"User\"},{\"name\":\"SASADMIN\",\"type\":\"Admin\"},{\"name\":\"SU\",\"type\":\"Admin\"}]', NULL, NULL, 'Other', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(128, 139, 0, 'ITMS-PTDLAB-14', 8, NULL, 'Windows 10 Pro', 1, NULL, 1, '[\"2\",\"4\",\"8\"]', 3, NULL, NULL, NULL, 'AMD Ryzen 7', 4, 8, 16, 'Lenovo S22e-20', 22, 4, '[{\"name\":\"ADMIN\",\"type\":\"Admin\"},{\"name\":\"PTDLAB-16\",\"type\":\"User\"},{\"name\":\"SASADMIN\",\"type\":\"Admin\"},{\"name\":\"SU\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft 365 Apps for Enterprise', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(129, 150, 0, 'ITMS-PTD-30', 5, NULL, 'Windows 11 Home Single Language', 1, NULL, 1, '[\"2\",\"3\"]', 2, NULL, NULL, NULL, 'Intel i5', 13, 10, 8, 'Acer', 22, 3, '[{\"name\":\"SASADMIN\",\"type\":\"Admin\"},{\"name\":\"SU\",\"type\":\"Admin\"},{\"name\":\"RIAGUSTIN\",\"type\":\"User\"}]', NULL, NULL, 'Other', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(130, 151, 0, 'ITMS-PTD-0029', 5, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"11\"]', NULL, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, NULL, NULL, 0, '[]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(131, 143, 0, 'ITMS-PTD-0014', 5, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\",\"3\",\"8\",\"9\"]', 4, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, NULL, NULL, 3, '[{\"name\":\"admin\",\"type\":\"Admin\"},{\"name\":\"grargete\",\"type\":\"User\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(132, 141, 0, ' ITMS-PTD-0020', 5, NULL, 'Windows 11 Home Single Language', 1, NULL, 1, '[\"2\",\"3\"]', 2, NULL, NULL, NULL, 'Intel i5', 13, 10, 8, 'Acer', 22, 5, '[{\"name\":\"acer\",\"type\":\"User\"},{\"name\":\"admin\",\"type\":\"User\"},{\"name\":\"carroyo\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft 365 Apps for Enterprise', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(133, 144, 0, 'ITMS-PTD-0018 ', 5, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"8\",\"9\"]', NULL, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', 24, 2, '[{\"name\":\"kcdomingo\",\"type\":\"User\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(134, 148, 0, ' ITMS-PTD-0022', 5, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"8\",\"9\"]', 2, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', 24, 4, '[{\"name\":\"PNP-ITMS\",\"type\":\"Admin\"},{\"name\":\"remagbanua\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL);
INSERT INTO `desktops` (`id`, `personnel_id`, `device_id`, `device_name`, `division_id`, `ip_address`, `os`, `is_os_licensed`, `os_license_key`, `is_remote_acc`, `endpoint_security_id`, `no_of_installed_anti_virus`, `date_installed`, `guid`, `mac_address`, `cpu_brand`, `cpu_generation`, `cpu_cores`, `gb_ram`, `monitor_brand`, `monitor_size_inches`, `no_of_user_accounts`, `user_account_type`, `authorized_software`, `unauthorized_software`, `office_application`, `is_office_licensed`, `office_license_key`, `previous_owners_id`, `created_date`, `last_updated_at`, `par_serial_no`, `is_active`, `acquisition_date`) VALUES
(135, 140, 0, ': ITMS-PTD-0016', 5, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"8\",\"9\"]', 2, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', 24, 3, '[{\"name\":\"cgorevillo\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(136, 145, 0, 'ITMS-PTD-0017', 5, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"11\"]', NULL, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, NULL, NULL, 0, '[]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(137, 149, 0, 'ITMS-PTD-0019', 5, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\",\"4\",\"8\",\"9\"]', 4, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Lenovo S22e-20', 22, 1, '[{\"name\":\"Srpenaverde\",\"type\":\"User\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(138, 142, 0, ' ITMS-PTD-0012', 5, NULL, 'Windows 11 Pro', 1, NULL, 0, '[\"8\",\"9\"]', 2, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', 24, 3, '[{\"name\":\"faperezs\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(139, 147, 0, 'ITMS-PTD-0025 ', 5, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\",\"4\"]', 2, NULL, NULL, NULL, 'Intel i5', 12, 4, 8, 'Acer', 24, 1, '[{\"name\":\"ptsampana\",\"type\":\"User\"}]', NULL, NULL, 'Microsoft 365 Apps for Enterprise', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(140, 146, 0, ' ITMS-PTD-0028', 5, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"8\",\"9\"]', 2, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', 24, 1, '[{\"name\":\"mgtallongan\",\"type\":\"User\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(141, 157, 0, ' ITMS-LS-0017', 11, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\",\"4\",\"8\",\"9\"]', 4, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', 24, 4, '[{\"name\":\"admin\",\"type\":\"Admin\"},{\"name\":\"jlaquino\",\"type\":\"User\"},{\"name\":\"sas admin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(142, 156, 0, ' ITMS-LS-0015', 11, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"4\",\"8\",\"9\"]', 3, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', 24, 3, '[{\"name\":\"csramos\",\"type\":\"User\"},{\"name\":\"PNP-ITMS\",\"type\":\"Admin\"},{\"name\":\"SU\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft 365 Apps for Enterprise', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(143, 158, 0, 'ITMS-LS-0010 ', 11, NULL, 'Windows 11 Home Single Language', 1, NULL, 1, '[\"1\",\"2\",\"4\",\"8\"]', 4, NULL, NULL, NULL, 'Intel i7', 13, 16, 16, 'Acer', 24, 3, '[{\"name\":\"jgaguilar\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft 365 Apps for Enterprise', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(144, 155, 0, ' ITMS-LS-0011', 11, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\",\"4\",\"8\",\"9\"]', 4, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', 24, 3, '[{\"name\":\"astamanio\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(145, 153, 0, ' ITMS-LS-0012', 11, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\",\"4\",\"8\"]', 3, NULL, NULL, NULL, 'Intel i7', 10, 8, 16, 'Dell', 23, 4, '[{\"name\":\"admin\",\"type\":\"Admin\"},{\"name\":\"iebaticados\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(146, 154, 0, 'ITMS-LS-0016', 11, NULL, 'Windows 11 Pro for Workstations', 1, NULL, 1, '[\"1\",\"2\",\"6\",\"9\"]', 4, NULL, NULL, NULL, 'Intel i7', 11, 8, 16, 'Acer', 23, 3, '[{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"},{\"name\":\"tsbuitre\",\"type\":\"User\"}]', NULL, NULL, 'Microsoft Office Professional Plus 2019', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(147, 152, 0, 'ITMS-LS-0014', 11, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"11\"]', NULL, NULL, NULL, NULL, 'Intel i5', 14, 10, 16, NULL, NULL, 0, '[]', NULL, NULL, 'Microsoft Office Home 2024', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(148, 159, 0, 'ITMS-IHSS-0025', 12, NULL, 'Windows 10 Pro', 1, NULL, 0, '[\"2\",\"3\",\"8\"]', 3, NULL, NULL, NULL, 'AMD A8', 9, 4, 8, NULL, NULL, 3, '[{\"name\":\"IHSS\",\"type\":\"Admin\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"SU\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(149, 160, 0, 'ITMS-IHSS-0020', 12, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\",\"3\",\"8\",\"9\"]', 4, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', 24, 3, '[{\"name\":\"PNP-ITMS\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(150, 164, 0, ' ITMS-OCI-0012', 9, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\",\"4\",\"8\",\"9\"]', 4, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', 24, 1, '[{\"name\":\"SU\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(151, 165, 0, ' ITMS-OCI-0011', 9, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\",\"4\",\"8\",\"9\"]', NULL, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, NULL, NULL, 3, '[{\"name\":\"SU\",\"type\":\"Admin\"},{\"name\":\"RGCANJA\",\"type\":\"User\"},{\"name\":\"SASADMIN\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(152, 163, 0, ' ITMS-OCI-0013', 9, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\",\"4\",\"8\",\"9\"]', 4, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', 24, 3, '[{\"name\":\"SU\",\"type\":\"Admin\"},{\"name\":\"ZSCUASAY\",\"type\":\"User\"},{\"name\":\"SASADMIN\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(153, 162, 0, 'ITMS-OCI-0010 ', 9, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\",\"4\",\"8\",\"9\"]', 4, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', 24, 1, '[{\"name\":\"SU\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(154, 161, 0, 'ITITMS-OCI-OLCIMS ', 9, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"8\",\"9\"]', NULL, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', 24, 3, '[{\"name\":\"MRVER\",\"type\":\"User\"},{\"name\":\"PNP-ITMS\",\"type\":\"Admin\"},{\"name\":\"SU\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(155, 166, 0, 'NETWORK-MONITOR', 15, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"11\"]', NULL, NULL, NULL, NULL, 'Intel i7', 10, 8, 16, NULL, NULL, 0, '[]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(156, 167, 0, ' ITMS-BFS-79 ', 13, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"9\"]', 1, NULL, NULL, NULL, 'Intel i5', 14, 10, 16, 'XCC XPN', 24, 3, '[{\"name\":\"jsalcantara\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office Home 2024', 1, NULL, '[]', '2026-07-03', NULL, NULL, 1, NULL),
(157, 168, 0, 'ITMS-BFO-77', 13, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"4\",\"8\"]', 2, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'LENOVO LEN', 19, 3, '[{\"name\":\"NUP Mateo\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office Professional 2021', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(158, 170, 0, ' ITMS-BFS-83', 13, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"8\",\"9\"]', 2, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', 24, 1, '[{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(159, 169, 0, 'ITMS-BFS-80', 13, NULL, 'Windows 11 Home Single Language', 1, NULL, 1, '[\"2\",\"4\",\"8\"]', NULL, NULL, NULL, NULL, 'Intel i7', 12, 12, 16, 'Acer', 24, 1, '[{\"name\":\"scrumba\",\"type\":\"User\"}]', NULL, NULL, 'Microsoft Office Home & Student 2021', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(160, 171, 0, 'ITMS-ARMD-97', 10, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"11\"]', NULL, NULL, NULL, NULL, 'Intel i5', NULL, 6, 16, NULL, NULL, 0, '[]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, '[]', '2026-07-03', NULL, NULL, 1, NULL),
(161, 172, 0, ' ITMS-ARMD-98', 7, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\",\"4\",\"8\"]', 3, NULL, NULL, NULL, 'Intel i5', 11, 8, 32, 'Samsung', 27, 3, '[{\"name\":\"pcalvarez\",\"type\":\"Admin\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office Professional 2021', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(162, 176, 0, 'ITMS-ITPMD-0028', 4, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"11\"]', NULL, NULL, NULL, NULL, 'Intel i7', 11, 8, 16, NULL, NULL, 0, '[]', NULL, NULL, 'Microsoft 365 Apps for Enterprise', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(163, 177, 0, 'ITMS-ITPMD-0020', 4, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"11\"]', NULL, NULL, NULL, NULL, 'Intel i7', 11, 8, 16, NULL, NULL, 0, '[]', NULL, NULL, 'Microsoft Office Professional 2021', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(164, 178, 0, ' ITMS-ITPMD-0027', 4, NULL, 'Windows 11 Home Single Language', 1, NULL, 1, '[\"1\",\"2\",\"4\",\"8\"]', 4, NULL, NULL, NULL, 'Intel i5', 13, 10, 8, 'Acer', 22, 4, '[{\"name\":\"ADMIN\",\"type\":\"Admin\"},{\"name\":\"MYDAGTA\",\"type\":\"User\"},{\"name\":\"SASADMIN\",\"type\":\"Admin\"},{\"name\":\"SU\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office Home & Student 2021', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(165, 179, 0, 'ITMS-ITPMD-0023', 4, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"11\"]', NULL, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, NULL, NULL, 0, '[]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(166, 180, 0, 'ITMS-ITPMD-0021', 4, NULL, 'Windows 11 Home Single Language', 1, NULL, 1, '[\"2\",\"4\",\"8\",\"9\"]', 4, NULL, NULL, NULL, 'Intel i5', 13, 10, 8, 'Acer', 22, 4, '[{\"name\":\"SASADMIN\",\"type\":\"Admin\"},{\"name\":\"SU\",\"type\":\"Admin\"},{\"name\":\"ACER\",\"type\":\"Admin\"},{\"name\":\"RCMANAOG\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office Home & Student 2021', 1, NULL, '[]', '2026-07-03', NULL, NULL, 1, NULL),
(167, 175, 0, 'ITMS-ITPMD-0024', 4, NULL, 'Windows 11 Home Single Language', 1, NULL, 1, '[\"2\",\"8\",\"11\"]', 3, NULL, NULL, NULL, 'Intel i5', 11, 6, 8, 'AUS', 22, 3, '[{\"name\":\"EMSIT\",\"type\":\"Admin\"},{\"name\":\"SASADMIN\",\"type\":\"Admin\"},{\"name\":\"SU\",\"type\":\"Admin\"}]', NULL, NULL, 'Other', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(168, 174, 0, 'Itms-itpmd-olci', 4, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"8\",\"9\"]', 2, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', 22, 3, '[{\"name\":\"ITMS-ITPMD-OLCIMS\",\"type\":\"User\"},{\"name\":\"SASADMIN\",\"type\":\"Admin\"},{\"name\":\"SU\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(169, 173, 0, ' ITMS-ITPMD-0025', 4, NULL, 'Windows 11 Home Single Language', 1, NULL, 1, '[\"2\",\"4\",\"8\",\"11\"]', 4, NULL, NULL, NULL, 'Intel i5', 11, 6, 8, 'HP', 22, 3, '[{\"name\":\"ITMS-ITPMD-HQs\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft 365 Apps for Enterprise', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(170, 181, 0, 'DESKTOP-LHRDGO6', 4, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"11\"]', NULL, NULL, NULL, NULL, 'Intel i5', 7, 4, 8, NULL, NULL, 0, '[]', NULL, NULL, 'Microsoft 365 Apps for Enterprise', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(171, 182, 0, 'ITMS-ITPMD-0022', 4, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\",\"4\",\"8\",\"9\"]', 4, NULL, NULL, NULL, 'Intel i3', 12, 4, 16, 'Acer', 24, 1, '[{\"name\":\"ITPMD2\",\"type\":\"User\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(172, 183, 0, 'ITMS-ITSD-0031', 1, NULL, 'Windows 10 Pro', 1, NULL, 1, '[\"2\",\"4\",\"8\",\"10\"]', 4, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', 24, 3, '[{\"name\":\"ebnavarro\",\"type\":\"Admin\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft 365 Apps for Enterprise', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(174, 184, 0, 'ITMS-PTD-0013', 5, NULL, 'Windows 11 Pro', 0, NULL, 1, '[\"4\",\"8\",\"9\"]', 3, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', 24, 1, '[{\"name\":\"llgunnacao\",\"type\":\"User\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, '[]', '2026-07-03', NULL, NULL, 1, NULL),
(175, 185, 0, 'ITMS-SMD-0028', 2, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\",\"4\",\"8\"]', 3, NULL, NULL, NULL, 'Intel i5', 8, 6, 16, 'Acer', 22, 3, '[{\"name\":\"azlanuza\",\"type\":\"Admin\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft 365 Apps for Enterprise', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(176, 186, 0, 'PTDLAB-015', 8, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\",\"4\",\"8\"]', 3, NULL, NULL, NULL, 'AMD Ryzen 7', 4, 8, 16, 'Lenovo S22e-20', 22, 2, '[{\"name\":\"PTDLAB 015\",\"type\":\"Admin\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft 365 Apps for Enterprise', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(177, 187, 0, 'ITMS-DMD-0030', 6, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"4\",\"8\"]', 2, NULL, NULL, NULL, 'Intel i5', 12, 6, 8, 'Acer', 22, 3, '[{\"name\":\"MVVILLANUEVA\",\"type\":\"User\"},{\"name\":\"SAS ADMIN\",\"type\":\"Admin\"},{\"name\":\"SU\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office Home & Student 2021', 1, NULL, '[]', '2026-07-03', NULL, NULL, 1, NULL),
(178, 188, 0, 'ITMS-DMD-0025', 6, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"4\",\"8\",\"9\"]', 3, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', 24, 4, '[{\"name\":\"PNP-ITMS\",\"type\":\"Admin\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"},{\"name\":\"vspaz\",\"type\":\"User\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, '[]', '2026-07-03', NULL, NULL, 1, NULL),
(179, 189, 0, 'ITMS-ITPMD-0030', 4, NULL, 'Windows 11 Home Single Language', 1, NULL, 1, '[\"1\",\"2\",\"4\",\"8\"]', 4, NULL, NULL, NULL, 'Intel i5', 13, 10, 8, 'Acer', 23, 3, '[{\"name\":\"escabading\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office Home & Student 2021', 1, NULL, '[]', '2026-07-03', NULL, NULL, 1, NULL),
(180, 190, 0, ' ITMS-ODDA-58', 7, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\",\"3\",\"8\",\"9\"]', 4, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', 24, 4, '[{\"name\":\"csbarquin\",\"type\":\"User\"},{\"name\":\"fssemilla\",\"type\":\"User\"},{\"name\":\"SASADMIN\",\"type\":\"Admin\"},{\"name\":\"SU\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(181, 191, 0, ' ITMS-ODDA-56', 7, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"9\"]', 1, NULL, NULL, NULL, 'Intel i5', 14, 10, 16, 'XCC XPN', 24, 3, '[{\"name\":\"Jferibal\",\"type\":\"User\"},{\"name\":\"SASADMIN\",\"type\":\"Admin\"},{\"name\":\"SU\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office Home & Business 2019', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(182, 192, 0, ': ITMS-ODDA-57', 7, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"8\",\"9\"]', 2, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', 24, 5, '[{\"name\":\"ddaadmin\",\"type\":\"Admin\"},{\"name\":\"hachan\",\"type\":\"User\"},{\"name\":\"mcmarasigan\",\"type\":\"User\"},{\"name\":\"SASADMIN\",\"type\":\"Admin\"},{\"name\":\"SU\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(183, 193, 0, 'ITMS-OCS-64 ', 7, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"8\",\"9\"]', 2, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', 24, 3, '[{\"name\":\"Mfesteves\",\"type\":\"User\"},{\"name\":\"PNP-ITMS\",\"type\":\"Admin\"},{\"name\":\"SU\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(184, 194, 0, ' ITMS-OCS-69', 7, NULL, 'Windows 11 Home Single Language', 1, NULL, 1, '[\"2\",\"3\",\"8\"]', 3, NULL, NULL, NULL, 'Intel i5', 10, 6, 8, 'HPN HP', 22, 2, '[{\"name\":\"SASADMIB\",\"type\":\"Admin\"},{\"name\":\"SU\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office Professional 2021', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(185, 196, 0, 'ITMS-OD-53', 7, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"4\",\"8\",\"9\"]', 3, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', 24, 3, '[{\"name\":\"ADMIN\",\"type\":\"Admin\"},{\"name\":\"MFAVENDANO\",\"type\":\"Admin\"},{\"name\":\"SASADMIN\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(186, 195, 0, 'ITMS-OD-54', 7, NULL, 'Windows 11 Home Single Language', 1, NULL, 1, '[\"4\",\"8\",\"9\"]', 3, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', 24, 4, '[{\"name\":\"ADMIN\",\"type\":\"Admin\"},{\"name\":\"jgluzara\",\"type\":\"User\"},{\"name\":\"SAS ADMIN\",\"type\":\"Admin\"},{\"name\":\"SU\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office Home & Student 2019', 1, NULL, '[]', '2026-07-03', NULL, NULL, 1, NULL),
(187, 197, 0, 'ITMS-ODDIT-0041', 7, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"11\"]', NULL, NULL, NULL, NULL, 'Intel i5', 12, NULL, 16, NULL, NULL, 0, '[]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-03', NULL, NULL, 1, NULL),
(188, 198, 0, ' ITMS-ODDIT-0040 ', 7, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"8\",\"9\"]', 2, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', 24, 4, '[{\"name\":\"PNP-ITMS\",\"type\":\"Admin\"},{\"name\":\"RLBAGO\",\"type\":\"User\"},{\"name\":\"SASADMIN\",\"type\":\"Admin\"},{\"name\":\"SU\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, '[]', '2026-07-03', NULL, NULL, 1, NULL),
(189, 199, 0, 'ITMS-PTD-0026', 5, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"4\",\"8\",\"9\"]', 3, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', 24, 3, '[{\"name\":\"mcmarasigan\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-06', NULL, NULL, 1, NULL),
(190, 205, 0, 'ITMS-PTD-0023', 5, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"4\",\"8\",\"9\"]', 3, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', 24, 3, '[{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"},{\"name\":\"sbyago\",\"type\":\"User\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-06', NULL, NULL, 1, NULL),
(191, 200, 0, 'ITMS-PTD-0024', 5, NULL, 'Windows 11 Home Single Language', 1, NULL, 1, '[\"2\",\"3\"]', 2, NULL, NULL, NULL, 'Intel i5', 13, 10, 8, 'Acer', 22, 4, '[{\"name\":\"agarias\",\"type\":\"User\"},{\"name\":\"mmmoslares\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"SU\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft 365 Apps for Enterprise', 1, NULL, NULL, '2026-07-06', NULL, NULL, 1, NULL),
(192, 201, 0, 'ITMS-PTD-0021', 5, NULL, 'Windows 10 Pro', 1, NULL, 1, '[\"2\",\"4\",\"8\"]', 3, NULL, NULL, NULL, 'AMD', 7, 4, 8, ' HP', 19, 3, '[{\"name\":\"rrjorda\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, '-', 1, NULL, NULL, '2026-07-06', NULL, NULL, 1, NULL),
(193, 202, 0, 'ITMS-BFS-84', 13, NULL, 'Windows 11 Home Single Language', 1, NULL, 0, '[\"2\",\"8\"]', 2, NULL, NULL, NULL, 'Intel i7', 12, 12, 16, 'Acer', 24, 3, '[{\"name\":\"rguntalan\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"SU\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft 365 Apps for Enterprise', 1, NULL, '[]', '2026-07-06', NULL, NULL, 1, NULL),
(194, 210, 0, 'ITMS-SMD-0021', 2, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"6\",\"8\",\"9\"]', 3, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', 24, 1, '[{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-06', NULL, NULL, 1, NULL),
(195, 214, 0, ' ITMS-SMD-0026', 2, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"8\",\"9\"]', 2, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', 24, 3, '[{\"name\":\"PNP-ITMS\",\"type\":\"Admin\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-06', NULL, NULL, 1, NULL),
(196, 215, 0, 'DESKTOP-K0N0GCC ', 2, NULL, 'Windows 11 Pro', 1, NULL, 0, '[\"8\"]', 1, NULL, NULL, NULL, 'Intel i5', 7, 4, 12, 'HP 2011', 20, 1, '[{\"name\":\"SMD\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office Professional 2021', 1, NULL, NULL, '2026-07-06', NULL, NULL, 1, NULL),
(197, 211, 0, 'ITMS-SMD-0020', 2, NULL, 'Windows 10 Pro', 0, NULL, 1, '[\"4\",\"8\"]', 2, NULL, NULL, NULL, 'Intel i5', 6, 4, 8, NULL, NULL, 3, '[{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"SMD\",\"type\":\"User\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office Professional Plus 2019', 1, NULL, NULL, '2026-07-06', NULL, NULL, 1, NULL),
(198, 212, 0, 'ITMS-SMD-204', 2, NULL, 'Windows 10 Pro', 1, NULL, 1, '[\"3\"]', 1, NULL, NULL, NULL, 'Intel i5', 6, 4, 8, 'Acer', 19, 1, '[{\"name\":\"JTPACOL\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office Professional Plus 2019', 1, NULL, NULL, '2026-07-06', NULL, NULL, 1, NULL),
(199, 206, 0, ' ITMS-SMD-0010', 2, NULL, 'Windows 11 Pro', 1, NULL, 0, '[\"8\"]', 1, NULL, NULL, NULL, 'Intel i5', 12, 6, 16, 'Acer', 24, 4, '[{\"name\":\"SMD_PC\",\"type\":\"Admin\"},{\"name\":\"SU\",\"type\":\"Admin\"},{\"name\":\"jarinmando\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"}]', NULL, NULL, 'Other', 1, NULL, NULL, '2026-07-06', NULL, NULL, 1, NULL),
(200, 216, 0, 'ITMS-SMD-13', 2, NULL, 'Windows 11 Home Single Language', 1, NULL, 1, '[\"4\",\"8\"]', 2, NULL, NULL, NULL, 'Intel i7', 13, 16, 16, 'Acer', 24, 3, '[{\"name\":\"admin\",\"type\":\"Admin\"},{\"name\":\"jeral\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft 365 Apps for Enterprise', 1, NULL, '[]', '2026-07-12', NULL, NULL, 1, NULL),
(201, 121, 0, 'ITMS-SMD-173', 2, NULL, 'Windows 10 Home Single Language', 1, NULL, 1, '[\"11\"]', 1, NULL, NULL, NULL, NULL, 7, 2, 4, 'HP', 19, 3, '[{\"name\":\"ADMIN\",\"type\":\"Admin\"},{\"name\":\"BMembrere\",\"type\":\"User\"},{\"name\":\"SMDOJT\",\"type\":\"User\"}]', NULL, NULL, 'Microsoft 365 Apps for Enterprise', 1, NULL, '[]', '2026-07-12', NULL, NULL, 1, NULL),
(202, 221, 0, 'MPC-MAIN-PC', 17, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"11\"]', NULL, NULL, NULL, NULL, 'Intel i5', 12, 12, 32, NULL, NULL, 0, '[]', NULL, NULL, 'Microsoft Office Professional 2021', 1, NULL, NULL, '2026-07-12', NULL, NULL, 1, NULL),
(203, 0, 0, 'ITMS', 0, NULL, 'Windows 11 Home Single Language', 1, NULL, 1, '[\"11\"]', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, '[]', NULL, NULL, 'Microsoft 365 Personal', 1, NULL, NULL, '2026-07-12', NULL, NULL, 1, NULL),
(204, 219, 0, 'DESKTOP-RA1U6A7', 17, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"11\"]', NULL, NULL, NULL, NULL, NULL, 12, 6, 16, NULL, NULL, 2, '[{\"name\":\"SASADMIN\",\"type\":\"\"},{\"name\":\"SU\",\"type\":\"\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, '[]', '2026-07-12', NULL, NULL, 1, NULL),
(205, 220, 0, 'DESKTOP-57RBOCR', 17, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"11\"]', NULL, NULL, NULL, NULL, NULL, 12, 6, 16, NULL, NULL, 0, '[]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, '[]', '2026-07-12', NULL, NULL, 1, NULL),
(206, 223, 0, 'ITMS-BFS-78', 13, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\",\"4\",\"8\",\"9\",\"11\"]', 5, NULL, NULL, NULL, NULL, 12, 6, 16, 'Acer', 24, 3, '[{\"name\":\"evparedes\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-12', NULL, NULL, 1, NULL),
(207, 204, 0, 'ITMS-BFS-81', 13, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"4\",\"8\"]', 2, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Acer', 24, 3, '[{\"name\":\"ptpalisoc\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, '[]', '2026-07-12', NULL, NULL, 1, NULL),
(208, 226, 0, 'ITMS-ITPMD-0029', 4, NULL, 'Windows 11 Pro for Workstations', 1, NULL, 1, '[\"11\"]', NULL, NULL, NULL, NULL, NULL, 11, 8, 16, NULL, NULL, 0, '[]', NULL, NULL, 'Other', 1, NULL, '[]', '2026-07-12', NULL, NULL, 1, NULL),
(209, 227, 0, ' ITMS-SMD-199 ', 2, NULL, 'Windows 10 Home Single Language', 1, NULL, 1, '[\"1\",\"2\",\"8\",\"11\"]', 4, NULL, NULL, NULL, 'Intel i7', 7, 4, 32, 'Samsung', 23, 3, '[{\"name\":\"mcaguho\",\"type\":\"User\"},{\"name\":\"PNP-ITMS\",\"type\":\"Admin\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office Home & Business 2021', 1, NULL, '[]', '2026-07-12', NULL, NULL, 1, NULL),
(210, 207, 0, 'ITMS-SMD-0028', 2, NULL, 'Windows 11 Pro', 0, NULL, 1, '[\"2\",\"4\",\"8\"]', 3, NULL, NULL, NULL, 'Intel i5', 8, 6, 16, 'Acer', 22, 3, '[{\"name\":\"alanuza\",\"type\":\"Admin\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft 365 Apps for Enterprise', 1, NULL, '[]', '2026-07-12', NULL, NULL, 1, NULL),
(211, 209, 0, 'Desktop-UBBT5P1', 2, NULL, 'Windows 10 Pro', 1, NULL, 1, '[\"11\"]', NULL, NULL, NULL, NULL, 'Intel i7', 6, 4, 16, NULL, NULL, 0, '[]', NULL, NULL, 'Microsoft Office Professional Plus 2016', 1, NULL, '[]', '2026-07-12', NULL, NULL, 1, NULL),
(212, 233, 0, 'DESKTOP-F3RHGQD', 18, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"11\"]', NULL, NULL, NULL, NULL, 'intel i3', 12, 4, 8, NULL, NULL, 0, '[]', NULL, NULL, 'Microsoft 365 Apps for Enterprise', 1, NULL, NULL, '2026-07-13', NULL, NULL, 1, NULL),
(213, 234, 0, 'ITMS-PSMU-0031 ', 18, NULL, 'Windows 11 Home Single Language', 1, NULL, 1, '[\"8\"]', 1, NULL, NULL, NULL, 'intel i5', 13, 10, 8, 'acer', 22, 3, '[{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"},{\"name\":\"wtnabong\",\"type\":\"User\"}]', NULL, NULL, 'Other', 1, NULL, '[]', '2026-07-13', NULL, NULL, 1, NULL),
(214, 234, 0, 'ITMS-PSMU-0031 ', 18, NULL, 'Windows 11 Home Single Language', 1, NULL, 1, '[\"8\"]', 1, NULL, NULL, NULL, 'intel i5', 13, 10, 8, 'acer', 22, 3, '[{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"},{\"name\":\"wtnabong\",\"type\":\"User\"}]', NULL, NULL, 'Other', 1, NULL, '[]', '2026-07-13', NULL, NULL, 1, NULL),
(215, 235, 0, 'ITMS-PSMU-0030', 18, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"4\",\"8\"]', 2, NULL, NULL, NULL, 'intel i5', 12, 6, 16, 'acer', 24, 3, '[{\"name\":\"rbcelario\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft 365 Apps for Enterprise', 1, NULL, NULL, '2026-07-13', NULL, NULL, 1, NULL),
(216, 199, 0, 'ITMS-PTD-0026', 5, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"4\",\"8\",\"9\"]', 3, NULL, NULL, NULL, 'intel i5', 12, 6, 16, 'acer', 24, 3, '[{\"name\":\"mcmarasigan\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, '[]', '2026-07-13', NULL, NULL, 1, NULL),
(217, 237, 0, ' ITMS-DMD-0017', 6, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\",\"4\",\"8\",\"9\"]', 4, NULL, NULL, NULL, 'intel i5', 12, 6, 16, 'acer', 24, 4, '[{\"name\":\"crinfante\",\"type\":\"User\"},{\"name\":\"localdmd\",\"type\":\"Admin\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-13', NULL, NULL, 1, NULL),
(218, 238, 0, ' ITMS-DMD-0036', 6, NULL, 'Windows 11 Home Single Language', 1, NULL, 1, '[\"2\",\"4\",\"6\"]', 3, NULL, NULL, NULL, 'intel i5', 12, 6, 16, 'acer', 22, 1, '[{\"name\":\"HMS\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-13', NULL, NULL, 1, NULL),
(219, 239, 0, ' ITMS-DMD-0034', 6, NULL, 'Windows 11 Pro', 1, NULL, 0, '[\"8\",\"9\"]', 2, NULL, NULL, NULL, 'intel i5', 12, 6, 16, 'acer', 24, 1, '[{\"name\":\"HMS\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-13', NULL, NULL, 1, NULL),
(222, 242, 0, 'ITMS-DMD-0031 ', 6, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"9\"]', 1, NULL, NULL, NULL, 'intel i5', 14, 10, 16, 'XCC-XPN', 24, 3, '[{\"name\":\"gcalmaden\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office Home 2024', 1, NULL, '[]', '2026-07-13', NULL, NULL, 1, NULL),
(223, 243, 0, 'ITMS-DMD-0033', 6, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"6\",\"8\",\"9\"]', 3, NULL, NULL, NULL, 'intel i5', 12, 6, 16, 'acer', 24, 3, '[{\"name\":\"HMS\",\"type\":\"Admin\"},{\"name\":\"mlperez\",\"type\":\"User\"},{\"name\":\"NMS\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, '[]', '2026-07-13', NULL, NULL, 1, NULL),
(227, 243, 0, ': ITMS-DMD-0033', 6, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"6\",\"8\",\"9\"]', 3, NULL, NULL, NULL, 'intel i5', 12, 6, 16, 'acer', 24, 3, '[{\"name\":\"HMS\",\"type\":\"Admin\"},{\"name\":\"MLPEREZ\",\"type\":\"User\"},{\"name\":\"NMS\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-13', NULL, NULL, 1, NULL),
(228, 244, 0, ': ITMS-DMD-0035', 6, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"6\"]', 1, NULL, NULL, NULL, 'intel i5', 12, 6, 16, 'A', 24, 4, '[{\"name\":\"HMS\",\"type\":\"Admin\"},{\"name\":\"NMS\",\"type\":\"Admin\"},{\"name\":\"SU\",\"type\":\"Admin\"},{\"name\":\"USER\",\"type\":\"User\"}]', NULL, NULL, 'Microsoft 365 Personal', 1, NULL, NULL, '2026-07-13', NULL, NULL, 1, NULL),
(229, 245, 0, 'DESKTOP-F6DTSPF', 6, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"11\"]', NULL, NULL, NULL, NULL, 'intel i5', 12, 6, 16, 'acer', 24, 2, '[{\"name\":\"SASADMIN\",\"type\":\"Admin\"},{\"name\":\"SU\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-13', NULL, NULL, 1, NULL),
(230, 188, 0, ' ITMS-DMD-0025', 6, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"4\",\"8\",\"9\"]', 3, NULL, NULL, NULL, 'intel i5', 12, 6, 16, 'acer', 24, 4, '[{\"name\":\"PNP-ITMS\",\"type\":\"Admin\"},{\"name\":\"SASADMIN\",\"type\":\"Admin\"},{\"name\":\"SU\",\"type\":\"Admin\"},{\"name\":\"VSPAZ\",\"type\":\"User\"}]', NULL, NULL, 'Other', 1, NULL, NULL, '2026-07-13', NULL, NULL, 1, NULL),
(231, 116, 0, 'ITMS-SMD-0015', 2, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"1\",\"2\",\"4\"]', 3, NULL, NULL, NULL, NULL, NULL, 8, 16, 'Dell', 23, 3, '[{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"joferrer\",\"type\":\"Admin\"},{\"name\":\"PNP-ITMS\",\"type\":\"User\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, '[]', '2026-07-15', NULL, NULL, 1, NULL),
(232, 227, 0, ' ITMS-SMD-199 ', 2, NULL, 'Windows 10 Home Single Language', 1, NULL, 1, '[\"1\",\"2\",\"8\",\"11\"]', 4, NULL, NULL, NULL, 'intel i7', 7, 4, 32, 'samsung', 23, 3, '[{\"name\":\"mcaguho\",\"type\":\"User\"},{\"name\":\"PNP-ITMS\",\"type\":\"Admin\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC 2024', 1, NULL, NULL, '2026-07-15', NULL, NULL, 1, NULL),
(233, 232, 0, 'ITMS-SMD-206', 2, NULL, 'Windows 10 Pro', 1, NULL, 1, '[\"8\"]', 1, NULL, NULL, NULL, 'intel i5', 6, 4, 4, 'FME TS35505', 15, 1, '[{\"name\":\"SMD\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office Professional 2021', 1, NULL, NULL, '2026-07-15', NULL, NULL, 1, NULL),
(234, 246, 0, ':DESKTOP-ETANF7D', 13, NULL, 'Windows 11 Home Single Language', 0, NULL, 1, '[\"8\",\"11\"]', 2, NULL, NULL, NULL, 'intel i5', 12, 6, 16, 'HPN HP', 24, 2, '[{\"name\":\"63917\",\"type\":\"Admin\"},{\"name\":\"ITMS\",\"type\":\"Admin\"}]', NULL, NULL, 'Other', 1, NULL, NULL, '2026-07-15', NULL, NULL, 1, NULL),
(235, 247, 0, 'DESKTOP-R14B356', 17, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"8\"]', 1, NULL, NULL, NULL, 'intel i5', 10, 6, 8, 'acer', 24, 1, '[{\"name\":\"ITMS\",\"type\":\"Admin\"}]', NULL, NULL, 'Other', 1, NULL, '[]', '2026-07-15', NULL, NULL, 1, NULL),
(236, 248, 0, 'ITMS-PTD-OLCIMS', 5, NULL, 'Windows 10 Pro', 1, NULL, 1, '[\"8\"]', 1, NULL, NULL, NULL, 'intel i5', 4, 4, 8, 'lenovo', 19, 5, '[{\"name\":\"HMS\",\"type\":\"Admin\"},{\"name\":\"jmcapiles\",\"type\":\"User\"},{\"name\":\"NMS\",\"type\":\"Admin\"},{\"name\":\"PTD OLCIMS\",\"type\":\"User\"},{\"name\":\"SU\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft 365 Apps for Enterprise', 1, NULL, NULL, '2026-07-15', NULL, NULL, 1, NULL),
(237, 249, 0, ' ITMS-DMD-0011 ', 6, NULL, 'Windows 11 Pro', 0, NULL, 1, '[\"6\",\"8\",\"9\"]', 3, NULL, NULL, NULL, 'intel i5', 12, 6, 16, 'acer', 24, 3, '[{\"name\":\"Inayupan\",\"type\":\"User\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, '[]', '2026-07-15', NULL, NULL, 1, NULL),
(238, 222, 0, 'ITMS', 17, NULL, 'Windows 11 Home Single Language', 1, NULL, 0, '[\"11\"]', NULL, NULL, NULL, NULL, 'Intel i5', 12, 12, 16, NULL, NULL, 0, '[]', NULL, NULL, 'Other', 1, NULL, '[]', '2026-07-15', NULL, NULL, 1, NULL),
(239, 250, 0, 'ITMS-PTD-0010 (in WORKGROUP) — PLTCOL SHIRLEY MAE S ALI', 5, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\",\"8\",\"11\"]', 3, NULL, NULL, NULL, 'intel i7', 12, 8, 16, 'Acer', 22, 4, '[{\"name\":\"CHIEF ARMD\",\"type\":\"Admin\"},{\"name\":\"admin\",\"type\":\"Admin\"},{\"name\":\"PCOLSHIRLEYMAEALI\",\"type\":\"Admin\"},{\"name\":\"SU\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, '[]', '2026-07-15', NULL, NULL, 1, NULL),
(240, 251, 0, ' ITMS-PTD-0011 (in WORKGROUP) — NUP Ronalyn S Balongoy', 5, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\",\"8\",\"9\"]', 3, NULL, NULL, NULL, 'intel i5', 12, 6, 16, 'acer', 24, 2, '[{\"name\":\"rsbalongoy\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, NULL, '2026-07-15', NULL, NULL, 1, NULL),
(241, 253, 0, 'ITMS-PTDLAB-09', 8, NULL, 'Windows 10 Pro', 1, NULL, 1, '[\"11\"]', 1, NULL, NULL, NULL, 'Lenovo', 12, 8, 16, 'Lenovo', 22, 2, '[{\"name\":\"admin\",\"type\":\"Admin\"},{\"name\":\"PTDLAB-09\",\"type\":\"User\"}]', NULL, NULL, 'Other', 1, NULL, NULL, '2026-07-15', NULL, NULL, 1, NULL),
(242, 254, 0, 'ITMS-PTDLAB-010', 8, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"2\",\"4\"]', 2, NULL, NULL, NULL, 'Lenovo', 12, 8, 16, 'Lenovo', 22, 4, '[{\"name\":\"PTDLAB-010\",\"type\":\"User\"},{\"name\":\"admin\",\"type\":\"Admin\"},{\"name\":\"sasadmin\",\"type\":\"Admin\"},{\"name\":\"su\",\"type\":\"Admin\"}]', NULL, NULL, 'Other', 1, NULL, '[]', '2026-07-15', NULL, NULL, 1, NULL),
(243, 256, 0, ':DESKTOP-PKBBOIV', 17, NULL, 'Windows 11 Pro', 0, NULL, 1, '[\"8\",\"9\"]', 2, NULL, NULL, NULL, 'intel i5', 12, 6, 16, 'ACER', 24, 2, '[{\"name\":\"ITMS\",\"type\":\"User\"},{\"name\":\"PNP-ITMS\",\"type\":\"Admin\"}]', NULL, NULL, 'Microsoft Office LTSC Professional Plus 2021', 1, NULL, '[]', '2026-07-15', NULL, NULL, 1, NULL),
(244, 257, 0, 'ITMS-ISSD-OLCIM', 3, NULL, 'Windows 11 Pro', 1, NULL, 1, '[\"11\"]', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, '[]', NULL, NULL, 'Microsoft 365 Apps for Enterprise', 1, NULL, NULL, '2026-07-15', NULL, NULL, 1, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `devices`
--

CREATE TABLE `devices` (
  `id` int(11) NOT NULL,
  `personnel_id` int(11) DEFAULT NULL,
  `device_id` int(11) DEFAULT NULL,
  `device_code` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `device_types`
--

CREATE TABLE `device_types` (
  `id` int(11) NOT NULL,
  `type` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `device_types`
--

INSERT INTO `device_types` (`id`, `type`) VALUES
(1, 'Desktop'),
(2, 'Laptop'),
(3, 'Printer'),
(4, 'Switch'),
(5, 'Router'),
(6, 'Firewall');

-- --------------------------------------------------------

--
-- Table structure for table `divisions`
--

CREATE TABLE `divisions` (
  `id` int(11) NOT NULL,
  `division` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `divisions`
--

INSERT INTO `divisions` (`id`, `division`) VALUES
(1, 'ITSD'),
(2, 'SMD'),
(3, 'ISSD'),
(4, 'ITPMD'),
(5, 'PTD'),
(6, 'DMD'),
(7, 'ARMD'),
(8, 'PTDLAB'),
(9, 'CI'),
(10, 'PCR'),
(11, 'LS'),
(12, 'IHSS'),
(13, 'BFS'),
(14, 'SAO'),
(15, 'SF'),
(16, 'PCC-SF'),
(17, 'TECHSUPP'),
(18, 'PSMU');

-- --------------------------------------------------------

--
-- Table structure for table `endpoint_security`
--

CREATE TABLE `endpoint_security` (
  `id` int(11) NOT NULL,
  `antivirus` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `endpoint_security`
--

INSERT INTO `endpoint_security` (`id`, `antivirus`) VALUES
(1, 'Trendmicro'),
(2, 'Sophos'),
(3, 'Cybereason'),
(4, 'Bitdefender'),
(5, 'UTMStack'),
(6, 'Qualys'),
(7, 'Avast'),
(8, 'Windows Defender'),
(9, 'eScan'),
(10, 'Cynet'),
(11, 'Others');

-- --------------------------------------------------------

--
-- Table structure for table `firewalls`
--

CREATE TABLE `firewalls` (
  `id` int(11) NOT NULL,
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
  `last_updated_at` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `headsets`
--

CREATE TABLE `headsets` (
  `id` int(11) NOT NULL,
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
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `laptops`
--

CREATE TABLE `laptops` (
  `id` int(11) NOT NULL,
  `personnel_id` int(11) NOT NULL,
  `device_id` int(11) NOT NULL,
  `device_name` varchar(150) NOT NULL,
  `division_id` int(11) NOT NULL,
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
  `acquisition_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `others`
--

CREATE TABLE `others` (
  `id` int(11) NOT NULL,
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
  `device_name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `personnels`
--

CREATE TABLE `personnels` (
  `id` int(11) NOT NULL,
  `division_id` int(11) NOT NULL,
  `rank_id` int(11) NOT NULL,
  `first_name` varchar(255) NOT NULL,
  `middle_name` varchar(255) DEFAULT NULL,
  `last_name` varchar(255) NOT NULL,
  `created_by` int(11) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `personnels`
--

INSERT INTO `personnels` (`id`, `division_id`, `rank_id`, `first_name`, `middle_name`, `last_name`, `created_by`, `is_active`) VALUES
(1, 1, 1, 'ITSD', 'ENCODER', '.', 2, 0),
(2, 1, 1, 'LAYLA', 'BALMOND', 'THAMUZ', 2, 0),
(3, 1, 14, 'NEW', 'NEW', 'NEW', 3, 0),
(4, 1, 1, 'NGUYEN', '', 'AMURAO', 3, 0),
(5, 1, 1, 'BRENON', '', 'BANAO', 3, 0),
(6, 17, 1, 'MARK', '', 'AQUINO', 3, 0),
(7, 1, 14, 'BRANDON JAKE', 'FERNANDEZ', 'DIAZ', 1, 0),
(8, 1, 1, 'ARREN LEE', 'C', 'ADULTA', 1, 1),
(9, 1, 4, 'MELVIN', 'A', 'CALAPANO', 6, 1),
(10, 1, 1, 'HUSSEIN', 'R', 'ALI', 6, 0),
(11, 1, 1, 'HUSSEIN', 'R', 'ALI', 7, 1),
(12, 1, 1, 'ELMAN', 'A', 'GAJO', 7, 1),
(13, 1, 1, 'ROSALYN', 'A.', 'GABRIEL', 7, 1),
(14, 1, 1, 'MARIA CRISTINA', 'D', 'DELA CRUZ', 7, 1),
(15, 1, 1, 'JOHN ERICK', 'M', 'RAMOS', 7, 1),
(16, 1, 1, 'JOEY', 'M', 'MARINTES', 7, 1),
(17, 1, 1, 'KHEN', '', 'FABIAN', 7, 1),
(18, 1, 1, 'MARGIE', 'D', 'PIMENTEL', 7, 1),
(19, 1, 1, 'MARLYN', 'L', 'DIMACULANGAN', 7, 1),
(20, 1, 1, 'PRINCESS SANNY', 'A', 'RAMOS', 7, 1),
(21, 1, 1, 'EDMUND', 'M', 'RIVERA', 7, 1),
(22, 1, 1, 'LILIBETH', 'V', 'SECULLES', 7, 1),
(23, 1, 1, 'ROSENA', 'N', 'ROSETE', 7, 1),
(24, 1, 1, 'SUNSHINE', 'G', 'BINARA', 1, 1),
(25, 1, 2, 'ERIC', 'M', 'FERNANDEZ', 7, 1),
(26, 1, 1, 'ANN MARGARETH', 'R', 'RUARO', 7, 1),
(27, 1, 1, 'PRINCE ANDREI', '', 'ZAFE', 7, 1),
(28, 1, 1, 'RUBY', 'B', 'PAULO', 7, 1),
(29, 1, 1, 'ALBERT', 'V', 'MANANON', 7, 1),
(30, 1, 1, 'CHRISTOPHER', 'T', 'DELA PERI', 7, 1),
(31, 1, 1, 'JANN ARLY', '', 'ILDEFONSO', 7, 1),
(32, 1, 1, 'JAYBEE', 'B', 'ALEGRE', 7, 1),
(33, 1, 1, 'JOVENCIO', 'F', 'FLORO', 7, 1),
(34, 1, 1, 'MICHAEL', 'DC', 'BACLIG', 7, 1),
(35, 1, 1, 'MILA', 'B', 'ALDE', 7, 1),
(36, 1, 1, 'RIZZA', 'Z', 'MORALES', 7, 1),
(37, 1, 2, 'AVELINO', 'M', 'REYES', 7, 1),
(38, 1, 10, 'ANGELO', 'Z', 'BAYAUA', 7, 1),
(39, 14, 1, 'RHIZA', 'A', 'DALLEGO', 8, 1),
(40, 18, 1, 'DANICA', '', 'FRANDO', 1, 1),
(41, 18, 1, 'SHIELA MARIE', '', 'QUIJANO', 1, 1),
(42, 7, 1, 'DANIELLA MARIE', 'A', 'LAGGUI', 14, 1),
(43, 7, 1, 'ACEL', '', 'PARIS', 14, 1),
(44, 7, 1, 'DANICA', 'C', 'ANAMA', 14, 1),
(45, 7, 1, 'JAMELLA', 'F', 'SOCORRO', 14, 1),
(46, 7, 1, 'JESSA KRIS', 'C', 'PILLAR', 14, 1),
(47, 7, 1, 'KIMBERLY JOYCE', 'F', 'TURALBA', 14, 1),
(48, 7, 1, 'MA FELIRITA', 'S', 'MISTICA', 14, 1),
(49, 7, 1, 'MARIA ELISA', '', 'LEE', 14, 1),
(50, 7, 1, 'MARVIN', 'L', 'BULURAN', 14, 1),
(51, 7, 1, 'NEILJANE', 'A', 'BACLIG', 14, 1),
(52, 7, 1, 'AILEEN', '', 'NIEVA', 14, 1),
(53, 7, 1, 'PACIVICA', 'B', 'HERRERA', 14, 1),
(54, 7, 2, 'DONNY BOY', 'O', 'TAGUIBOD', 14, 1),
(55, 7, 2, 'DRANREB', 'G', 'VALLEJOS', 14, 1),
(56, 7, 2, 'JEFF BRIAN', 'O', 'FRANK', 14, 1),
(57, 7, 2, 'JOEMAR', 'R', 'RICO', 14, 1),
(58, 7, 2, 'JUDE ANN', 'G', 'MARQUE', 14, 0),
(59, 7, 2, 'RUEL', 'A', 'APALLA', 14, 1),
(60, 7, 7, 'JUNVI', 'P', 'MELCHOR', 14, 1),
(61, 7, 13, 'VICTORIO', 'M', 'DELA PENA JR', 14, 1),
(62, 7, 3, 'JUDE ANNE', 'G', 'MERQUE', 14, 1),
(63, 7, 3, 'JUDE ANNE', 'G', 'MERQUE', 14, 1),
(64, 7, 3, 'MARIEL', 'A', 'CRUZAT', 14, 1),
(65, 7, 9, 'JAMES', 'A', 'SYTICO', 14, 1),
(66, 7, 9, 'JOCELYN', 'L', 'PAMITTAN', 14, 1),
(67, 7, 9, 'JOCELYN', 'L', 'PAMITTAN', 14, 1),
(68, 7, 12, 'ROSE ANN', '', 'SUCGANG', 14, 1),
(69, 7, 5, 'ROBERTO', 'G', 'CANJA JR', 14, 1),
(70, 7, 1, 'ANNABELLE', 'G', 'GUALVEZ', 14, 1),
(71, 7, 1, 'PACIVICA', '', 'HERRERA', 14, 1),
(72, 3, 1, 'AGUSTIN', 'C', 'CABALLA JR', 15, 1),
(73, 3, 1, 'DENIELLE ZCHEA', 'G', 'DACIR', 15, 1),
(74, 3, 1, 'GIBSON', 'T', 'SOCORRO', 15, 1),
(75, 3, 1, 'JOYLYN', 'V', 'VILAVICENCIO', 15, 1),
(76, 3, 1, 'LITO NOBERTO', 'L', 'TORRANO', 15, 1),
(77, 3, 1, 'LOUIE VAN', 'A', 'ALFABETO', 15, 1),
(78, 3, 1, 'MARIA MARGARITA ROSARIO', 'G', 'MORALES', 15, 1),
(79, 3, 1, 'MARY GRACE', 'T', 'BILLOTE', 15, 1),
(80, 3, 1, 'NOEME', 'M', 'CUETO', 15, 1),
(81, 3, 1, 'PAUL JANSEN', 'F', 'DIMACULANGAN', 15, 1),
(82, 3, 1, 'LEX LEVIN', 'J', 'PANSOY', 15, 1),
(83, 3, 1, 'MICAELA', 'J', 'DE GUZMAN', 15, 1),
(84, 3, 10, 'RELLON', 'S', 'ONIL', 15, 1),
(85, 3, 9, 'ALEX ACE', 'C', 'CORPUZ', 15, 1),
(86, 3, 9, 'MA ANGELA', '', 'SALAYA', 15, 1),
(87, 3, 1, 'ISSD', '', 'VA', 15, 1),
(88, 6, 1, 'CHARLENE', 'L', 'OLIVAR', 16, 1),
(89, 6, 1, 'DANIEL JOSHUA', 'B', 'RAYMUNDO', 16, 1),
(90, 6, 1, 'DONNA WENNIE', '', 'VILLAMIN', 16, 1),
(91, 6, 1, 'GEMMA', '', 'RECUENCO', 16, 1),
(92, 6, 1, 'GRACE', '', 'BALUCANAG', 16, 1),
(93, 6, 1, 'JANE', 'S', 'GALBAN', 16, 1),
(94, 6, 1, 'JESSICA', '', 'DELA CRUZ', 16, 1),
(95, 6, 1, 'JOHN MICHAEL', 'B', 'VILLAS', 16, 1),
(96, 6, 1, 'JOHN RICK', 'E', 'MESA', 16, 1),
(97, 6, 1, 'JOHN VINCENT', 'V', 'DIMACULANGAN', 16, 1),
(98, 6, 1, 'MISCHELL', 'A', 'DOMINGO', 16, 1),
(99, 6, 1, 'PRECIOUS PEARL SALVE', 'P', 'PINEDA', 16, 1),
(100, 6, 1, 'RAMIL', 'M', 'ONGKINOOO', 16, 1),
(101, 6, 1, 'ROSELYN', 'C', 'DELA CRUZ', 16, 1),
(102, 6, 1, 'ROSWELL', '', 'GO', 16, 1),
(103, 6, 1, 'ROY', '', 'MADAYAG', 16, 1),
(104, 6, 1, 'SYBEL ZENA', 'R', 'PASTOR', 16, 1),
(105, 6, 1, 'VICTORIA', '', 'ENRIQUEZ', 16, 1),
(106, 6, 1, 'WENCESLAO', '', 'RAMOS', 16, 1),
(107, 6, 2, 'CATHERINE', 'V', 'SANG-AN', 16, 1),
(108, 6, 2, 'ROBU ROSE', '', 'CELARIO', 16, 1),
(109, 2, 1, 'AARON', 'B', 'MASAGANDA', 17, 1),
(110, 2, 1, 'ALTHEA CELY', 'P', 'DELA CRUZ', 17, 1),
(111, 2, 1, 'ANA JUNE', 'F', 'ACUESTA', 17, 1),
(112, 2, 1, 'ANNA LEA', 'A', 'RIDULME', 17, 1),
(113, 2, 1, 'ARLENE', 'A', 'ALMACHAR', 17, 1),
(114, 2, 1, 'DIANA', 'V', 'PARANADA', 17, 1),
(115, 2, 1, 'DIANALYN', 'M', 'LUANSING', 17, 1),
(116, 2, 1, 'JOSHUA', '', 'FERRER', 17, 1),
(117, 2, 1, 'MARIE FRANCISSE THERESE', 'A', 'ARCE', 17, 1),
(118, 2, 1, 'MARVIN', 'S', 'MALLILLIN', 17, 1),
(119, 2, 1, 'MARY JOY', 'D', 'CABANAS', 17, 1),
(120, 2, 1, 'PAUL KENNETH', 'D', 'AGRIPA', 17, 1),
(121, 2, 1, 'RENA ELENA', 'O', 'SOLON', 17, 1),
(122, 2, 1, 'SIXTO', 'K', 'VIGILANCIA', 17, 1),
(123, 2, 10, 'KRISTIANO', 'T', 'ULPIDO', 17, 1),
(124, 8, 1, 'PTDLAB', '', 'A', 18, 1),
(125, 8, 1, 'PTDLAB', '', 'B', 18, 1),
(126, 8, 1, 'PTDLAB', '', 'C', 18, 1),
(127, 8, 1, 'PTDLAB', '', 'D', 18, 1),
(128, 8, 1, 'PTDLAB', '', 'E', 18, 1),
(129, 8, 1, 'PTDLAB', '', 'F', 18, 1),
(130, 8, 1, 'PTDLAB', '', 'G', 18, 1),
(131, 8, 1, 'PTDLAB', '', 'H', 18, 1),
(132, 8, 1, 'PTDLAB', '', 'K', 18, 1),
(133, 8, 1, 'PTDLAB', '', 'L', 18, 1),
(134, 8, 1, 'PTDLAB', '', 'M', 18, 1),
(135, 8, 1, 'PTDLAB', '', 'P', 18, 1),
(136, 8, 1, 'PTDLAB', '', 'R', 18, 1),
(137, 8, 1, 'PTDLAB', '', 'S', 18, 1),
(138, 8, 1, 'PTDLAB', '', 'T', 18, 1),
(139, 8, 1, 'PTDLAB', '', 'N', 18, 1),
(140, 5, 1, 'CARLO', 'O', 'OREVILLO', 19, 1),
(141, 5, 1, 'CHRISTIAN', 'R', 'ARROYO', 19, 1),
(142, 5, 1, 'FATHIMA', 'A', 'PEREZ', 19, 1),
(143, 5, 1, 'GRACIANO', 'R', 'ARGETE', 19, 1),
(144, 5, 1, 'KARL LOUIE', 'O', 'DOMINGO', 19, 1),
(145, 5, 1, 'MA RENINA', 'R', 'PARAZO', 19, 1),
(146, 5, 1, 'MADELIENE', 'G', 'TALLONGAN', 19, 1),
(147, 5, 1, 'PHILLIP', '', 'SAMPANA', 19, 1),
(148, 5, 1, 'RACHELLE', 'C', 'MAGBANUA', 19, 1),
(149, 5, 1, 'SHARMAINE', '', 'PENAVERDE', 19, 1),
(150, 5, 10, 'RIZELLE', 'I', 'AGUSTIN', 19, 1),
(151, 5, 9, 'MARK LAWRENCE', 'A', 'VALLE', 19, 1),
(152, 11, 1, 'IAN CARLO', 'V', 'HAPAN', 1, 1),
(153, 11, 1, 'IVY', 'E', 'BATICADOS', 1, 1),
(154, 11, 1, 'TIMOTHY JOSEPH', 'S', 'BUITRE', 1, 1),
(155, 11, 3, 'ANTHONY ELKING', 'S', 'TAMANIO', 1, 1),
(156, 11, 9, 'CRISHELLE', 'S', 'RAMOS', 1, 1),
(157, 11, 12, 'JOHANNES GOLD', 'L', 'AQUINO', 1, 1),
(158, 11, 4, 'JAMES BENEDICT', 'S', 'AGUILAR', 1, 1),
(159, 12, 1, 'ALLAN', 'S', 'SANTOS', 1, 1),
(160, 12, 1, 'RYAN', 'V', 'CATANEO', 1, 1),
(161, 9, 1, 'MARIE LOUISE ROVIAN', 'R', 'VER', 21, 1),
(162, 9, 1, 'MARY GRACE', 'C', 'COSTALES', 21, 1),
(163, 9, 3, 'ZAYRA JANE', 'C', 'CUASAY', 21, 1),
(164, 9, 11, 'EDUARDO', 'S', 'UNTALAN II', 21, 1),
(165, 9, 5, 'ROBERTO', 'G', 'CANJA JR', 21, 1),
(166, 15, 1, 'SERVER', '', 'FARM', 1, 1),
(167, 13, 1, 'JHINNA-LOU', 'S', 'ALCANTARA', 22, 1),
(168, 13, 1, 'MARIAN AILEEN', 'RJ', 'MATEO', 22, 1),
(169, 13, 1, 'SHIRLY', 'C', 'RUMBAOA', 22, 1),
(170, 13, 1, 'SILVINA', 'L', 'RECLA', 22, 1),
(171, 10, 1, 'RUIVIVAR,', 'JOSE', 'SALVADOR D', 1, 1),
(172, 10, 1, 'ALVAREZ,', 'PAMELA', 'C', 1, 1),
(173, 4, 1, 'ITMS', '', 'ITPMD', 1, 1),
(174, 4, 1, 'ITMS', 'ITPMD', 'OLCIMS', 1, 1),
(175, 4, 9, 'ANGELICA', 'A', 'QUINTOS', 1, 1),
(176, 4, 5, 'PHILIP JAMES', 'R', 'PENAVERDE', 24, 1),
(177, 4, 1, 'LUCHIE', 'R', 'BERENGUEL', 24, 1),
(178, 4, 1, 'MARY ANN', 'Y', 'DAGTA', 24, 1),
(179, 4, 2, 'ALWYN', '', 'MORTEL', 24, 1),
(180, 4, 1, 'NECILDA', '', 'GONZALES', 24, 1),
(181, 4, 8, 'MARIA LUZ', 'B', 'GASCON', 24, 1),
(182, 4, 1, 'IRACUSTA JOANA', '', 'MARIZ', 24, 1),
(183, 1, 1, 'ERIC', '', 'NAVARRO', 1, 1),
(184, 5, 2, 'LOVELYN KATE', 'L', 'GUNNACAO', 1, 1),
(185, 2, 1, 'ARNOLD', 'Z', 'LAZANU', 1, 0),
(186, 8, 1, 'PTDLAB', '', 'O', 1, 1),
(187, 6, 1, 'MARCILINO', '', 'VILLANUEVA', 1, 1),
(188, 6, 1, 'VIRGINIA', '', 'PAZ', 1, 1),
(189, 4, 2, 'RODIC', '', 'MANAOG', 1, 1),
(190, 7, 1, 'FLORITES', 'S', 'SEMILLA', 14, 1),
(191, 7, 1, 'JOZEL', '', 'EIBAL', 14, 1),
(192, 7, 3, 'HAROLD JAY', 'A', 'CHAN', 14, 1),
(193, 7, 1, 'MARICEL', 'F', 'ESTEVES', 1, 1),
(194, 7, 1, 'NADORA', '', 'RETIRED', 1, 1),
(195, 7, 1, 'J', '', 'JEAN', 14, 1),
(196, 7, 1, 'C', '', 'MJ', 14, 1),
(197, 7, 1, 'MINA HAYDEE', '', 'MATILLANO', 14, 1),
(198, 7, 1, 'REBECCA', 'L', 'BAGO', 14, 1),
(199, 5, 2, 'ANGELA', 'C', 'MARASIGAN', 19, 1),
(200, 5, 9, 'AUDEN', 'G', 'ARIAS', 19, 1),
(201, 5, 1, 'ROUMELLIA', 'R', 'JORDA', 19, 1),
(202, 13, 1, 'UNTALAN,', 'RACHEL', 'G', 19, 1),
(203, 5, 1, 'CONNIE', 'V', 'PAREDES', 19, 0),
(204, 13, 6, 'PALISOC,', 'PREMIER', 'HAROLD T', 19, 1),
(205, 5, 2, 'SHARMEN', 'B', 'YAGO', 19, 1),
(206, 2, 12, 'RIMANDO', 'A', 'JUVANAL', 17, 1),
(207, 2, 1, 'ARNOLD', 'Z', 'LAZANU', 17, 1),
(208, 2, 1, 'ANDREW KEITH', 'M', 'CADULAC', 17, 1),
(209, 2, 1, 'MICHAEL GERARD', 'P', 'ESTIPONA', 17, 1),
(210, 2, 1, 'ADELWISA', 'F', 'PANIZA', 17, 1),
(211, 2, 1, 'B', '', 'DESKTOP', 17, 1),
(212, 2, 1, 'C', '', 'DESKTOP', 17, 1),
(213, 2, 1, 'D', '', 'DESKTOP', 17, 0),
(214, 2, 1, 'E', '', 'DESKTOP', 17, 1),
(215, 2, 1, 'DESKTOP', '', 'OLCIMS', 17, 1),
(216, 2, 10, 'JERALYNE', 'R', 'CAROLINO', 1, 1),
(217, 2, 1, 'DESKTOP', '', 'A', 17, 0),
(218, 2, 1, 'DESKTOP', '', 'A', 17, 1),
(219, 17, 1, 'A', '', 'NHQ LOBBY', 1, 1),
(220, 17, 1, 'B', '', 'NHQ LOBBY', 1, 1),
(221, 17, 1, 'A', '', 'MPC', 1, 1),
(222, 17, 1, 'B', '', 'MPC', 1, 1),
(223, 13, 1, 'CONNIE', 'V', 'PAREDES', 1, 1),
(224, 13, 1, 'CONNIE', 'V', 'PAREDES', 1, 0),
(225, 13, 6, 'PREMIER HAROLD', 'T', 'PALISOC', 1, 0),
(226, 4, 13, 'RUBEN', '', 'BORRES', 1, 1),
(227, 2, 1, 'MARK ANTHONY', 'C', 'AGUHO', 1, 1),
(228, 2, 1, 'ANDREW KEITH', 'M', 'CALUDAC', 1, 0),
(229, 2, 1, 'YVETTE', 'V', 'DE LEON', 1, 0),
(230, 2, 1, 'MICHAEL GERARD', 'P', 'ESTIPONA', 1, 0),
(231, 2, 1, 'JOSHUA', 'O', 'FERRER', 1, 0),
(232, 2, 1, 'CRISANTO', 'H', 'PORNIA', 1, 1),
(233, 18, 1, 'ROSETTE', '', 'DAGULPO', 1, 1),
(234, 18, 1, 'WENDA GREEN LINDOG', 'T', 'NABONG', 1, 1),
(235, 18, 2, 'ROSE', 'C', 'ROBU', 1, 1),
(236, 5, 2, 'MIA ANGEL', 'C', 'MARASIGAN', 1, 1),
(237, 6, 1, 'CHLOE', 'R', 'INFANTE', 1, 1),
(238, 6, 1, 'USE', '', 'COMMON', 1, 1),
(239, 6, 9, 'EDUARDO', 'B', 'DAVID JR', 1, 1),
(240, 6, 5, 'RIZALDY', 'ISIDRO', 'RETAZO', 1, 0),
(241, 6, 1, 'DONA WENNIE', '', 'VILLAMIN', 1, 0),
(242, 6, 1, 'GILBERT', '', 'ALMADEN', 1, 1),
(243, 6, 1, 'MELVIN', '', 'PEREZ', 1, 1),
(244, 6, 5, 'RIZALDY', 'ISIDRO', 'RETAZO', 16, 1),
(245, 6, 13, 'AMIR HASSAN', 'R', 'ALI', 16, 1),
(246, 13, 12, 'ROMMEL', 'B', 'BALMACEDA', 1, 1),
(247, 17, 1, 'GRANDSTAND', '', 'A', 1, 1),
(248, 6, 1, 'JEWELYN', 'M', 'CAPILES', 1, 1),
(249, 6, 2, 'CHRISTIAN PAUL', '', 'BARQUIN', 1, 1),
(250, 5, 13, 'SHIRLEY MAE', 'S', 'ALI', 1, 1),
(251, 5, 1, 'RONALYN', 'S', 'BALONGOY', 1, 1),
(252, 15, 1, 'SERVER FARM', '', 'B', 1, 1),
(253, 8, 1, 'PTDLAB', '', 'I', 1, 1),
(254, 8, 1, 'PTDLAB', '', 'J', 1, 1),
(255, 8, 1, 'PTDLAB', '', 'Q', 1, 1),
(256, 17, 1, 'CONFERENCE ROOM', '', 'A', 1, 1),
(257, 3, 1, 'COMMON USE', '', 'ISSD', 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `printers`
--

CREATE TABLE `printers` (
  `id` int(11) NOT NULL,
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
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ranks`
--

CREATE TABLE `ranks` (
  `id` int(11) NOT NULL,
  `rank` varchar(255) NOT NULL,
  `sort_order` int(11) DEFAULT 999
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ranks`
--

INSERT INTO `ranks` (`id`, `rank`, `sort_order`) VALUES
(1, 'NUP', 14),
(2, 'PAT', 13),
(3, 'PCPL', 12),
(4, 'PSSG', 11),
(5, 'PMSG', 10),
(6, 'PSMS', 9),
(7, 'PCMS', 8),
(8, 'PEMS', 7),
(9, 'PLT', 6),
(10, 'PCPT', 5),
(11, 'PMAJ', 4),
(12, 'PLTCOL', 3),
(13, 'PCOL', 2),
(14, 'PBGEN', 1);

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `role_name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `role_name`) VALUES
(1, 'superadmin'),
(2, 'admin'),
(3, 'encoder');

-- --------------------------------------------------------

--
-- Table structure for table `routers`
--

CREATE TABLE `routers` (
  `id` int(11) NOT NULL,
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
  `division_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `security_assessment_findings`
--
-- Detail rows for a security_assessments run — one per finding line from
-- a FOREN-style hardware/network security assessment export (per-host
-- key/value facts, per-connection network findings, or a pass/fail
-- component checklist; `table_no` records which of those it came from).
--

CREATE TABLE `security_assessment_findings` (
  `id` int(11) NOT NULL,
  `assessment_id` int(11) NOT NULL,
  `table_no` tinyint(4) DEFAULT NULL,
  `section` varchar(50) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `component` varchar(100) DEFAULT NULL,
  `property` varchar(150) DEFAULT NULL,
  `value` text DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL,
  `finding` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `security_assessments`
--
-- One row per FOREN-style security assessment run against a machine.
-- `serial_no` is matched against desktops/laptops.par_serial_no the same
-- way POST /inventory/devices/agent-report does — soft reference only
-- (this schema has no FK constraints), so device_type/device_id are
-- filled in only when a match was found at import time.
--

CREATE TABLE `security_assessments` (
  `id` int(11) NOT NULL,
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
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `splitters`
--

CREATE TABLE `splitters` (
  `id` int(11) NOT NULL,
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
  `last_update_at` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `switchers`
--

CREATE TABLE `switchers` (
  `id` int(11) NOT NULL,
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
  `last_update_at` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `switches`
--

CREATE TABLE `switches` (
  `id` int(11) NOT NULL,
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
  `last_update_at` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ups`
--

CREATE TABLE `ups` (
  `id` int(11) NOT NULL,
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
  `last_update_at` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
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
  `last_update_at` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `role_id`, `division_id`, `email`, `password`, `rank_id`, `first_name`, `middle_name`, `last_name`, `username`, `is_active`, `creator_user_id`, `created_date`, `last_update_at`) VALUES
(1, 1, 1, 'itsd.superadmin@itms.com', '$2y$10$aisUHgeqUkfpDVPYWE6KuOV4pzsD8twbv11LfwnUhpykBuh/Z9bXm', 1, 'ITSD', 'SUPER', 'ADMIN', 'superadmin', 1, 1, '2026-06-06', NULL),
(2, 3, 1, 'itsd.encoder@itms.com', '$2y$10$Wv7Z5Nzu7yDNol0cgfNQQOZ5nZ6dgLOY/A40gjbbI5/Vau6BF2li6', 1, 'BRANDON', 'JAKE', 'FERNANDEZ DIAZ', 'diazbf', 1, 1, '2026-06-08', NULL),
(3, 2, 1, 'itsd.admin@itms.com', '$2y$10$A0kyu1oQ6yoIOgBxiyJTH.Bz9f7/ztFqYBzc0DmNPc9f46tdlAuce', 1, 'ITSD', 'ADMIN', '01', '01ia', 1, 1, '2026-06-08', NULL),
(14, 3, 7, 'armd@itms.com', '$2y$10$LIRMokxvkeC.PuqWifuSo.TQomr5uFalQM46qQbj3xAw3ErI7C2o2', 1, 'PRINCE ANDREI', 'SANTOS', 'ZAFE', 'zafeps', 1, 1, '2026-06-29', NULL),
(15, 3, 3, 'issd@itms.com', '$2y$10$pI9WutmEAwoiJPBd5kt3P.wi3nMAjwczTLjC0QbYhCbMDQ1gIQuDS', 1, 'PRINCE ANDREI', 'SANTOS', 'ZAFE', 'zafeps2', 1, 1, '2026-07-02', NULL),
(16, 3, 6, 'dmd@itms.com', '$2y$10$lX5WpKGozEnyDWv4UCdreO5Ck4yiasZYpDR0KWhsLb.I8bPduU9ZW', 1, 'PRINCE ANDREI', 'SANTOS', 'ZAFE', 'zafeps3', 1, 1, '2026-07-02', NULL),
(17, 3, 2, 'smd@itms.com', '$2y$10$WcgNeGNb3tGc/E/rkuRKZO6gUIVFU68wNNf0RdHY5rUMJh4yn4ceG', 1, 'PRINCE ANDREI', 'SANTOS', 'ZAFE', 'zafeps4', 1, 1, '2026-07-02', NULL),
(18, 3, 8, 'ptdlab@itms.com', '$2y$10$6tTDX9j5j6oM5mFQwAOFIetV4vfziKiToGDTJY4TIMeoRiQl3.mCK', 1, 'PRINCE ANDREI', 'SANTOS', 'ZAFE', 'zafeps5', 1, 1, '2026-07-03', NULL),
(19, 3, 5, 'ptd@itms.com', '$2y$10$W4IoQnGDrvJmKfMPBD7vDOQLSUBaT7IpD1.9bKikCnIkm7r9l6c/.', 1, 'PRINCE ANDREI', 'SANTOS', 'ZAFE', 'zafeps6', 1, 1, '2026-07-03', NULL),
(20, 3, 11, 'ls@itms.com', '$2y$10$pbvucChm05aj8sqbSVEhV.LHOrTpYOu0IjrvwJFlGkLAUEbwA7AQC', 1, 'PRINCE ANDREI', 'SANTOS', 'ZAFE', 'zafeps7', 1, 1, '2026-07-03', NULL),
(21, 3, 9, 'ci@itms.com', '$2y$10$4QfG5J/GcaxppR1SDhWa2O4vkpp8JsEyqcvw6C.QK8au2xudGU7SO', 1, 'PRINCE ANDREI', 'SANTOS', 'ZAFE', 'zafeps8', 1, 1, '2026-07-03', NULL),
(22, 3, 13, 'bfs@itms.com', '$2y$10$uQHSiZngA2o6t2e2nMuvS.4zSH1mLnyB.d.Ini7KXYUtputlbUXFi', 1, 'PRINCE ANDREI', 'SANTOS', 'ZAFE', 'zafeps9', 1, 1, '2026-07-03', NULL),
(23, 3, 4, 'itmd@itms.com', '$2y$10$bsxxLuYfyVkbekXfc3.SUeCYPIDftBTnoeA2AbxXgmaAwuSLCTca2', 1, 'PRINCE ANDREI', 'S', 'ZAFE', 'zafeps10', 1, 1, '2026-07-03', NULL),
(24, 3, 4, 'itpmd@itms.com', '$2y$10$3F.YHHYL7qIpL/Nj.s3b3uU1NsJ7PYBpmxs4429o/QUqzCMC2lJma', 1, 'PRINCE ANDREI', 'SANTOS', 'ZAFE', 'zafeps11', 1, 1, '2026-07-03', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `cameras`
--
ALTER TABLE `cameras`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `desktops`
--
ALTER TABLE `desktops`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `devices`
--
ALTER TABLE `devices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `device_code` (`device_code`);

--
-- Indexes for table `device_types`
--
ALTER TABLE `device_types`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `divisions`
--
ALTER TABLE `divisions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `endpoint_security`
--
ALTER TABLE `endpoint_security`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `firewalls`
--
ALTER TABLE `firewalls`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `headsets`
--
ALTER TABLE `headsets`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `laptops`
--
ALTER TABLE `laptops`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `others`
--
ALTER TABLE `others`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `personnels`
--
ALTER TABLE `personnels`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `printers`
--
ALTER TABLE `printers`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `ranks`
--
ALTER TABLE `ranks`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `routers`
--
ALTER TABLE `routers`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `security_assessment_findings`
--
ALTER TABLE `security_assessment_findings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `assessment_id` (`assessment_id`);

--
-- Indexes for table `security_assessments`
--
ALTER TABLE `security_assessments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `serial_no` (`serial_no`);

--
-- Indexes for table `splitters`
--
ALTER TABLE `splitters`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `switchers`
--
ALTER TABLE `switchers`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `switches`
--
ALTER TABLE `switches`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `ups`
--
ALTER TABLE `ups`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `cameras`
--
ALTER TABLE `cameras`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `desktops`
--
ALTER TABLE `desktops`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=245;

--
-- AUTO_INCREMENT for table `devices`
--
ALTER TABLE `devices`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `divisions`
--
ALTER TABLE `divisions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `endpoint_security`
--
ALTER TABLE `endpoint_security`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `firewalls`
--
ALTER TABLE `firewalls`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `headsets`
--
ALTER TABLE `headsets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `laptops`
--
ALTER TABLE `laptops`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `others`
--
ALTER TABLE `others`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `personnels`
--
ALTER TABLE `personnels`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=258;

--
-- AUTO_INCREMENT for table `printers`
--
ALTER TABLE `printers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ranks`
--
ALTER TABLE `ranks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `routers`
--
ALTER TABLE `routers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `security_assessment_findings`
--
ALTER TABLE `security_assessment_findings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `security_assessments`
--
ALTER TABLE `security_assessments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `splitters`
--
ALTER TABLE `splitters`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `switchers`
--
ALTER TABLE `switchers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `switches`
--
ALTER TABLE `switches`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ups`
--
ALTER TABLE `ups`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
