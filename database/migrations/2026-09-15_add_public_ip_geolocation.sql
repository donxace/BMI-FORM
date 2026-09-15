-- Adds Public IP / ISP capture (from the FOREN export's "WAN / Int"
-- component, under "COMPUTER / NETWORK INFORMATION") and a cached
-- geolocation lookup for the Public IP, shown as a small map on the PC
-- Info assessment detail page.
--
-- Unlike every other migration in this folder, this targets `itms_inventech`
-- (the pc-info/inventory database), not `bmi_monitoring`.
--
-- See:
--   backend/src/pc-info/foren-csv.util.ts        (buildHostIdentity)
--   backend/src/pc-info/ip-geolocation.util.ts    (ip-api.com lookup)
--   backend/src/pc-info/pc-info.service.ts        (importAssessmentCsv)
--   backend/src/pc-info/entities/security-assessment.entity.ts
--
-- Applied directly to the running local dev DB when this was written;
-- also folded into database/itms_inventech.sql so a fresh
-- import/reseed reproduces the same schema.

ALTER TABLE `security_assessments`
  ADD COLUMN `public_ip` varchar(45) DEFAULT NULL AFTER `domain_workgroup`,
  ADD COLUMN `isp` varchar(255) DEFAULT NULL AFTER `public_ip`,
  ADD COLUMN `public_ip_lat` decimal(9,6) DEFAULT NULL AFTER `isp`,
  ADD COLUMN `public_ip_lon` decimal(9,6) DEFAULT NULL AFTER `public_ip_lat`,
  ADD COLUMN `public_ip_city` varchar(150) DEFAULT NULL AFTER `public_ip_lon`,
  ADD COLUMN `public_ip_region` varchar(150) DEFAULT NULL AFTER `public_ip_city`,
  ADD COLUMN `public_ip_country` varchar(150) DEFAULT NULL AFTER `public_ip_region`,
  ADD COLUMN `public_ip_geo_looked_up_at` datetime DEFAULT NULL AFTER `public_ip_country`;
