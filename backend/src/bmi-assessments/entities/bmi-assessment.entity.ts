import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Personnel } from '../../personnel/personnel.entity';

@Entity('bmi_assessments')
export class BmiAssessment {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  assessment_id!: number;

  @Column({ type: 'bigint', unsigned: true })
  personnel_id!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  height!: number;

  @Column({ type: 'decimal', precision: 6, scale: 2 })
  weight!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  waist!: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  hip!: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  wrist!: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  bmi!: number | null;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  ibw!: number | null;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  weight_to_lose!: number | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  pnp_classification!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  who_classification!: string | null;

  @Column({ type: 'date' })
  assessment_date!: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  unit_representative!: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  health_service_representative!: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  encoder!: string | null;

  @CreateDateColumn({ type: 'datetime' })
  created_at!: Date;

  @ManyToOne(() => Personnel)
  @JoinColumn({ name: 'personnel_id' })
  personnel!: Personnel;
}