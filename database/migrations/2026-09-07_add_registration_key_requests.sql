-- Lets a /register visitor ask for a serial key instead of only ever
-- receiving one out-of-band from an admin. A request just records who's
-- asking (system/username/email) until an admin approves it — approval
-- generates the actual registration_keys row and links back to it here,
-- so the code's provenance (which request it was for) stays traceable.

USE bmi_monitoring;

CREATE TABLE IF NOT EXISTS `registration_key_requests` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `system` VARCHAR(30) NOT NULL,
  `username` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
  `registration_key_id` INT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `resolved_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  KEY `idx_registration_key_requests_system_status` (`system`, `status`),
  CONSTRAINT `fk_registration_key_requests_key` FOREIGN KEY (`registration_key_id`) REFERENCES `registration_keys` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
