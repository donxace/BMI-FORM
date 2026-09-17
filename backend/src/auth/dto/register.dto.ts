import { IsEmail, IsIn, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

// Self-service signup is intentionally viewer-only (see AuthService.register)
// — this just picks which domain's viewer role the new account gets.
export const REGISTERABLE_SYSTEMS = ['bmi', 'inventory', 'pcinfo', 'intrusion', 'environment'] as const;

// Which of the above additionally require a valid, unused
// registration_keys.code before that system's access can be granted —
// currently just PC Info, at the user's request. Enforced entirely in
// AuthService.register/activateRegistrationKey — this DTO has no
// serialKey field at all, since account creation (this DTO) and key
// activation (ActivateRegistrationKeyDto, its own endpoint) are two
// separate steps. See AuthService.register's header comment.
export const REGISTRATION_KEY_REQUIRED_SYSTEMS: readonly string[] = ['pcinfo'];

// The three tiers a registration key can grant for a given system — same
// "<system>_viewer/_editor/_admin" convention as every other domain's
// roles (see manage-user.js's VALID_ROLES). An admin picks one of these
// when generating a key or approving a request (GenerateRegistrationKeyDto
// /ApproveRegistrationKeyRequestDto), and activateRegistrationKey grants
// whichever tier the key itself was issued for — not always _viewer like
// self-registration's own role does.
export function keyRoleTiersForSystem(system: string): string[] {
  return [`${system}_viewer`, `${system}_editor`, `${system}_admin`];
}

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
}
