import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../user.entity';

/*
 * Replaces the old auth_logs table. One row per login/registration
 * attempt across all 5 domain logins plus personnel self-service —
 * success and failure alike, same rationale as before (this is what lets
 * an admin spot a brute-force attempt or a locked-out account after the
 * fact). `event` replaces the old login_type+success combination with a
 * single machine-readable string (see AuthService's EVENT constants) —
 * a row is a success iff `event` ends with "_success".
 */
@Entity('authentication_audit_logs')
export class AuthenticationAuditLog {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  // Resolved only when the submitted username matched a real `users` row
  // — null for personnel-type events (personnel isn't a `users` row) and
  // for admin attempts against an unknown username. ON DELETE SET NULL
  // keeps the historical row if the account is later deleted.
  // INT (not bigint) to match users.id's actual column type exactly —
  // InnoDB requires matching types for a foreign key.
  @Column({ type: 'int', nullable: true })
  user_id!: number | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User | null;

  // Whatever identifier was submitted — the admin username, or the RFID
  // UID for personnel-type events — even if it doesn't exist.
  @Column({ type: 'varchar', length: 100, nullable: true })
  username!: string | null;

  // Which of the 5 domain logins this attempt was made through (e.g.
  // 'bmi', 'inventory') — required for AuthController's per-domain log
  // scoping (a domain's own "_admin" role must only ever see its own
  // domain's rows). Null for personnel-type events, which aren't
  // domain-scoped.
  @Column({ type: 'varchar', length: 30, nullable: true })
  system!: string | null;

  @Column({ type: 'varchar', length: 100 })
  event!: string;

  // Human-readable detail — the rejection reason on failure, null on
  // most successes.
  @Column({ type: 'varchar', length: 255, nullable: true })
  result!: string | null;

  // Best-effort, from the local Machine Identity Helper — admin login
  // flow only (see AuthService.validateAndLogin); always null for
  // personnel-type events.
  @Column({ type: 'varchar', length: 255, nullable: true })
  computer_name!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  windows_user!: string | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip_address!: string | null;

  @CreateDateColumn()
  created_at!: Date;
}
