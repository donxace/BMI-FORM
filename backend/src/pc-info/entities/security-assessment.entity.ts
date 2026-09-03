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

  @Column({ type: 'timestamp' })
  created_at!: Date;
}
