import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { REGISTRATION_KEY_REQUIRED_SYSTEMS } from './register.dto';

// Step 2 of signup for a REGISTRATION_KEY_REQUIRED_SYSTEMS system (see
// AuthService.register's header comment for step 1). Every field here is
// mandatory, serialKey included — this DTO has no code path that grants
// access without one, unlike RegisterDto which never even carries this
// field. username/password re-prove it's the same account from step 1
// (or any existing account, if activating a second domain later) rather
// than trusting a bare "activate my key" call from anyone.
export class ActivateRegistrationKeyDto {
  @IsIn(REGISTRATION_KEY_REQUIRED_SYSTEMS)
  system!: string;

  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsString()
  @IsNotEmpty({ message: 'A registration serial key is required.' })
  serialKey!: string;
}
