import { IsEmail, IsIn, IsNotEmpty, IsString, Matches, MinLength, ValidateIf } from 'class-validator';

// Self-service signup is intentionally viewer-only (see AuthService.register)
// — this just picks which domain's viewer role the new account gets.
export const REGISTERABLE_SYSTEMS = ['bmi', 'inventory', 'pcinfo', 'intrusion', 'environment'] as const;

// Which of the above additionally require a valid, unused
// registration_keys.code (see AuthService.register/generateRegistrationKey)
// before signup is allowed — currently just PC Info, at the user's request.
export const REGISTRATION_KEY_REQUIRED_SYSTEMS: readonly string[] = ['pcinfo'];

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9_.-]+$/, {
    message: 'Username may only contain letters, numbers, underscores, dots, and hyphens.',
  })
  username!: string;

  // Gmail specifically, not just any address — matches this form's intent
  // (a personal Gmail account doubles as the password-reset destination).
  @IsEmail()
  @Matches(/^[^\s@]+@gmail\.com$/i, { message: 'Please use a Gmail address (name@gmail.com).' })
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsIn(REGISTERABLE_SYSTEMS)
  system!: (typeof REGISTERABLE_SYSTEMS)[number];

  // Required (and validated non-empty) only for systems in
  // REGISTRATION_KEY_REQUIRED_SYSTEMS — @ValidateIf skips this whole
  // chain otherwise, so it's fine to leave blank for every other system.
  @ValidateIf((o: RegisterDto) => REGISTRATION_KEY_REQUIRED_SYSTEMS.includes(o.system))
  @IsString()
  @IsNotEmpty({ message: 'A registration serial key is required for this system.' })
  serialKey?: string;
}
