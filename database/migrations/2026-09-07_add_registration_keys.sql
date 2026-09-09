-- One-time serial keys gating self-service registration for domains that
-- opt into requiring one (currently just PC Info — see
-- REGISTRATION_KEY_REQUIRED_SYSTEMS in auth.service.ts). An admin
-- generates a code ahead of time and hands it to whoever they're
-- approving; AuthService.register consumes it (marks used_by/used_at)
-- so it can never be reused, and a still-unused one can be revoked.

USE bmi_monitoring;

CREATE TABLE IF NOT EXISTS `registration_keys` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(32) NOT NULL,
  `system` VARCHAR(30) NOT NULL,
  `created_by_user_id` INT NULL,
  `used_by_user_id` INT NULL,
  `used_at` DATETIME NULL,
  `revoked_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_registration_keys_code` (`code`),
  KEY `idx_registration_keys_system` (`system`),
  CONSTRAINT `fk_registration_keys_created_by` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_registration_keys_used_by` FOREIGN KEY (`used_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
