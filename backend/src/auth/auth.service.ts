import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from './user.entity';
import { Personnel } from '../personnel/personnel.entity';
import { AuthenticationAuditLog } from './entities/authentication-audit-log.entity';
import { LoginDto } from './dto/login.dto';
import { PersonnelLoginDto } from './dto/personnel-login.dto';
import { PersonnelRegisterDto } from './dto/personnel-register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RegisterDto, REGISTRATION_KEY_REQUIRED_SYSTEMS } from './dto/register.dto';
import { GenerateRegistrationKeyDto } from './dto/generate-registration-key.dto';
import { RequestRegistrationKeyDto } from './dto/request-registration-key.dto';
import { RegistrationKey } from './entities/registration-key.entity';
import { RegistrationKeyRequest } from './entities/registration-key-request.entity';
import { UserRole } from './entities/user-role.entity';
import { sendMail } from '../common/mailer';

// Self-service signup only ever grants the read-only tier of a domain —
// full access (editor/admin) still has to come from an existing admin via
// manage-user.js. Keeps an open /auth/register endpoint from being a way
// to hand yourself elevated access.
const REGISTER_ROLE_BY_SYSTEM: Record<string, string> = {
  bmi: 'bmi_viewer',
  inventory: 'inventory_viewer',
  pcinfo: 'pcinfo_viewer',
  intrusion: 'intrusion_viewer',
  environment: 'environment_viewer',
};

export type RequestMeta = {
  ip_address: string | null;
  user_agent: string | null;
};

// Consecutive bad-password attempts before an account locks out — reset
// to 0 on the next successful login. There's no self-service unlock; an
// admin has to reset failed_attempts directly.
const MAX_FAILED_ATTEMPTS = 5;

// How long a password-reset link stays valid after being requested.
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

// authentication_audit_logs.event values. A row is a success iff its
// event ends with "_success" — there's no separate boolean column, see
// the entity's own comment.
const EVENT = {
  ADMIN_LOGIN_SUCCESS: 'admin_login_success',
  ADMIN_LOGIN_FAILED: 'admin_login_failed',
  ADMIN_ACCOUNT_DISABLED: 'admin_account_disabled',
  ADMIN_LICENSE_EXPIRED: 'admin_license_expired',
  ADMIN_ACCOUNT_LOCKED: 'admin_account_locked',
  PERSONNEL_LOGIN_SUCCESS: 'personnel_login_success',
  PERSONNEL_LOGIN_FAILED: 'personnel_login_failed',
  PERSONNEL_REGISTER_SUCCESS: 'personnel_register_success',
  PERSONNEL_REGISTER_FAILED: 'personnel_register_failed',
  PASSWORD_RESET_REQUESTED: 'password_reset_requested',
  PASSWORD_RESET_SUCCESS: 'password_reset_success',
  PASSWORD_RESET_FAILED: 'password_reset_failed',
  REGISTER_SUCCESS: 'register_success',
  REGISTER_FAILED: 'register_failed',
} as const;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Personnel)
    private readonly personnelRepository: Repository<Personnel>,
    @InjectRepository(AuthenticationAuditLog)
    private readonly auditLogRepository: Repository<AuthenticationAuditLog>,
    @InjectRepository(RegistrationKey)
    private readonly registrationKeyRepository: Repository<RegistrationKey>,
    @InjectRepository(RegistrationKeyRequest)
    private readonly registrationKeyRequestRepository: Repository<RegistrationKeyRequest>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    private readonly jwtService: JwtService,
  ) {}

  /*
   * =========================================================
   * AUDIT LOG — every attempt, success and failure alike. A
   * logging failure must never break the actual login flow, so
   * this swallows its own errors rather than propagating them.
   * =========================================================
   */

  private async logAttempt(entry: {
    user_id: number | null;
    username: string | null;
    system: string | null;
    event: string;
    result: string | null;
    computer_name?: string | null;
    windows_user?: string | null;
    meta: RequestMeta;
  }) {
    try {
      await this.auditLogRepository.save(
        this.auditLogRepository.create({
          user_id: entry.user_id,
          username: entry.username,
          system: entry.system,
          event: entry.event,
          result: entry.result,
          computer_name: entry.computer_name ?? null,
          windows_user: entry.windows_user ?? null,
          ip_address: entry.meta.ip_address,
        }),
      );
    } catch (err) {
      console.warn('Failed to write authentication audit log:', err);
    }
  }

  // `system` scopes the result to one domain, or (for the Security &
  // Environment page, which covers two) a short list of them — the
  // controller always sets this, since there's no unscoped "every
  // domain at once" view any more.
  async getLogs(limit = 200, system?: string | string[]) {
    const where = Array.isArray(system)
      ? { system: In(system) }
      : system
      ? { system }
      : {};

    const logs = await this.auditLogRepository.find({
      where,
      relations: { user: true },
      order: { created_at: 'DESC' },
      take: limit,
    });

    // Role isn't stored on the log row itself — it's looked up from the
    // resolved account so a later role change doesn't rewrite history,
    // and so nothing duplicates data already owned by `users`/`user_roles`.
    // Only ever populated for a resolved account (successful admin
    // logins). A non-admin account's role now lives in UserRole (one per
    // system) rather than on users.role directly, so it's resolved per
    // (user_id, system) below rather than just read off the joined user.
    const userIds = [...new Set(logs.map((log) => log.user_id).filter((id): id is number => id !== null))];
    const roleByUserAndSystem = new Map<string, string>();

    if (userIds.length > 0) {
      const roles = await this.userRoleRepository.find({ where: { user_id: In(userIds) } });
      for (const r of roles) {
        roleByUserAndSystem.set(`${r.user_id}:${r.system}`, r.role);
      }
    }

    return logs.map((log) => ({
      id: log.id,
      user_id: log.user_id,
      username: log.username,
      system: log.system,
      event: log.event,
      result: log.result,
      computer_name: log.computer_name,
      windows_user: log.windows_user,
      ip_address: log.ip_address,
      created_at: log.created_at,
      granted_role:
        log.user?.role ??
        (log.user_id !== null && log.system !== null
          ? roleByUserAndSystem.get(`${log.user_id}:${log.system}`) ?? null
          : null),
    }));
  }

  /*
   * =========================================================
   * SELF-SERVICE SIGNUP
   *
   * Always grants that domain's viewer (read-only) role — see
   * REGISTER_ROLE_BY_SYSTEM above for why. An admin promotes the
   * account afterward (manage-user.js set-role) if it needs more.
   *
   * One username/email can hold a role in more than one domain: if both
   * already belong to the SAME existing account, this extends it (after
   * verifying the submitted password actually matches, so it can't be
   * used to graft a role onto a stranger's account) instead of rejecting
   * outright. A system in REGISTRATION_KEY_REQUIRED_SYSTEMS still needs
   * a valid key either way — extending an existing account into PC Info
   * is no less gated than creating a fresh one for it.
   * =========================================================
   */

  async register(dto: RegisterDto, meta: RequestMeta) {
    const username = dto.username.trim();
    const email = dto.email.trim().toLowerCase();
    const role = REGISTER_ROLE_BY_SYSTEM[dto.system];

    const logFailure = (result: string) =>
      this.logAttempt({
        user_id: null,
        username,
        system: dto.system,
        event: EVENT.REGISTER_FAILED,
        result,
        meta,
      });

    let registrationKey: RegistrationKey | null = null;

    if (REGISTRATION_KEY_REQUIRED_SYSTEMS.includes(dto.system)) {
      registrationKey = await this.registrationKeyRepository.findOne({
        where: { code: dto.serialKey?.trim(), system: dto.system },
      });

      if (
        !registrationKey ||
        registrationKey.used_at ||
        registrationKey.revoked_at
      ) {
        const reason = 'That serial key is invalid, already used, or has been revoked.';
        await logFailure(reason);
        throw new BadRequestException(reason);
      }
    }

    const userByUsername = await this.userRepository.findOne({ where: { username } });
    const userByEmail = await this.userRepository.findOne({ where: { email } });

    let targetUser: User;
    let isNewAccount: boolean;

    if (userByUsername && userByEmail && userByUsername.id === userByEmail.id) {
      // Same person, adding a new domain to their existing account —
      // prove it's really them before granting anything.
      const existingAccount = userByUsername;

      const passwordOk = await bcrypt
        .compare(dto.password, existingAccount.password_hash)
        .catch(() => false);

      if (!passwordOk) {
        const reason = 'Incorrect password for this existing account.';
        await logFailure(reason);
        throw new UnauthorizedException(reason);
      }

      if (!existingAccount.is_active) {
        const reason = 'This account has been disabled.';
        await logFailure(reason);
        throw new UnauthorizedException(reason);
      }

      if (existingAccount.role === 'admin') {
        const reason = 'This account already has access to every system.';
        await logFailure(reason);
        throw new ConflictException(reason);
      }

      const alreadyHasRole = await this.userRoleRepository.findOne({
        where: { user_id: existingAccount.id, system: dto.system },
      });

      if (alreadyHasRole) {
        const reason = 'This account already has access to this system. Please sign in instead.';
        await logFailure(reason);
        throw new ConflictException(reason);
      }

      targetUser = existingAccount;
      isNewAccount = false;
    } else if (userByUsername || userByEmail) {
      const reason = userByUsername
        ? 'That username is already taken.'
        : 'That email is already registered to a different account.';
      await logFailure(reason);
      throw new ConflictException(reason);
    } else {
      targetUser = this.userRepository.create({
        username,
        email,
        password_hash: await bcrypt.hash(dto.password, 10),
        role: null,
      });
      await this.userRepository.save(targetUser);
      isNewAccount = true;
    }

    await this.userRoleRepository.save(
      this.userRoleRepository.create({ user_id: targetUser.id, system: dto.system, role }),
    );

    if (registrationKey) {
      registrationKey.used_by_user_id = targetUser.id;
      registrationKey.used_at = new Date();
      await this.registrationKeyRepository.save(registrationKey);
    }

    const token = await this.jwtService.signAsync({
      sub: targetUser.id,
      username: targetUser.username,
      role,
    });

    await this.logAttempt({
      user_id: targetUser.id,
      username: targetUser.username,
      system: dto.system,
      event: EVENT.REGISTER_SUCCESS,
      result: null,
      meta,
    });

    return {
      message: isNewAccount ? 'Account created' : 'Access granted to your existing account',
      token,
      user: {
        id: targetUser.id,
        username: targetUser.username,
        role,
      },
    };
  }

  /*
   * =========================================================
   * REGISTRATION KEYS (admin-managed, gates self-service signup
   * for whichever systems are in REGISTRATION_KEY_REQUIRED_SYSTEMS)
   * =========================================================
   */

  private generateKeyCode(): string {
    // Groups of 4 uppercase alphanumerics, dash-separated (e.g.
    // "7F3K-9QXZ-M2LP") — short enough to read aloud/type by hand, long
    // enough (3 * 36^4 ≈ 5.6M combinations) that guessing one is
    // impractical, especially paired with the login throttle.
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I
    const randomGroup = () =>
      Array.from({ length: 4 }, () => alphabet[crypto.randomInt(alphabet.length)]).join('');
    return `${randomGroup()}-${randomGroup()}-${randomGroup()}`;
  }

  async generateRegistrationKey(dto: GenerateRegistrationKeyDto, createdByUserId: number) {
    // Collisions are astronomically unlikely given the code space, but
    // the unique index is the real guarantee — retry once on the off
    // chance one is hit rather than surfacing a raw DB error.
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = this.generateKeyCode();
      const exists = await this.registrationKeyRepository.findOne({ where: { code } });
      if (exists) continue;

      const key = this.registrationKeyRepository.create({
        code,
        system: dto.system,
        created_by_user_id: createdByUserId,
      });
      return this.registrationKeyRepository.save(key);
    }

    throw new BadRequestException('Could not generate a unique key — try again.');
  }

  async listRegistrationKeys(system: string) {
    const keys = await this.registrationKeyRepository.find({
      where: { system },
      relations: { created_by: true, used_by: true },
      order: { created_at: 'DESC' },
    });

    return keys.map((key) => ({
      id: key.id,
      code: key.code,
      system: key.system,
      created_by: key.created_by?.username ?? null,
      used_by: key.used_by?.username ?? null,
      used_at: key.used_at,
      revoked_at: key.revoked_at,
      created_at: key.created_at,
    }));
  }

  async revokeRegistrationKey(id: number) {
    const key = await this.registrationKeyRepository.findOne({ where: { id } });

    if (!key) {
      throw new NotFoundException('Registration key not found.');
    }

    if (key.used_at) {
      throw new BadRequestException('This key has already been used and cannot be revoked.');
    }

    key.revoked_at = new Date();
    await this.registrationKeyRepository.save(key);

    return { message: 'Key revoked.' };
  }

  /*
   * =========================================================
   * REGISTRATION KEY REQUESTS
   *
   * The self-service half of the flow above: a /register visitor asks
   * for a key instead of only ever getting one handed to them out of
   * band. Stays 'pending' until an admin approves (generates + emails
   * the actual key) or rejects it.
   * =========================================================
   */

  async requestRegistrationKey(dto: RequestRegistrationKeyDto) {
    const generic = {
      message: 'Your request has been sent to an administrator. You will receive a serial key by email once approved.',
    };

    // One outstanding request per email+system at a time — resubmitting
    // just means "still waiting," not a second ticket to review.
    const existingPending = await this.registrationKeyRequestRepository.findOne({
      where: { system: dto.system, email: dto.email.trim().toLowerCase(), status: 'pending' },
    });

    if (existingPending) {
      return generic;
    }

    const request = this.registrationKeyRequestRepository.create({
      system: dto.system,
      username: dto.username.trim(),
      email: dto.email.trim().toLowerCase(),
    });
    await this.registrationKeyRequestRepository.save(request);

    return generic;
  }

  async listRegistrationKeyRequests(system: string, status?: string) {
    return this.registrationKeyRequestRepository.find({
      where: status ? { system, status: status as any } : { system },
      order: { created_at: 'DESC' },
    });
  }

  async approveRegistrationKeyRequest(id: number, adminUserId: number) {
    const request = await this.registrationKeyRequestRepository.findOne({ where: { id } });

    if (!request) {
      throw new NotFoundException('Registration key request not found.');
    }

    if (request.status !== 'pending') {
      throw new BadRequestException('This request has already been resolved.');
    }

    const key = await this.generateRegistrationKey({ system: request.system as any }, adminUserId);

    request.status = 'fulfilled';
    request.registration_key_id = key.id;
    request.resolved_at = new Date();
    await this.registrationKeyRequestRepository.save(request);

    try {
      await sendMail({
        to: request.email,
        subject: 'Your BMI-FORM registration serial key',
        text: `Your request to register for PC Information System has been approved. Use this serial key when creating your account:\n\n${key.code}\n\nThis key can only be used once.`,
        html: `<p>Your request to register for PC Information System has been approved. Use this serial key when creating your account:</p><p style="font-size:18px;font-weight:700;letter-spacing:1px;">${key.code}</p><p>This key can only be used once.</p>`,
      });
    } catch (err) {
      // Same fallback as forgotPassword — the key still exists and is
      // shown in the admin UI either way, so a mail outage doesn't block
      // approval, just the automatic notification.
      console.error('Failed to email registration key:', err);
    }

    return { request, key };
  }

  // Read-only monitoring list for an admin — which accounts exist for
  // their domain and what email (if any) each registered with. Never
  // returns password_hash or reset_token_hash.
  async listUsersForSystem(system: string) {
    // A role for this domain now lives in UserRole (one account can hold
    // a role in more than one domain), not on users.role directly.
    const roles = await this.userRoleRepository.find({
      where: { system },
      relations: { user: true },
      order: { created_at: 'DESC' },
    });

    return roles.map((r) => ({
      id: r.user.id,
      username: r.user.username,
      email: r.user.email,
      role: r.role,
      is_active: r.user.is_active,
      last_login_at: r.user.last_login_at,
      created_at: r.user.created_at,
    }));
  }

  // Removes one account's access to a single domain — mirrors
  // manage-user.js's remove-role. If that was the account's only
  // remaining domain (and it isn't the unrestricted 'admin' role),
  // the base user row is deleted too, so a fully-deprovisioned account
  // doesn't linger as an orphaned row nobody can see or manage.
  async deleteUserForSystem(userId: number, system: string, requestingUserId: number) {
    if (userId === requestingUserId) {
      throw new BadRequestException('You cannot delete your own account.');
    }

    const userRole = await this.userRoleRepository.findOne({
      where: { user_id: userId, system },
    });

    if (!userRole) {
      throw new NotFoundException('This account has no access to this system.');
    }

    await this.userRoleRepository.delete({ id: userRole.id });

    const remainingRoles = await this.userRoleRepository.count({ where: { user_id: userId } });

    if (remainingRoles === 0) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (user && user.role !== 'admin') {
        await this.userRepository.delete({ id: userId });
      }
    }

    return { message: 'Account removed.' };
  }

  async rejectRegistrationKeyRequest(id: number) {
    const request = await this.registrationKeyRequestRepository.findOne({ where: { id } });

    if (!request) {
      throw new NotFoundException('Registration key request not found.');
    }

    if (request.status !== 'pending') {
      throw new BadRequestException('This request has already been resolved.');
    }

    request.status = 'rejected';
    request.resolved_at = new Date();
    await this.registrationKeyRequestRepository.save(request);

    return { message: 'Request rejected.' };
  }

  async validateAndLogin(loginDto: LoginDto, meta: RequestMeta) {
    const username = loginDto.username?.trim();
    const password = loginDto.password?.trim();
    const identifier = username || null;
    const system = loginDto.system?.trim() || null;
    const computer_name = loginDto.computer_name?.trim() || null;
    const windows_user = loginDto.windows_user?.trim() || null;

    const logFailure = (userId: number | null, event: string, result: string) =>
      this.logAttempt({
        user_id: userId,
        username: identifier,
        system,
        event,
        result,
        computer_name,
        windows_user,
        meta,
      });

    if (!username || !password) {
      await logFailure(null, EVENT.ADMIN_LOGIN_FAILED, 'Username and password are required.');
      throw new UnauthorizedException('Username and password are required.');
    }

    const user = await this.userRepository.findOne({ where: { username } });

    if (!user) {
      await logFailure(null, EVENT.ADMIN_LOGIN_FAILED, 'Invalid credentials.');
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (!user.is_active) {
      await logFailure(user.id, EVENT.ADMIN_ACCOUNT_DISABLED, 'This account has been disabled.');
      throw new UnauthorizedException('This account has been disabled.');
    }

    if (user.license_expires_at && user.license_expires_at < new Date().toISOString().slice(0, 10)) {
      await logFailure(user.id, EVENT.ADMIN_LICENSE_EXPIRED, "This account's license has expired.");
      throw new UnauthorizedException("This account's license has expired.");
    }

    if (user.failed_attempts >= MAX_FAILED_ATTEMPTS) {
      await logFailure(
        user.id,
        EVENT.ADMIN_ACCOUNT_LOCKED,
        'This account has been locked due to too many failed login attempts.',
      );
      throw new UnauthorizedException(
        'This account has been locked due to too many failed login attempts. Contact an administrator.',
      );
    }

    let isPasswordValid = false;

    try {
      isPasswordValid = await bcrypt.compare(password, user.password_hash);
    } catch (err) {
      console.warn('Malformed stored password hash detected:', err);
      isPasswordValid = false;
    }

    if (!isPasswordValid) {
      user.failed_attempts += 1;
      await this.userRepository.save(user);
      await logFailure(user.id, EVENT.ADMIN_LOGIN_FAILED, 'Invalid credentials.');
      throw new UnauthorizedException('Invalid credentials.');
    }

    // The literal 'admin' super-role has no per-system row (unrestricted
    // everywhere); everyone else's role now lives in UserRole, one per
    // domain, so the request has to say which domain it's signing into.
    let resolvedRole = user.role;

    if (resolvedRole !== 'admin') {
      if (!system) {
        await logFailure(user.id, EVENT.ADMIN_LOGIN_FAILED, 'A system must be specified to sign in.');
        throw new UnauthorizedException('A system must be specified to sign in.');
      }

      const userRole = await this.userRoleRepository.findOne({ where: { user_id: user.id, system } });

      if (!userRole) {
        await logFailure(user.id, EVENT.ADMIN_LOGIN_FAILED, 'This account does not have access to this system.');
        throw new UnauthorizedException('This account does not have access to this system.');
      }

      resolvedRole = userRole.role;
    }

    // No machine-lock enforcement — the identity helper's computer_name/
    // windows_user are captured purely for the audit log (logAttempt
    // below), never used to gate login. `users.machine_id` is left
    // untouched here; it's no longer written to or checked.
    user.failed_attempts = 0;
    user.last_login_at = new Date();
    user.last_activity_at = new Date();
    await this.userRepository.save(user);

    const token = await this.jwtService.signAsync({
      sub: user.id,
      username: user.username,
      role: resolvedRole,
    });

    await this.logAttempt({
      user_id: user.id,
      username: user.username,
      system,
      event: EVENT.ADMIN_LOGIN_SUCCESS,
      result: null,
      computer_name,
      windows_user,
      meta,
    });

    return {
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: resolvedRole,
      },
    };
  }

  /*
   * =========================================================
   * FORGOT / RESET PASSWORD
   *
   * forgotPassword always returns the same generic message whether or
   * not the identifier matched an account — never reveals which
   * usernames/emails exist. reset-password link only ever gets emailed
   * to the account's own registered address, never returned in the API
   * response itself.
   * =========================================================
   */

  async forgotPassword(dto: ForgotPasswordDto, meta: RequestMeta) {
    const identifier = dto.identifier?.trim();
    const generic = {
      message:
        'If an account matches that username or email, a password reset link has been sent to its registered email address.',
    };

    if (!identifier) {
      return generic;
    }

    const user = await this.userRepository.findOne({
      where: [{ username: identifier }, { email: identifier }],
    });

    // No account, or the account has no email on file to send to — either
    // way, say nothing that would let someone probe for valid accounts.
    if (!user || !user.email) {
      return generic;
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    user.reset_token_hash = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.reset_token_expires_at = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await this.userRepository.save(user);

    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5174').replace(/\/$/, '');
    const resetLink = `${frontendUrl}/reset-password?token=${rawToken}`;

    try {
      await sendMail({
        to: user.email,
        subject: 'Reset your BMI-FORM password',
        text: `A password reset was requested for the account "${user.username}". This link expires in 30 minutes:\n\n${resetLink}\n\nIf you didn't request this, you can ignore this email.`,
        html: `<p>A password reset was requested for the account <strong>${user.username}</strong>. This link expires in 30 minutes:</p><p><a href="${resetLink}">${resetLink}</a></p><p>If you didn't request this, you can ignore this email.</p>`,
      });

      await this.logAttempt({
        user_id: user.id,
        username: user.username,
        system: null,
        event: EVENT.PASSWORD_RESET_REQUESTED,
        result: null,
        meta,
      });
    } catch (err) {
      // The token is already saved — an admin can still work around a
      // mail outage with manage-user.js set-password. Log server-side
      // for visibility, but the caller still gets the generic message.
      console.error('Failed to send password reset email:', err);
      await this.logAttempt({
        user_id: user.id,
        username: user.username,
        system: null,
        event: EVENT.PASSWORD_RESET_FAILED,
        result: err instanceof Error ? err.message : 'Failed to send email.',
        meta,
      });
    }

    return generic;
  }

  async resetPassword(dto: ResetPasswordDto, meta: RequestMeta) {
    const token = dto.token?.trim();

    if (!token) {
      throw new BadRequestException('A reset token is required.');
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await this.userRepository.findOne({ where: { reset_token_hash: tokenHash } });

    if (
      !user ||
      !user.reset_token_expires_at ||
      user.reset_token_expires_at.getTime() < Date.now()
    ) {
      await this.logAttempt({
        user_id: user?.id ?? null,
        username: user?.username ?? null,
        system: null,
        event: EVENT.PASSWORD_RESET_FAILED,
        result: 'Invalid or expired reset token.',
        meta,
      });
      throw new BadRequestException(
        'This reset link is invalid or has expired. Request a new one.',
      );
    }

    user.password_hash = await bcrypt.hash(dto.password, 10);
    user.reset_token_hash = null;
    user.reset_token_expires_at = null;
    user.failed_attempts = 0;
    await this.userRepository.save(user);

    await this.logAttempt({
      user_id: user.id,
      username: user.username,
      system: null,
      event: EVENT.PASSWORD_RESET_SUCCESS,
      result: null,
      meta,
    });

    return { message: 'Your password has been reset. You can now sign in.' };
  }

  /*
   * =========================================================
   * PERSONNEL SELF-SERVICE LOGIN (RFID + PIN)
   *
   * The first PIN a personnel enters for their RFID card
   * becomes their PIN going forward — there's no separate
   * enrollment step.
   *
   * computer_name/windows_user are never captured here — this
   * flow runs from a shared kiosk terminal, not a
   * per-admin machine, so the identity helper isn't queried.
   * =========================================================
   */

  async personnelLogin(dto: PersonnelLoginDto, meta: RequestMeta) {
    const rfid_uid = dto.rfid_uid?.trim();
    const pin = dto.pin?.trim();
    const identifier = rfid_uid || null;

    const logFailure = (result: string) =>
      this.logAttempt({
        user_id: null,
        username: identifier,
        system: null,
        event: EVENT.PERSONNEL_LOGIN_FAILED,
        result,
        meta,
      });

    if (!rfid_uid || !pin) {
      await logFailure('RFID and PIN are required.');
      throw new UnauthorizedException('RFID and PIN are required.');
    }

    const personnel = await this.personnelRepository
      .createQueryBuilder('personnel')
      .addSelect('personnel.pin_hash')
      .where('personnel.rfid_uid = :rfid_uid', { rfid_uid })
      .getOne();

    if (!personnel) {
      await logFailure('RFID card is not registered.');
      throw new UnauthorizedException('RFID card is not registered.');
    }

    if (!personnel.is_claimed) {
      await logFailure(
        'This card has not been registered yet. Please complete registration first.',
      );
      throw new UnauthorizedException(
        'This card has not been registered yet. Please complete registration first.',
      );
    }

    if (!personnel.pin_hash) {
      // First-time use: the PIN entered now becomes the account's PIN.
      personnel.pin_hash = await bcrypt.hash(pin, 10);
      await this.personnelRepository.save(personnel);
    } else {
      const isPinValid = await bcrypt.compare(pin, personnel.pin_hash);

      if (!isPinValid) {
        await logFailure('Invalid PIN.');
        throw new UnauthorizedException('Invalid PIN.');
      }
    }

    const token = await this.jwtService.signAsync({
      sub: personnel.personnel_id,
      rfid_uid: personnel.rfid_uid,
      role: 'personnel',
    });

    await this.logAttempt({
      user_id: null,
      username: identifier,
      system: null,
      event: EVENT.PERSONNEL_LOGIN_SUCCESS,
      result: null,
      meta,
    });

    return {
      message: 'Login successful',
      token,
      user: {
        personnel_id: personnel.personnel_id,
        rfid_uid: personnel.rfid_uid,
        rank: personnel.rank,
        surname: personnel.surname,
        first_name: personnel.first_name,
        role: 'personnel',
      },
    };
  }

  /*
   * =========================================================
   * PERSONNEL SELF-REGISTRATION (claim a provisioned card)
   *
   * An admin must have already provisioned the rfid_uid (see
   * PersonnelService.provision) — this fills in the profile and
   * PIN for that card and logs the person in, in one step.
   * =========================================================
   */

  async personnelRegister(dto: PersonnelRegisterDto, meta: RequestMeta) {
    const rfid_uid = dto.rfid_uid?.trim();
    const pin = dto.pin?.trim();
    const identifier = rfid_uid || null;

    const logFailure = (result: string) =>
      this.logAttempt({
        user_id: null,
        username: identifier,
        system: null,
        event: EVENT.PERSONNEL_REGISTER_FAILED,
        result,
        meta,
      });

    if (!rfid_uid || !pin) {
      await logFailure('RFID and PIN are required.');
      throw new UnauthorizedException('RFID and PIN are required.');
    }

    const personnel = await this.personnelRepository.findOne({
      where: { rfid_uid },
    });

    if (!personnel) {
      await logFailure('This RFID card has not been provisioned. Contact your administrator.');
      throw new NotFoundException(
        'This RFID card has not been provisioned. Contact your administrator.',
      );
    }

    if (personnel.is_claimed) {
      await logFailure('This card is already registered. Please sign in instead.');
      throw new ConflictException(
        'This card is already registered. Please sign in instead.',
      );
    }

    personnel.rank = dto.rank;
    personnel.surname = dto.surname;
    personnel.first_name = dto.first_name;
    personnel.middle_initial = dto.middle_initial ?? null;
    personnel.sex = dto.sex ?? null;
    personnel.age = dto.age ?? null;
    personnel.office = dto.office ?? null;
    personnel.q = dto.q ?? null;
    personnel.pin_hash = await bcrypt.hash(pin, 10);
    personnel.is_claimed = true;

    await this.personnelRepository.save(personnel);

    const token = await this.jwtService.signAsync({
      sub: personnel.personnel_id,
      rfid_uid: personnel.rfid_uid,
      role: 'personnel',
    });

    await this.logAttempt({
      user_id: null,
      username: identifier,
      system: null,
      event: EVENT.PERSONNEL_REGISTER_SUCCESS,
      result: null,
      meta,
    });

    return {
      message: 'Registration successful',
      token,
      user: {
        personnel_id: personnel.personnel_id,
        rfid_uid: personnel.rfid_uid,
        rank: personnel.rank,
        surname: personnel.surname,
        first_name: personnel.first_name,
        role: 'personnel',
      },
    };
  }
}
