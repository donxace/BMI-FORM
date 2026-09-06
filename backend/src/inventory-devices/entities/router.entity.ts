import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('routers')
export class Router {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  personnel_id!: number;

  @Column({ type: 'int' })
  device_id!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  manufacturer!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  model!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  serial_no!: string | null;

  @Column({ type: 'int', nullable: true })
  no_of_ports!: number | null;

  @Column({ type: 'int', nullable: true })
  no_of_active_ports!: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  active_port_ip_address_range!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  firmware_version!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location!: string | null;

  @Column({ type: 'boolean' })
  is_active!: boolean;

  @Column({ type: 'boolean', nullable: true })
  is_remotely_accessible!: boolean | null;

  @Column({ type: 'text', nullable: true })
  remote_connection_details!: string | null;

  @Column({ type: 'text', nullable: true })
  remarks!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  pnp_focal_person!: string | null;

  @Column({ type: 'int', nullable: true })
  contact_details!: number | null;

  @Column({ type: 'date', nullable: true })
  acquisition_date!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  acquisition_type!: string | null;

  @Column({ type: 'longtext', nullable: true })
  previous_owners_id!: string | null;

  @Column({ type: 'date', nullable: true })
  created_date!: string | null;

  @Column({ type: 'date', nullable: true })
  last_update_at!: string | null;

  @Column({ type: 'int' })
  division_id!: number;
}
