import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  username!: string;

  // Only used to send password-reset links — not required at login.
  @Column({ type: 'varchar', nullable: true })
  email!: string | null;

  @Column({ name: 'password_hash' })
  password_hash!: string;

  // Only ever 'admin' (the domain-less legacy super-role) or NULL —
  // every domain-specific role (bmi_viewer, pcinfo_admin, ...) lives in
  // UserRole instead, letting one account hold a role in more than one
  // domain. AdminAuthGuard checks this column first (unrestricted
  // everywhere), then falls back to the UserRole resolved at login time.
  @Column({ type: 'varchar', nullable: true })
  role!: string | null;

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

  // SHA-256 hex digest of the raw reset token, never the token itself —
  // see the migration's own comment for why this can't be bcrypt.
  @Column({ type: 'varchar', length: 64, nullable: true })
  reset_token_hash!: string | null;

  @Column({ type: 'datetime', nullable: true })
  reset_token_expires_at!: Date | null;
}