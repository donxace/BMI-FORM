import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('personnel')
export class Personnel {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  personnel_id!: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  rfid_uid!: string;

  @Column({ type: 'varchar', length: 50 })
  rank!: string;

  @Column({ type: 'varchar', length: 100 })
  surname!: string;

  @Column({ type: 'varchar', length: 100 })
  first_name!: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  middle_initial!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  q!: string | null;

  @Column({ type: 'int', nullable: true })
  age!: number | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  sex!: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  office!: string | null;

  @CreateDateColumn({ type: 'datetime' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at!: Date;
}