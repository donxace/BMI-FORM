import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { REGISTERABLE_SYSTEMS } from './register.dto';

export class GenerateRegistrationKeyDto {
  @IsIn(REGISTERABLE_SYSTEMS)
  system!: (typeof REGISTERABLE_SYSTEMS)[number];

  // Which tier this key grants (e.g. 'pcinfo_editor') — validated against
  // keyRoleTiersForSystem(system) in AuthService.generateRegistrationKey,
  // not here, since a static @IsIn can't depend on another field's value.
  @IsString()
  @IsNotEmpty({ message: 'A role is required for this key.' })
  role!: string;
}
