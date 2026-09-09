import { IsIn, IsNotEmpty, IsString, Matches } from 'class-validator';
import { REGISTRATION_KEY_REQUIRED_SYSTEMS } from './register.dto';

export class RequestRegistrationKeyDto {
  @IsIn(REGISTRATION_KEY_REQUIRED_SYSTEMS)
  system!: string;

  @IsString()
  @IsNotEmpty()
  username!: string;

  @Matches(/^[^\s@]+@gmail\.com$/i, { message: 'Please use a Gmail address (name@gmail.com).' })
  email!: string;
}
