import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { RegistrationKey } from './registration-key.entity';

// A /register visitor's request for a serial key (for a system that
// requires one — see REGISTRATION_KEY_REQUIRED_SYSTEMS). Stays 'pending'
// until an admin approves it (which generates and links the actual
// RegistrationKey) or rejects it outright.
@Entity('registration_key_requests')
export class RegistrationKeyRequest {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  system!: string;

  @Column()
  username!: string;

  @Column()
  email!: string;

  @Column({ default: 'pending' })
  status!: 'pending' | 'fulfilled' | 'rejected';

  @Column({ type: 'int', nullable: true })
  registration_key_id!: number | null;

  @ManyToOne(() => RegistrationKey, { nullable: true })
  @JoinColumn({ name: 'registration_key_id' })
  registration_key!: RegistrationKey | null;

  @CreateDateColumn()
  created_at!: Date;

  @Column({ type: 'datetime', nullable: true })
  resolved_at!: Date | null;
}
