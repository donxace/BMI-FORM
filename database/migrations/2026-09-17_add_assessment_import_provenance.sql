-- Records who ran the "Import CSV" action and which file they uploaded,
-- so a machine's assessment history shows more than just a bare date.
-- Not a foreign key to `users` — that table lives in bmi_monitoring, a
-- separate database from itms_inventech (see app.module.ts's two
-- TypeORM connections) — so this is a denormalized username snapshot,
-- same convention as bmi_assessments' plain-text encoder/representative
-- columns.
--
-- See:
--   backend/src/pc-info/entities/security-assessment.entity.ts
--   backend/src/pc-info/pc-info.service.ts        (importAssessmentCsv,
--                                                   findAssessmentHistory)
--   backend/src/pc-info/pc-info.controller.ts

ALTER TABLE `security_assessments`
  ADD COLUMN `imported_by_username` varchar(150) DEFAULT NULL AFTER `public_ip_geo_looked_up_at`,
  ADD COLUMN `source_filename` varchar(255) DEFAULT NULL AFTER `imported_by_username`;
