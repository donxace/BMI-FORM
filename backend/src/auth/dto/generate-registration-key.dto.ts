import { IsIn } from 'class-validator';
import { REGISTERABLE_SYSTEMS } from './register.dto';

export class GenerateRegistrationKeyDto {
  @IsIn(REGISTERABLE_SYSTEMS)
  system!: (typeof REGISTERABLE_SYSTEMS)[number];
}
