-- Lets one account (one username/email/password) hold a role in more
-- than one domain at once, instead of a single global `users.role`.
--
-- `users.role` is kept, but narrowed to only ever hold 'admin' or NULL —
-- the legacy domain-less super-role has no per-system row of its own
-- (AdminAuthGuard already special-cases it before ever consulting a
-- role source). Every domain-specific role (bmi_viewer, pcinfo_admin,
-- ...) now lives in `user_roles`, one row per (user, system).
--
-- AuthService.validateAndLogin resolves which role to put in the JWT at
-- login time (from `user_roles` for non-admins, keyed by the `system`
-- the login request names) rather than reading a single fixed column —
-- everything downstream of that (AdminAuthGuard, @Roles(), the frontend
-- session-per-domain model) is unchanged, since a token still carries
-- exactly one role for whichever system was signed into.

USE bmi_monitoring;

ALTER TABLE `users` MODIFY COLUMN `role` VARCHAR(50) NULL DEFAULT NULL;

CREATE TABLE IF NOT EXISTS `user_roles` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `system` VARCHAR(30) NOT NULL,
  `role` VARCHAR(50) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_user_roles_user_system` (`user_id`, `system`),
  CONSTRAINT `fk_user_roles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Backfill: every existing non-admin user's single `role` becomes their
-- first user_roles row. Every role so far is "<system>_<tier>" with no
-- underscore in the system name, so splitting on the first "_" reliably
-- recovers the system (e.g. 'pcinfo_admin' -> 'pcinfo').
INSERT INTO user_roles (user_id, system, role)
SELECT id, SUBSTRING_INDEX(role, '_', 1), role
FROM users
WHERE role IS NOT NULL AND role != 'admin';

UPDATE users SET role = NULL WHERE role != 'admin';
