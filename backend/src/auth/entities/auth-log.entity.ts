import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

/*
 * Every login attempt across all 5 domain logins plus personnel
 * self-service — success and failure alike. Failures matter as much as
 * successes here: this is what lets an admin spot a brute-force attempt
 * or a locked-out account after the fact, which a console.log that
 * scrolls away on restart never could.
 */
@Entity('auth_logs')
export class AuthLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'enum', enum: ['admin', 'personnel'] })
  login_type!: 'admin' | 'personnel';

  // Which of the 5 domain logins this attempt was made through (e.g.
  // 'bmi', 'inventory') — set by the frontend at login time, since role
  // alone can't identify the domain (the literal 'admin' account signs
  // into any of them) and a failed attempt never resolves a role at all.
  @Column({ type: 'varchar', length: 30, nullable: true })
  system!: string | null;

  // The username attempted (admin-type logins) or the RFID UID
  // attempted (personnel logins) — whatever identifier was submitted,
  // even if it doesn't exist.
  @Column()
  identifier!: string;

  // The role actually granted on success (e.g. 'bmi_admin',
  // 'inventory_viewer', 'personnel'). Null on failure — there's nothing
  // to grant.
  @Column({ type: 'varchar', length: 50, nullable: true })
  role!: string | null;

  @Column({ default: false })
  success!: boolean;

  // Human-readable reason on failure (e.g. "Invalid credentials.",
  // "RFID card is not registered."). Null on success.
  @Column({ type: 'varchar', length: 255, nullable: true })
  failure_reason!: string | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip_address!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  user_agent!: string | null;

  @CreateDateColumn()
  created_at!: Date;
}
