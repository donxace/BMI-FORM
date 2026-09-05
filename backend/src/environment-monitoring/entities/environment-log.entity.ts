import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('environment_logs')
export class EnvironmentLog {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  log_id!: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  sensor_id!: string | null;

  @Column({ type: 'varchar', length: 20 })
  status!: 'normal' | 'smoke_detected' | 'high_temperature';

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  temperature!: number | null;

  @Column({ type: 'int', nullable: true })
  smoke_level!: number | null;

  @Column({ type: 'datetime' })
  event_time!: Date;

  @CreateDateColumn({ type: 'datetime' })
  created_at!: Date;
}
