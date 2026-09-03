import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

// Payload the local collector script (scripts/collect-agent.js) POSTs
// after reading the host machine's hardware/OS/antivirus info. Matched
// against an existing desktops/laptops row by par_serial_no — this
// endpoint only ever updates a pre-registered device, never creates one.
export class AgentReportDto {
  @IsNotEmpty()
  @IsString()
  serial_no!: string;

  @IsOptional()
  @IsIn(['desktops', 'laptops'])
  device_type?: 'desktops' | 'laptops';

  @IsOptional()
  @IsString()
  os?: string;

  @IsOptional()
  @IsString()
  cpu_brand?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  cpu_cores?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  gb_ram?: number;

  @IsOptional()
  @IsString()
  mac_address?: string;

  @IsOptional()
  @IsString()
  ip_address?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  no_of_installed_anti_virus?: number;
}
