import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('ups')
export class Ups {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  personnel_id!: number;

  @Column({ type: 'int' })
  division_id!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  brand!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  model!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  serial_no!: string | null;

  @Column({ type: 'int', nullable: true })
  capacity_va!: number | null;

  @Column({ type: 'int', nullable: true })
  capacity_watts!: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  battery_type!: string | null;

  @Column({ type: 'int', nullable: true })
  backup_time!: number | null;

  @Column({ type: 'int', nullable: true })
  input_voltage!: number | null;

  @Column({ type: 'int', nullable: true })
  output_voltage!: number | null;

  @Column({ type: 'text', nullable: true })
  acquisition_details!: string | null;

  @Column({ type: 'date', nullable: true })
  acquisition_date!: string | null;

  @Column({ type: 'longtext', nullable: true })
  previous_owners_id!: string | null;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ type: 'date', nullable: true })
  created_date!: string | null;

  @Column({ type: 'date', nullable: true })
  last_update_at!: string | null;
}
