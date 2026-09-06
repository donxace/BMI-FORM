-- Adds machine-lock / license-expiry / lockout / activity-tracking columns
-- to bmi_monitoring.users. `role` is deliberately left as-is (VARCHAR(50))
-- rather than narrowed to an ENUM — it already holds ~16 per-domain RBAC
-- values (admin, bmi_admin, inventory_viewer, ...) enforced in
-- backend/src/auth/guards/admin-auth.guard.ts; collapsing it to
-- ADMIN/USER would break every domain-scoped role check.

USE bmi_monitoring;

ALTER TABLE `users`
  ADD COLUMN `machine_id` VARCHAR(255) NULL AFTER `role`,
  ADD COLUMN `license_expires_at` DATE NULL AFTER `machine_id`,
  ADD COLUMN `failed_attempts` TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER `license_expires_at`,
  ADD COLUMN `last_login_at` DATETIME NULL AFTER `failed_attempts`,
  ADD COLUMN `last_activity_at` DATETIME NULL AFTER `last_login_at`,
  ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1 AFTER `last_activity_at`,
  ADD COLUMN `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER `is_active`,
  ADD COLUMN `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`,
  ADD KEY `idx_users_machine_id` (`machine_id`),
  ADD KEY `idx_users_role` (`role`),
  ADD KEY `idx_users_active` (`is_active`);
