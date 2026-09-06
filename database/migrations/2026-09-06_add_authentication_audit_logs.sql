-- Replaces auth_logs with a richer authentication_audit_logs table that
-- also captures the machine identity (computer_name, windows_user)
-- reported by the local ITMS Machine Identity Helper on the admin login
-- flow (see backend/scripts/Get-MachineIdentityHelper.ps1), and folds the
-- old login_type+success+failure_reason columns into one machine-readable
-- `event` string (a row is a success iff event ends with "_success" —
-- see AuthService's EVENT constants).
--
-- `system` is the one addition beyond what was originally specified —
-- required because AuthController.getLogs' per-domain scoping
-- (DOMAIN_ADMIN_SYSTEMS) filters on exactly this column; without it every
-- domain admin would see every other domain's logs.

USE bmi_monitoring;

CREATE TABLE IF NOT EXISTS authentication_audit_logs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    -- INT (not BIGINT UNSIGNED) to match users.id's actual type exactly
    -- -- InnoDB requires matching column types for a foreign key.
    user_id INT NULL,
    username VARCHAR(100) NULL,
    `system` VARCHAR(30) NULL,
    event VARCHAR(100) NOT NULL,
    result VARCHAR(255) NULL,
    computer_name VARCHAR(255) NULL,
    windows_user VARCHAR(255) NULL,
    ip_address VARCHAR(45) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_auth_audit_user (user_id),
    KEY idx_auth_audit_event (event),
    KEY idx_auth_audit_system (`system`),
    KEY idx_auth_audit_created (created_at),
    CONSTRAINT fk_auth_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Backfill existing history rather than discard it. user_id is resolved
-- opportunistically for admin-type rows whose identifier still matches a
-- current username; computer_name/windows_user stay NULL throughout —
-- that data was never captured by the old table.
INSERT INTO authentication_audit_logs (user_id, username, `system`, event, result, ip_address, created_at)
SELECT u.id, al.identifier, al.`system`,
  CASE
    WHEN al.login_type = 'admin' AND al.success = 1 THEN 'admin_login_success'
    WHEN al.login_type = 'admin' AND al.success = 0 THEN 'admin_login_failed'
    WHEN al.login_type = 'personnel' AND al.success = 1 THEN 'personnel_login_success'
    ELSE 'personnel_login_failed'
  END,
  al.failure_reason, al.ip_address, al.created_at
FROM auth_logs al
LEFT JOIN users u ON al.login_type = 'admin' AND u.username = al.identifier;

DROP TABLE auth_logs;

-- Defensive: any machine_id bound before this rollout was a random
-- browser-localStorage UUID, not a real hardware serial (see
-- docs/USER_ACCOUNT_SECURITY.md) — it can never coincidentally match a
-- real one, so clear it rather than leave an account permanently
-- unable to pass the new hardware-backed check.
UPDATE users SET machine_id = NULL WHERE machine_id IS NOT NULL;
