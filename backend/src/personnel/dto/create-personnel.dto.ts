import { IsNotEmpty, IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';

export class CreatePersonnelDto {
  // Optional — a QR code is generated for every personnel, so an RFID
  // card is no longer required (it can be assigned later via update).
  @IsOptional()
  @IsString()
  rfid_uid?: string | null;

  @IsNotEmpty()
  @IsString()
  rank!: string;

  @IsNotEmpty()
  @IsString()
  surname!: string;

  @IsNotEmpty()
  @IsString()
  first_name!: string;

  @IsOptional()
  @IsString()
  middle_initial?: string;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(120)
  age?: number;

  @IsNotEmpty()
  @IsString()
  sex!: string;

  @IsOptional()
  @IsString()
  office?: string;
}