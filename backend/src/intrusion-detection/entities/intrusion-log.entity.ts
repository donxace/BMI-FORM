import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('intrusion_logs')
export class IntrusionLog {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  log_id!: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  sensor_id!: string | null;

  @Column({ type: 'varchar', length: 20 })
  status!: 'clear' | 'triggered';

  @Column({ type: 'datetime' })
  event_time!: Date;

  @CreateDateColumn({ type: 'datetime' })
  created_at!: Date;
}
