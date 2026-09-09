import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../user.entity';

// One-time serial key gating self-service registration for a domain that
// requires one (see REGISTRATION_KEY_REQUIRED_SYSTEMS in auth.service.ts).
@Entity('registration_keys')
export class RegistrationKey {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  code!: string;

  // Which domain this key is valid for, e.g. 'pcinfo'.
  @Column()
  system!: string;

  @Column({ type: 'int', nullable: true })
  created_by_user_id!: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by_user_id' })
  created_by!: User | null;

  @Column({ type: 'int', nullable: true })
  used_by_user_id!: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'used_by_user_id' })
  used_by!: User | null;

  @Column({ type: 'datetime', nullable: true })
  used_at!: Date | null;

  @Column({ type: 'datetime', nullable: true })
  revoked_at!: Date | null;

  @CreateDateColumn()
  created_at!: Date;
}
