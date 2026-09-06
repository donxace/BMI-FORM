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
}