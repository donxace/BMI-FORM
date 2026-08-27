import { IsNotEmpty, IsString } from 'class-validator';

export class PersonnelLoginDto {
  @IsString()
  @IsNotEmpty()
  rfid_uid!: string;

  @IsString()
  @IsNotEmpty()
  pin!: string;
}
