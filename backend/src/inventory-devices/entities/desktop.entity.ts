import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('desktops')
export class Desktop {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  personnel_id!: number;

  @Column({ type: 'int' })
  device_id!: number;

  @Column({ type: 'varchar', length: 150 })
  device_name!: string;

  @Column({ type: 'int' })
  division_id!: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ip_address!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  os!: string | null;

  @Column({ type: 'boolean', nullable: true })
  is_os_licensed!: boolean | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  os_license_key!: string | null;

  @Column({ type: 'boolean', nullable: true })
  is_remote_acc!: boolean | null;

  @Column({ type: 'longtext', nullable: true })
  endpoint_security_id!: string | null;

  @Column({ type: 'int', nullable: true })
  no_of_installed_anti_virus!: number | null;

  @Column({ type: 'date', nullable: true })
  date_installed!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  guid!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  mac_address!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  cpu_brand!: string | null;

  @Column({ type: 'int', nullable: true })
  cpu_generation!: number | null;

  @Column({ type: 'int', nullable: true })
  cpu_cores!: number | null;

  @Column({ type: 'int', nullable: true })
  gb_ram!: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  monitor_brand!: string | null;

  @Column({ type: 'int', nullable: true })
  monitor_size_inches!: number | null;

  @Column({ type: 'int', nullable: true })
  no_of_user_accounts!: number | null;

  @Column({ type: 'longtext', nullable: true })
  user_account_type!: string | null;

  @Column({ type: 'text', nullable: true })
  authorized_software!: string | null;

  @Column({ type: 'text', nullable: true })
  unauthorized_software!: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  office_application!: string | null;

  @Column({ type: 'boolean', nullable: true })
  is_office_licensed!: boolean | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  office_license_key!: string | null;

  @Column({ type: 'longtext', nullable: true })
  previous_owners_id!: string | null;

  @Column({ type: 'date', nullable: true })
  created_date!: string | null;

  @Column({ type: 'date', nullable: true })
  last_updated_at!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  par_serial_no!: string | null;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ type: 'date', nullable: true })
  acquisition_date!: string | null;
}
