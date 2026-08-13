-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 13, 2026 at 02:20 AM
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
-- Database: `bmi_monitoring`
--

-- --------------------------------------------------------

--
-- Table structure for table `bmi_assessments`
--

CREATE TABLE `bmi_assessments` (
  `assessment_id` bigint(20) UNSIGNED NOT NULL,
  `personnel_id` bigint(20) UNSIGNED NOT NULL,
  `height` decimal(5,2) NOT NULL,
  `weight` decimal(6,2) NOT NULL,
  `waist` decimal(5,2) DEFAULT NULL,
  `hip` decimal(5,2) DEFAULT NULL,
  `wrist` decimal(5,2) DEFAULT NULL,
  `bmi` decimal(5,2) DEFAULT NULL,
  `ibw` decimal(6,2) DEFAULT NULL,
  `weight_to_lose` decimal(6,2) DEFAULT NULL,
  `pnp_classification` varchar(50) DEFAULT NULL,
  `who_classification` varchar(50) DEFAULT NULL,
  `assessment_date` date NOT NULL,
  `unit_representative` varchar(150) DEFAULT NULL,
  `health_service_representative` varchar(150) DEFAULT NULL,
  `encoder` varchar(150) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `bmi_assessments`
--

INSERT INTO `bmi_assessments` (`assessment_id`, `personnel_id`, `height`, `weight`, `waist`, `hip`, `wrist`, `bmi`, `ibw`, `weight_to_lose`, `pnp_classification`, `who_classification`, `assessment_date`, `unit_representative`, `health_service_representative`, `encoder`, `created_at`) VALUES
(1, 1, 170.00, 68.50, 82.00, 96.00, 17.00, 23.70, 63.50, 0.00, 'Normal', 'Normal weight', '2026-08-11', 'Unit Representative', 'Health Service Representative', 'System Encoder', '2026-08-11 11:09:30'),
(2, 1, 170.00, 67.00, 81.00, 95.00, 17.00, 23.18, 63.50, 0.00, 'Normal', 'Normal weight', '2026-09-11', 'Unit Representative', 'Health Service Representative', 'System Encoder', '2026-08-11 11:33:17'),
(3, 1, 999.00, 999.00, 999.00, 999.00, 999.00, 10.01, 2195.60, 0.00, 'Underweight', 'Underweight', '2026-08-11', NULL, NULL, NULL, '2026-08-11 15:48:22'),
(4, 4, 999.00, 9999.00, 999.99, 999.99, 999.99, 100.19, 2195.60, 7803.40, 'Obese Class II', 'Obese', '2026-08-11', NULL, NULL, NULL, '2026-08-11 15:50:31'),
(5, 10, 999.99, 123.00, 123.00, 123.00, 123.00, 0.81, 3333.79, 0.00, 'Underweight', 'Underweight', '2026-08-11', NULL, NULL, NULL, '2026-08-11 16:01:31'),
(6, 10, 999.99, 123.00, 123.00, 123.00, 123.00, 0.81, 3333.79, 0.00, 'Underweight', 'Underweight', '2026-08-11', NULL, NULL, NULL, '2026-08-11 16:01:37'),
(7, 10, 999.99, 123.00, 123.00, 123.00, 123.00, 0.81, 3333.79, 0.00, 'Underweight', 'Underweight', '2026-08-11', NULL, NULL, NULL, '2026-08-11 16:02:00'),
(8, 10, 999.99, 123.00, 123.00, 123.00, 123.00, 0.81, 3333.79, 0.00, 'Underweight', 'Underweight', '2026-08-11', NULL, NULL, NULL, '2026-08-11 16:02:04'),
(9, 10, 999.99, 123.00, 123.00, 123.00, 123.00, 0.81, 3333.79, 0.00, 'Underweight', 'Underweight', '2026-08-11', NULL, NULL, NULL, '2026-08-11 16:02:11'),
(10, 11, 1.00, 1.00, 1.00, 1.00, 1.00, 999.99, 0.00, 1.00, 'Obese Class II', 'Obese', '2026-08-12', NULL, NULL, NULL, '2026-08-12 09:40:56'),
(11, 7, 1.00, 1.00, 1.00, 1.00, 1.00, 999.99, 0.00, 1.00, 'Obese Class II', 'Obese', '2026-08-12', NULL, NULL, NULL, '2026-08-12 09:48:48'),
(12, 7, 1.00, 1.00, 1.00, 1.00, 1.00, 999.99, 0.00, 1.00, 'Obese Class II', 'Obese', '2026-08-12', NULL, NULL, NULL, '2026-08-12 09:52:16'),
(13, 7, 2.00, 2.00, 2.00, 2.00, 2.00, 999.99, 0.01, 1.99, 'Obese Class II', 'Obese', '2026-08-12', NULL, NULL, NULL, '2026-08-12 09:52:45'),
(14, 7, 1.00, 1.00, 1.00, 1.00, 1.00, 999.99, 0.00, 1.00, 'Obese Class II', 'Obese', '2026-08-12', NULL, NULL, NULL, '2026-08-12 09:53:37'),
(15, 10, 4.00, 4.00, 4.00, 4.00, 4.00, 999.99, 0.04, 3.96, 'Obese Class II', 'Obese', '2026-08-12', NULL, NULL, NULL, '2026-08-12 09:56:28'),
(16, 7, 10.00, 10.00, 10.00, 10.00, 10.00, 999.99, 0.22, 9.78, 'Obese Class II', 'Obese', '2026-08-12', NULL, NULL, NULL, '2026-08-12 09:57:40'),
(17, 7, 15.00, 15.00, 15.00, 15.00, 15.00, 666.67, 0.49, 14.51, 'Obese Class II', 'Obese', '2026-08-12', NULL, NULL, NULL, '2026-08-12 09:59:03'),
(18, 7, 20.00, 20.00, 20.00, 20.00, 20.00, 500.00, 0.88, 19.12, 'Obese Class II', 'Obese', '2026-08-12', NULL, NULL, NULL, '2026-08-12 10:00:20'),
(19, 7, 5.00, 5.00, 5.00, 5.00, 5.00, 999.99, 0.06, 4.95, 'Obese Class II', 'Obese', '2026-08-12', NULL, NULL, NULL, '2026-08-12 10:01:46'),
(20, 10, 1.00, 1.00, 1.00, 1.00, 1.00, 999.99, 0.00, 1.00, 'Obese Class II', 'Obese', '2026-08-12', NULL, NULL, NULL, '2026-08-12 10:03:05'),
(21, 7, 5.00, 4.00, 5.00, 4.00, 4.00, 999.99, 0.06, 3.94, 'Obese Class II', 'Obese', '2026-08-12', NULL, NULL, NULL, '2026-08-12 10:04:23'),
(22, 7, 999.99, 213.00, 123.00, 123.00, 123.00, 1.35, 3459.54, 0.00, 'Underweight', 'Underweight', '2026-08-12', NULL, NULL, NULL, '2026-08-12 10:05:13'),
(23, 4, 5.00, 5.00, 5.00, 5.00, 55.00, 999.99, 0.06, 4.95, 'Obese Class II', 'Obese', '2026-08-12', NULL, NULL, NULL, '2026-08-12 10:12:23'),
(24, 4, 1.00, 1.00, 1.00, 1.00, 1.00, 999.99, 0.00, 1.00, 'Obese Class II', 'Obese', '2026-08-12', NULL, NULL, NULL, '2026-08-12 10:57:36'),
(25, 7, 1.00, 1.00, 1.00, 1.00, 1.00, 999.99, 0.00, 1.00, 'Obese Class II', 'Obese', '2026-08-12', NULL, NULL, NULL, '2026-08-12 10:58:24'),
(26, 1, 170.00, 65.00, 80.00, 95.00, 17.00, 22.49, 63.58, 1.42, 'Normal', 'Normal', '2026-08-12', NULL, NULL, NULL, '2026-08-12 13:11:28'),
(27, 1, 170.00, 65.00, 80.00, 95.00, 17.00, 22.49, 63.58, 1.42, 'Normal', 'Normal', '2026-08-12', NULL, NULL, NULL, '2026-08-12 13:11:39'),
(28, 1, 170.00, 65.00, 80.00, 95.00, 17.00, 22.49, 63.58, 1.42, 'Normal', 'Normal', '2026-08-12', NULL, NULL, NULL, '2026-08-12 13:11:49'),
(29, 1, 170.00, 65.00, 80.00, 95.00, 17.00, 22.49, 63.58, 1.42, 'Normal', 'Normal', '2026-08-12', NULL, NULL, NULL, '2026-08-12 13:11:59'),
(30, 1, 170.00, 65.00, 80.00, 95.00, 17.00, 22.49, 63.58, 1.42, 'Normal', 'Normal', '2026-08-12', NULL, NULL, NULL, '2026-08-12 13:12:10'),
(31, 1, 170.00, 65.00, 80.00, 95.00, 17.00, 22.49, 63.58, 1.42, 'Normal', 'Normal', '2026-08-12', NULL, NULL, NULL, '2026-08-12 13:12:20'),
(32, 1, 170.00, 65.00, 80.00, 95.00, 17.00, 22.49, 63.58, 1.42, 'Normal', 'Normal', '2026-08-12', NULL, NULL, NULL, '2026-08-12 13:12:30'),
(33, 1, 170.00, 65.00, 80.00, 95.00, 17.00, 22.49, 63.58, 1.42, 'Normal', 'Normal', '2026-08-12', NULL, NULL, NULL, '2026-08-12 13:12:41'),
(34, 1, 170.00, 65.00, 80.00, 95.00, 17.00, 22.49, 63.58, 1.42, 'Normal', 'Normal', '2026-08-12', NULL, NULL, NULL, '2026-08-12 13:12:51'),
(35, 1, 170.00, 65.00, 80.00, 95.00, 17.00, 22.49, 63.58, 1.42, 'Normal', 'Normal', '2026-08-12', NULL, NULL, NULL, '2026-08-12 13:13:01'),
(36, 1, 170.00, 65.00, 80.00, 95.00, 17.00, 22.49, 63.58, 1.42, 'Normal', 'Normal', '2026-08-12', NULL, NULL, NULL, '2026-08-12 13:13:12'),
(37, 1, 170.00, 65.00, 80.00, 95.00, 17.00, 22.49, 63.58, 1.42, 'Normal', 'Normal', '2026-08-12', NULL, NULL, NULL, '2026-08-12 13:13:22'),
(38, 1, 170.00, 65.00, 80.00, 95.00, 17.00, 22.49, 63.58, 1.42, 'Normal', 'Normal', '2026-08-12', NULL, NULL, NULL, '2026-08-12 13:13:32'),
(39, 1, 170.00, 65.00, 80.00, 95.00, 17.00, 22.49, 63.58, 1.42, 'Normal', 'Normal', '2026-08-12', NULL, NULL, NULL, '2026-08-12 14:45:54');

-- --------------------------------------------------------

--
-- Table structure for table `personnel`
--

CREATE TABLE `personnel` (
  `personnel_id` bigint(20) UNSIGNED NOT NULL,
  `rfid_uid` varchar(50) NOT NULL,
  `rank` varchar(50) NOT NULL,
  `surname` varchar(100) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `middle_initial` varchar(10) DEFAULT NULL,
  `q` varchar(20) DEFAULT NULL,
  `age` int(11) DEFAULT NULL,
  `sex` varchar(20) DEFAULT NULL,
  `office` varchar(150) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `personnel`
--

INSERT INTO `personnel` (`personnel_id`, `rfid_uid`, `rank`, `surname`, `first_name`, `middle_initial`, `q`, `age`, `sex`, `office`, `created_at`, `updated_at`) VALUES
(1, 'RFID001', 'PCPL', 'Santos', 'Juan', 'D', 'Q1', 28, 'Male', 'PNP Health Service', '2026-08-11 11:09:25', '2026-08-11 11:09:25'),
(2, 'RFID002', 'PCPL', 'Reyes', 'Miguel', 'A', 'Q1', 31, 'Male', 'PNP Health Service', '2026-08-11 15:11:49', '2026-08-11 15:11:49'),
(3, 'RFID003', 'PMAJ', 'Dela Cruz', 'Carlos', 'B', 'Q2', 35, 'Male', 'PNP Health Service', '2026-08-11 15:11:49', '2026-08-11 15:11:49'),
(4, 'RFID004', 'PSMS', 'Garcia', 'Maria', 'C', 'Q1', 29, 'Female', 'PNP Health Service', '2026-08-11 15:11:49', '2026-08-11 15:11:49'),
(5, 'RFID005', 'PCPT', 'Mendoza', 'Jose', 'D', 'Q3', 40, 'Male', 'PNP Health Service', '2026-08-11 15:11:49', '2026-08-11 15:11:49'),
(6, 'RFID006', 'PLTCOL', 'Santos', 'Roberto', 'E', 'Q2', 45, 'Male', 'PNP Health Service', '2026-08-11 15:11:49', '2026-08-11 15:11:49'),
(7, 'RFID007', 'PSSG', 'Aquino', 'Ana', 'F', 'Q1', 27, 'Female', 'PNP Health Service', '2026-08-11 15:11:49', '2026-08-11 15:11:49'),
(8, 'RFID008', 'PCPL', 'Navarro', 'Daniel', 'G', 'Q3', 33, 'Male', 'PNP Health Service', '2026-08-11 15:11:49', '2026-08-11 15:11:49'),
(9, 'RFID009', 'PSMS', 'Torres', 'Elena', 'H', 'Q2', 38, 'Female', 'PNP Health Service', '2026-08-11 15:11:49', '2026-08-11 15:11:49'),
(10, 'RFID010', 'PMAJ', 'Castillo', 'Fernando', 'I', 'Q1', 42, 'Male', 'PNP Health Service', '2026-08-11 15:11:49', '2026-08-11 15:11:49'),
(11, 'RFID011', 'PCPL', 'Villanueva', 'Sofia', 'J', 'Q3', 26, 'Female', 'PNP Health Service', '2026-08-11 15:11:49', '2026-08-11 15:11:49');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `bmi_assessments`
--
ALTER TABLE `bmi_assessments`
  ADD PRIMARY KEY (`assessment_id`),
  ADD KEY `fk_bmi_personnel` (`personnel_id`);

--
-- Indexes for table `personnel`
--
ALTER TABLE `personnel`
  ADD PRIMARY KEY (`personnel_id`),
  ADD UNIQUE KEY `rfid_uid` (`rfid_uid`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `bmi_assessments`
--
ALTER TABLE `bmi_assessments`
  MODIFY `assessment_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- AUTO_INCREMENT for table `personnel`
--
ALTER TABLE `personnel`
  MODIFY `personnel_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `bmi_assessments`
--
ALTER TABLE `bmi_assessments`
  ADD CONSTRAINT `fk_bmi_personnel` FOREIGN KEY (`personnel_id`) REFERENCES `personnel` (`personnel_id`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
