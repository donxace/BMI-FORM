import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export class PersonnelRegisterDto {
  @IsNotEmpty()
  @IsString()
  rfid_uid!: string;

  @IsNotEmpty()
  @IsString()
  pin!: string;

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
  sex?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(120)
  age?: number;

  @IsOptional()
  @IsString()
  office?: string;

  @IsOptional()
  @IsString()
  q?: string;
}
