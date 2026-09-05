import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('personnels')
export class InventoryPersonnel {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  division_id!: number;

  @Column({ type: 'int' })
  rank_id!: number;

  @Column({ type: 'varchar', length: 255 })
  first_name!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  middle_name!: string | null;

  @Column({ type: 'varchar', length: 255 })
  last_name!: string;

  @Column({ type: 'int' })
  created_by!: number;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;
}
