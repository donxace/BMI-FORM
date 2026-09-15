import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

// One row per FOREN-style hardware/network security assessment run,
// imported via backend/scripts/import-security-assessment.js. See that
// script's header comment for the full field-by-field mapping from the
// source CSV.
@Entity('security_assessments')
export class SecurityAssessment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  serial_no!: string | null;

  @Column({ type: 'enum', enum: ['desktops', 'laptops'], nullable: true })
  device_type!: 'desktops' | 'laptops' | null;

  @Column({ type: 'int', nullable: true })
  device_id!: number | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  foren_version!: string | null;

  @Column({ type: 'boolean', nullable: true })
  ran_as_admin!: boolean | null;

  @Column({ type: 'datetime', nullable: true })
  assessed_at!: Date | null;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  duration_seconds!: number | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  motherboard_manufacturer!: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  motherboard_product!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  motherboard_serial!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  cpu_summary!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ram_manufacturer!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ram_capacity!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ram_speed!: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  gpu_name!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  gpu_vram!: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  os_edition!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  os_build!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  secure_boot_status!: string | null;

  @Column({ type: 'boolean', nullable: true })
  tpm_present!: boolean | null;

  @Column({ type: 'boolean', nullable: true })
  tpm_ready!: boolean | null;

  @Column({ type: 'boolean', nullable: true })
  tpm_enabled!: boolean | null;

  @Column({ type: 'boolean', nullable: true })
  defender_enabled!: boolean | null;

  @Column({ type: 'boolean', nullable: true })
  defender_realtime!: boolean | null;

  @Column({ type: 'boolean', nullable: true })
  firewall_domain!: boolean | null;

  @Column({ type: 'boolean', nullable: true })
  firewall_private!: boolean | null;

  @Column({ type: 'boolean', nullable: true })
  firewall_public!: boolean | null;

  @Column({ type: 'int', nullable: true })
  established_tcp_connections!: number | null;

  @Column({ type: 'int', nullable: true })
  public_remote_connections!: number | null;

  @Column({ type: 'int', nullable: true })
  foreign_destinations!: number | null;

  @Column({ type: 'int', nullable: true })
  risk_score!: number | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  risk_level!: string | null;

  // Host identity, from the export's "COMPUTER / NETWORK INFORMATION"
  // section — added alongside the real-format CSV parser rewrite, see
  // foren-csv.util.ts's file header comment for the full section mapping.
  @Column({ type: 'varchar', length: 150, nullable: true })
  hostname!: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  computer_name!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  ip_address!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  mac_address!: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  username!: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  domain_workgroup!: string | null;

  // Public IP / ISP, from the same "COMPUTER / NETWORK INFORMATION"
  // section's "WAN / Int" component — see foren-csv.util.ts's
  // buildHostIdentity. public_ip_* below is a geolocation lookup of
  // public_ip, resolved once at import time and cached here — see
  // ip-geolocation.util.ts and PcInfoService.importAssessmentCsv.
  @Column({ type: 'varchar', length: 45, nullable: true })
  public_ip!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  isp!: string | null;

  @Column({ type: 'decimal', precision: 9, scale: 6, nullable: true })
  public_ip_lat!: number | null;

  @Column({ type: 'decimal', precision: 9, scale: 6, nullable: true })
  public_ip_lon!: number | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  public_ip_city!: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  public_ip_region!: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  public_ip_country!: string | null;

  // Set whenever a lookup is attempted (success or not) so it's clear the
  // import-time lookup already ran — there's no refresh/retry path, so
  // this is a record of when, not a cache-invalidation key.
  @Column({ type: 'datetime', nullable: true })
  public_ip_geo_looked_up_at!: Date | null;

  @Column({ type: 'timestamp' })
  created_at!: Date;
}
