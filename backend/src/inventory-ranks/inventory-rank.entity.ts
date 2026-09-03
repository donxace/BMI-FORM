import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('ranks')
export class InventoryRank {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  rank!: string;

  @Column({ type: 'int', default: 999 })
  sort_order!: number;
}
