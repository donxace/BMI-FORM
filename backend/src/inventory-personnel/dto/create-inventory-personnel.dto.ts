import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateInventoryPersonnelDto {
  @IsNotEmpty()
  @IsInt()
  division_id!: number;

  @IsNotEmpty()
  @IsInt()
  rank_id!: number;

  @IsNotEmpty()
  @IsString()
  first_name!: string;

  @IsOptional()
  @IsString()
  middle_name?: string;

  @IsNotEmpty()
  @IsString()
  last_name!: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
