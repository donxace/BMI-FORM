import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('cameras')
export class Camera {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  device_code!: string;

  @Column({ type: 'int' })
  personnel_id!: number;

  @Column({ type: 'int' })
  device_id!: number;

  @Column({ type: 'int' })
  division_id!: number;

  @Column({ type: 'date', nullable: true })
  acquisition_date!: string | null;

  @Column({ type: 'text', nullable: true })
  acquisition_details!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  brand!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  model!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  serial_no!: string | null;

  @Column({ type: 'longtext', nullable: true })
  previous_owners_id!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  created_date!: Date | null;

  @Column({ type: 'date', nullable: true })
  last_update_at!: string | null;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;
}
