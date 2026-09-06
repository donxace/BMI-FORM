import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  username!: string;

  @Column({ name: 'password_hash' })
  password_hash!: string;

  // Free-text, not an enum — holds ~16 per-domain RBAC values (admin,
  // bmi_admin, inventory_viewer, ...), enforced in AdminAuthGuard.
  @Column({ nullable: true })
  role!: string;

  // Single-machine license lock: null until this account's first login,
  // which binds it — see AuthService.validateAndLogin.
  @Column({ type: 'varchar', nullable: true })
  machine_id!: string | null;

  @Column({ type: 'date', nullable: true })
  license_expires_at!: string | null;

  @Column({ type: 'tinyint', unsigned: true, default: 0 })
  failed_attempts!: number;

  @Column({ type: 'datetime', nullable: true })
  last_login_at!: Date | null;

  @Column({ type: 'datetime', nullable: true })
  last_activity_at!: Date | null;

  @Column({ default: true })
  is_active!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}