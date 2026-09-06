import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { Personnel } from '../personnel/personnel.entity';
import { AuthenticationAuditLog } from './entities/authentication-audit-log.entity';
import { LoginDto } from './dto/login.dto';
import { PersonnelLoginDto } from './dto/personnel-login.dto';
import { PersonnelRegisterDto } from './dto/personnel-register.dto';

export type RequestMeta = {
  ip_address: string | null;
  user_agent: string | null;
};

// Consecutive bad-password attempts before an account locks out — reset
// to 0 on the next successful login. There's no self-service unlock; an
// admin has to reset failed_attempts directly.
const MAX_FAILED_ATTEMPTS = 5;

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
    // and so nothing duplicates data already owned by `users`. Only ever
    // populated for a resolved account (successful admin logins), same
    // as the old dedicated column's actual behavior.
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
      granted_role: log.user?.role ?? null,
    }));
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
      role: user.role,
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
        role: user.role,
      },
    };
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
