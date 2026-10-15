-- Gives every personnel a QR code that is independent of their RFID card:
--   - qr_code: unique, auto-generated (QR-XXXXXXXXXX) when personnel are
--     created; printed on the QR badge and looked up by
--     POST /personnel/qr/scan.
--   - rfid_uid becomes optional, so personnel can be added with only a QR
--     code and have a card assigned (or changed) later without touching
--     their QR.
-- See:
--   backend/src/personnel/personnel.entity.ts   (qr_code, @BeforeInsert)
--   backend/src/personnel/personnel.service.ts  (reportQrScan)
--   frontend/src/pages/Personnel.tsx            (QR badge)
--   frontend/src/pages/Measurement.tsx          (QR scanner)
--
-- Existing personnel are backfilled with their own random code. Their old
-- printed badges (which encoded the rfid_uid) keep working: the QR scan
-- endpoint falls back to rfid_uid when no qr_code matches.

ALTER TABLE `personnel`
  MODIFY COLUMN `rfid_uid` varchar(50) DEFAULT NULL,
  ADD COLUMN `qr_code` varchar(50) DEFAULT NULL AFTER `rfid_uid`,
  ADD UNIQUE KEY `UQ_personnel_qr_code` (`qr_code`);

UPDATE `personnel`
  SET `qr_code` = CONCAT('QR-', UPPER(SUBSTRING(MD5(CONCAT(`personnel_id`, '-', RAND())), 1, 10)))
  WHERE `qr_code` IS NULL;
