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
import { AuthLog } from './entities/auth-log.entity';
import { LoginDto } from './dto/login.dto';
import { PersonnelLoginDto } from './dto/personnel-login.dto';
import { PersonnelRegisterDto } from './dto/personnel-register.dto';

export type RequestMeta = {
  ip_address: string | null;
  user_agent: string | null;
};

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Personnel)
    private readonly personnelRepository: Repository<Personnel>,
    @InjectRepository(AuthLog)
    private readonly authLogRepository: Repository<AuthLog>,
    private readonly jwtService: JwtService,
  ) {}

  /*
   * =========================================================
   * AUTH LOG — every attempt, success and failure alike. A
   * logging failure must never break the actual login flow, so
   * this swallows its own errors rather than propagating them.
   * =========================================================
   */

  private async logAttempt(entry: {
    login_type: 'admin' | 'personnel';
    system: string | null;
    identifier: string;
    role: string | null;
    success: boolean;
    failure_reason: string | null;
    meta: RequestMeta;
  }) {
    try {
      await this.authLogRepository.save(
        this.authLogRepository.create({
          login_type: entry.login_type,
          system: entry.system,
          identifier: entry.identifier,
          role: entry.role,
          success: entry.success,
          failure_reason: entry.failure_reason,
          ip_address: entry.meta.ip_address,
          user_agent: entry.meta.user_agent,
        }),
      );
    } catch (err) {
      console.warn('Failed to write auth log:', err);
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

    return this.authLogRepository.find({
      where,
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  async validateAndLogin(loginDto: LoginDto, meta: RequestMeta) {
    const username = loginDto.username?.trim();
    const password = loginDto.password?.trim();
    const identifier = username || '(empty username)';
    const system = loginDto.system?.trim() || null;

    try {
      if (!username || !password) {
        throw new UnauthorizedException('Username and password are required.');
      }

      const user = await this.userRepository.findOne({
        where: { username },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid credentials.');
      }

      let isPasswordValid = false;

      try {
        isPasswordValid = await bcrypt.compare(password, user.password_hash);
      } catch (err) {
        console.warn('Malformed stored password hash detected:', err);
        isPasswordValid = false;
      }

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials.');
      }

      const token = await this.jwtService.signAsync({
        sub: user.id,
        username: user.username,
        role: user.role,
      });

      await this.logAttempt({
        login_type: 'admin',
        system,
        identifier,
        role: user.role,
        success: true,
        failure_reason: null,
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
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        await this.logAttempt({
          login_type: 'admin',
          system,
          identifier,
          role: null,
          success: false,
          failure_reason: err.message,
          meta,
        });
      }
      throw err;
    }
  }

  /*
   * =========================================================
   * PERSONNEL SELF-SERVICE LOGIN (RFID + PIN)
   *
   * The first PIN a personnel enters for their RFID card
   * becomes their PIN going forward — there's no separate
   * enrollment step.
   * =========================================================
   */

  async personnelLogin(dto: PersonnelLoginDto, meta: RequestMeta) {
    const rfid_uid = dto.rfid_uid?.trim();
    const pin = dto.pin?.trim();
    const identifier = rfid_uid || '(empty RFID)';

    try {
      if (!rfid_uid || !pin) {
        throw new UnauthorizedException('RFID and PIN are required.');
      }

      const personnel = await this.personnelRepository
        .createQueryBuilder('personnel')
        .addSelect('personnel.pin_hash')
        .where('personnel.rfid_uid = :rfid_uid', { rfid_uid })
        .getOne();

      if (!personnel) {
        throw new UnauthorizedException('RFID card is not registered.');
      }

      if (!personnel.is_claimed) {
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
          throw new UnauthorizedException('Invalid PIN.');
        }
      }

      const token = await this.jwtService.signAsync({
        sub: personnel.personnel_id,
        rfid_uid: personnel.rfid_uid,
        role: 'personnel',
      });

      await this.logAttempt({
        login_type: 'personnel',
        system: null,
        identifier,
        role: 'personnel',
        success: true,
        failure_reason: null,
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
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        await this.logAttempt({
          login_type: 'personnel',
          system: null,
          identifier,
          role: null,
          success: false,
          failure_reason: err.message,
          meta,
        });
      }
      throw err;
    }
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
    const identifier = rfid_uid || '(empty RFID)';

    try {
      if (!rfid_uid || !pin) {
        throw new UnauthorizedException('RFID and PIN are required.');
      }

      const personnel = await this.personnelRepository.findOne({
        where: { rfid_uid },
      });

      if (!personnel) {
        throw new NotFoundException(
          'This RFID card has not been provisioned. Contact your administrator.',
        );
      }

      if (personnel.is_claimed) {
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
        login_type: 'personnel',
        system: null,
        identifier,
        role: 'personnel',
        success: true,
        failure_reason: null,
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
    } catch (err) {
      if (
        err instanceof UnauthorizedException ||
        err instanceof NotFoundException ||
        err instanceof ConflictException
      ) {
        await this.logAttempt({
          login_type: 'personnel',
          system: null,
          identifier,
          role: null,
          success: false,
          failure_reason: err.message,
          meta,
        });
      }
      throw err;
    }
  }
}
