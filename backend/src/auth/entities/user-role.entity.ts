import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { User } from '../user.entity';

// One row per (user, system) — how an account holds a role in more than
// one domain at once. The literal 'admin' super-role has no row here at
// all; it lives on users.role instead (see that column's own comment).
@Entity('user_roles')
@Unique(['user_id', 'system'])
export class UserRole {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  user_id!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  // e.g. 'bmi', 'pcinfo' — which domain this role applies to.
  @Column()
  system!: string;

  // The full role string, e.g. 'pcinfo_admin' — kept as the complete
  // value (not just a tier) so AdminAuthGuard's @Roles() checks and
  // DOMAIN_ADMIN_SYSTEMS lookups need no changes at all.
  @Column()
  role!: string;

  @CreateDateColumn()
  created_at!: Date;
}
