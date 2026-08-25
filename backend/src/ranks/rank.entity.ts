import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('ranks')
export class Rank {
  @PrimaryGeneratedColumn()
  rank_id!: number;

  @Column({ unique: true })
  rank_name!: string;

  @Column({ type: 'int' })
  hierarchy_level!: number;
}