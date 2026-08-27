import { IsNotEmpty, IsString } from 'class-validator';

export class ProvisionPersonnelDto {
  @IsNotEmpty()
  @IsString()
  rfid_uid!: string;
}
