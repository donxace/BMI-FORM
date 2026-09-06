import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;

  // Which of the 5 domain logins this request came through (e.g. 'bmi',
  // 'inventory') — used only for auth-log attribution, never for access
  // control (the role check on the account itself still governs that).
  @IsString()
  @IsOptional()
  system?: string;

  // Best-effort, from the local ITMS Machine Identity Helper
  // (frontend/src/utils/machineId.ts / backend/scripts/Get-MachineIdentityHelper.ps1).
  // Recorded on authentication_audit_logs purely for visibility into which
  // machine/Windows user a login came from — never used to gate login.
  @IsString()
  @IsOptional()
  computer_name?: string;

  @IsString()
  @IsOptional()
  windows_user?: string;
}
