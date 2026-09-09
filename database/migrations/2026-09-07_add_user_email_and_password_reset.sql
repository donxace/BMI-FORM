-- Adds an email address (needed to send password-reset links) and a
-- reset-token pair to bmi_monitoring.users. The token itself is never
-- stored — only its SHA-256 hash, so a database leak alone can't be
-- used to reset an account's password. SHA-256 (not bcrypt) is used
-- here deliberately: the reset flow needs to look a token up by exact
-- match (WHERE reset_token_hash = ?), which bcrypt's per-call salt
-- makes impossible.

USE bmi_monitoring;

ALTER TABLE `users`
  ADD COLUMN `email` VARCHAR(255) NULL AFTER `username`,
  ADD COLUMN `reset_token_hash` VARCHAR(64) NULL AFTER `updated_at`,
  ADD COLUMN `reset_token_expires_at` DATETIME NULL AFTER `reset_token_hash`,
  ADD KEY `idx_users_reset_token_hash` (`reset_token_hash`);
