import { IsArray, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

// Payload the local collector scripts (collect-agent.js,
// Get-InventoryAgent.ps1) POST after reading the host machine's
// hardware/OS/antivirus info. Matched against an existing desktops/
// laptops row by par_serial_no; if no row matches, the service
// auto-registers a new one (device_name = hostname, owner/division left
// unassigned for an admin to set later) rather than rejecting the report.
export class AgentReportDto {
  @IsNotEmpty()
  @IsString()
  serial_no!: string;

  // Only used when auto-registering a brand-new device (device_name).
  // Ignored when patching an already-registered device, so it never
  // clobbers a name an admin deliberately chose.
  @IsOptional()
  @IsString()
  hostname?: string;

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

  // ==========================================================
  // FULL BELARC-STYLE INVENTORY (from scripts/Get-InventoryAgent.ps1)
  //
  // Each is an array of loosely-shaped objects — validated only as
  // "is an array", not against a strict per-item schema, since the
  // exact fields per row (e.g. a software entry's publisher/install
  // date) are optional/best-effort on the collector side. The
  // service JSON-stringifies these before saving.
  // ==========================================================

  @IsOptional()
  @IsArray()
  installed_software?: Array<Record<string, any>>;

  @IsOptional()
  @IsArray()
  missing_updates?: Array<Record<string, any>>;

  @IsOptional()
  @IsArray()
  usb_history?: Array<Record<string, any>>;

  @IsOptional()
  @IsArray()
  network_adapters?: Array<Record<string, any>>;

  @IsOptional()
  @IsArray()
  printers_detected?: Array<Record<string, any>>;

  @IsOptional()
  @IsArray()
  hotfixes?: Array<Record<string, any>>;
}
