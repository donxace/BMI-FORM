-- Lets an admin choose which tier (viewer/editor/admin) a registration
-- key grants, instead of self-registration always being viewer-only.
-- See:
--   backend/src/auth/dto/register.dto.ts        (keyRoleTiersForSystem)
--   backend/src/auth/dto/generate-registration-key.dto.ts
--   backend/src/auth/dto/approve-registration-key-request.dto.ts
--   backend/src/auth/entities/registration-key.entity.ts
--   backend/src/auth/auth.service.ts             (generateRegistrationKey,
--                                                   approveRegistrationKeyRequest,
--                                                   activateRegistrationKey)
--
-- Existing rows default to 'pcinfo_viewer' — every key issued before this
-- migration only ever granted viewer access, so that's the correct
-- backfill value, not a guess.

ALTER TABLE `registration_keys`
  ADD COLUMN `role` varchar(50) NOT NULL DEFAULT 'pcinfo_viewer' AFTER `system`;
