-- Stores the SHT31 humidity reading sent by arduino/SAFETY_MONITOR, which
-- the Smoke & Temperature page now shows in place of the smoke level.
-- See:
--   backend/src/environment-monitoring/entities/environment-log.entity.ts
--   backend/src/environment-monitoring/environment-monitoring.service.ts
--   frontend/src/pages/EnvironmentMonitoring.tsx
--
-- Nullable with no backfill: rows logged before this migration never had
-- a humidity reading, so they stay NULL (shown as "—").

ALTER TABLE `environment_logs`
  ADD COLUMN `humidity` decimal(5,2) DEFAULT NULL AFTER `temperature`;
