import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('switches')
export class Switch {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  personnel_id!: number;

  @Column({ type: 'int' })
  division_id!: number;

  @Column({ type: 'int' })
  device_id!: number;

  @Column({ type: 'varchar', length: 255 })
  manufacturer!: string;

  @Column({ type: 'varchar', length: 255 })
  model!: string;

  @Column({ type: 'varchar', length: 255 })
  serial_no!: string;

  @Column({ type: 'int' })
  no_of_ports!: number;

  @Column({ type: 'int' })
  no_of_active_ports!: number;

  @Column({ type: 'int' })
  no_of_managed!: number;

  @Column({ type: 'int' })
  no_of_unmanaged!: number;

  @Column({ type: 'varchar', length: 255 })
  firmware_version!: string;

  @Column({ type: 'boolean' })
  is_vlan_supported!: boolean;

  @Column({ type: 'varchar', length: 255 })
  location!: string;

  @Column({ type: 'boolean' })
  is_status!: boolean;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ type: 'boolean' })
  is_remote_access!: boolean;

  @Column({ type: 'text' })
  remote_connection_details!: string;

  @Column({ type: 'text' })
  remarks!: string;

  @Column({ type: 'varchar', length: 255 })
  pnp_focal_person!: string;

  @Column({ type: 'varchar', length: 50 })
  contact_details!: string;

  @Column({ type: 'date', nullable: true })
  acquisition_date!: string | null;

  @Column({ type: 'varchar', length: 255 })
  acquisition_type!: string;

  @Column({ type: 'text' })
  acquisition_details!: string;

  @Column({ type: 'longtext', nullable: true })
  previous_owners_id!: string | null;

  @Column({ type: 'date', nullable: true })
  created_date!: string | null;

  @Column({ type: 'date', nullable: true })
  last_update_at!: string | null;
}
