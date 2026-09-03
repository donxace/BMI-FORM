import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('divisions')
export class Division {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100 })
  division!: string;
}
