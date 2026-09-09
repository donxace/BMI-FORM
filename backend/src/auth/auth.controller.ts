import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { PersonnelLoginDto } from './dto/personnel-login.dto';
import { PersonnelRegisterDto } from './dto/personnel-register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RegisterDto } from './dto/register.dto';
import { GenerateRegistrationKeyDto } from './dto/generate-registration-key.dto';
import { RequestRegistrationKeyDto } from './dto/request-registration-key.dto';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { Roles } from './decorators/roles.decorator';

// Maps each domain's own admin role to the `system` value stored on its
// auth_logs rows, so a domain admin can only ever be scoped to their own
// domain's logs — this is derived from the caller's verified JWT role,
// never from client input, so one domain's admin can't request another's.
const DOMAIN_ADMIN_SYSTEMS: Record<string, string> = {
  bmi_admin: 'bmi',
  inventory_admin: 'inventory',
  pcinfo_admin: 'pcinfo',
  intrusion_admin: 'intrusion',
  environment_admin: 'environment',
};

// Best-effort real client IP behind a proxy/load balancer — falls back
// to the raw socket address for direct connections (e.g. local dev).
function getClientIp(request: Request): string | null {
  const forwarded = request.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return request.ip ?? request.socket?.remoteAddress ?? null;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 5 attempts / minute per IP — the app-wide default (600/min, see
  // app.module.ts) is far too loose to matter for brute-force protection
  // on the one credential-checking endpoint that actually needs it.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Req() request: Request) {
    return this.authService.validateAndLogin(loginDto, {
      ip_address: getClientIp(request),
      user_agent: request.headers['user-agent'] ?? null,
    });
  }

  // Public self-service signup — always grants a viewer-only role (see
  // AuthService.register); same brute-force rationale as login() above
  // for why this is throttled despite not checking a password.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('register')
  async register(@Body() dto: RegisterDto, @Req() request: Request) {
    return this.authService.register(dto, {
      ip_address: getClientIp(request),
      user_agent: request.headers['user-agent'] ?? null,
    });
  }

  // Same rationale as login() above — this one checks a 4-6 digit PIN,
  // an even smaller space that unlimited attempts would make trivial to
  // brute-force.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('personnel-login')
  async personnelLogin(@Body() dto: PersonnelLoginDto, @Req() request: Request) {
    return this.authService.personnelLogin(dto, {
      ip_address: getClientIp(request),
      user_agent: request.headers['user-agent'] ?? null,
    });
  }

  @HttpCode(HttpStatus.OK)
  @Post('personnel-register')
  async personnelRegister(@Body() dto: PersonnelRegisterDto, @Req() request: Request) {
    return this.authService.personnelRegister(dto, {
      ip_address: getClientIp(request),
      user_agent: request.headers['user-agent'] ?? null,
    });
  }

  // Same throttle rationale as login() — this triggers an email send per
  // request, which is exactly the kind of thing you don't want spammable.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Req() request: Request) {
    return this.authService.forgotPassword(dto, {
      ip_address: getClientIp(request),
      user_agent: request.headers['user-agent'] ?? null,
    });
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto, @Req() request: Request) {
    return this.authService.resetPassword(dto, {
      ip_address: getClientIp(request),
      user_agent: request.headers['user-agent'] ?? null,
    });
  }

  // There is no cross-domain "sees everything" view here — every caller,
  // including the literal 'admin' account, only ever gets back whichever
  // domain's own Auth Logs page it's viewing. A domain's own "_admin"
  // role is always forced to its own domain (DOMAIN_ADMIN_SYSTEMS,
  // derived from their verified role — never from anything the client
  // sends, so one domain's admin can't request another's). 'admin' has
  // no fixed domain of its own, so it's scoped by the `system` query
  // param that page sends instead — still page-driven, never "all".
  @UseGuards(AdminAuthGuard)
  @Roles('admin', ...Object.keys(DOMAIN_ADMIN_SYSTEMS))
  @Get('logs')
  async getLogs(
    @Query('limit') limit?: string,
    @Query('system') systemQuery?: string,
    @Req() request?: Request,
  ) {
    const parsedLimit = limit ? Number(limit) : undefined;
    const role = (request as any)?.user?.role as string | undefined;

    const requested = (systemQuery ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const system: string | string[] | undefined =
      role && role !== 'admin'
        ? DOMAIN_ADMIN_SYSTEMS[role]
        : requested.length > 1
        ? requested
        : requested[0];

    return this.authService.getLogs(
      parsedLimit && parsedLimit > 0 ? parsedLimit : undefined,
      system,
    );
  }

  // Registration keys — same scoping rule as getLogs above: a domain's
  // own "_admin" is always forced to its own system (DOMAIN_ADMIN_SYSTEMS,
  // from their verified role), never a system named in the request.
  // 'admin' has no fixed domain, so it must name one explicitly.

  @UseGuards(AdminAuthGuard)
  @Roles('admin', ...Object.keys(DOMAIN_ADMIN_SYSTEMS))
  @Post('registration-keys')
  async generateRegistrationKey(
    @Body() dto: GenerateRegistrationKeyDto,
    @Req() request: Request,
  ) {
    const role = (request as any).user.role as string;
    const userId = (request as any).user.sub as number;

    if (role !== 'admin' && dto.system !== DOMAIN_ADMIN_SYSTEMS[role]) {
      throw new ForbiddenException('You can only generate keys for your own system.');
    }

    return this.authService.generateRegistrationKey(dto, userId);
  }

  @UseGuards(AdminAuthGuard)
  @Roles('admin', ...Object.keys(DOMAIN_ADMIN_SYSTEMS))
  @Get('registration-keys')
  async listRegistrationKeys(
    @Query('system') systemQuery: string | undefined,
    @Req() request: Request,
  ) {
    const role = (request as any).user.role as string;
    const system = role !== 'admin' ? DOMAIN_ADMIN_SYSTEMS[role] : systemQuery;

    if (!system) {
      throw new ForbiddenException('A system must be specified.');
    }

    return this.authService.listRegistrationKeys(system);
  }

  @UseGuards(AdminAuthGuard)
  @Roles('admin', ...Object.keys(DOMAIN_ADMIN_SYSTEMS))
  @Post('registration-keys/:id/revoke')
  async revokeRegistrationKey(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request,
  ) {
    const role = (request as any).user.role as string;

    if (role !== 'admin') {
      const keys = await this.authService.listRegistrationKeys(DOMAIN_ADMIN_SYSTEMS[role]);
      if (!keys.some((key) => key.id === id)) {
        throw new ForbiddenException('You can only revoke keys for your own system.');
      }
    }

    return this.authService.revokeRegistrationKey(id);
  }

  // Read-only account monitoring for a domain's own admin — same scoping
  // rule as getLogs/listRegistrationKeys: a domain "_admin" is forced to
  // its own system, the literal 'admin' must name one via the query.
  @UseGuards(AdminAuthGuard)
  @Roles('admin', ...Object.keys(DOMAIN_ADMIN_SYSTEMS))
  @Get('users')
  async listUsersForSystem(
    @Query('system') systemQuery: string | undefined,
    @Req() request: Request,
  ) {
    const role = (request as any).user.role as string;
    const system = role !== 'admin' ? DOMAIN_ADMIN_SYSTEMS[role] : systemQuery;

    if (!system) {
      throw new ForbiddenException('A system must be specified.');
    }

    return this.authService.listUsersForSystem(system);
  }

  // Same scoping rule as listUsersForSystem: a domain "_admin" can only
  // ever delete accounts within their own domain, the literal 'admin'
  // must name one via the query.
  @UseGuards(AdminAuthGuard)
  @Roles('admin', ...Object.keys(DOMAIN_ADMIN_SYSTEMS))
  @Delete('users/:id')
  async deleteUserForSystem(
    @Param('id', ParseIntPipe) id: number,
    @Query('system') systemQuery: string | undefined,
    @Req() request: Request,
  ) {
    const role = (request as any).user.role as string;
    const system = role !== 'admin' ? DOMAIN_ADMIN_SYSTEMS[role] : systemQuery;
    const requestingUserId = (request as any).user.sub as number;

    if (!system) {
      throw new ForbiddenException('A system must be specified.');
    }

    return this.authService.deleteUserForSystem(id, system, requestingUserId);
  }

  // Public — this is the whole point (a /register visitor with no
  // account yet asking for a key). Throttled same as the other public
  // auth endpoints.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('registration-keys/request')
  async requestRegistrationKey(@Body() dto: RequestRegistrationKeyDto) {
    return this.authService.requestRegistrationKey(dto);
  }

  @UseGuards(AdminAuthGuard)
  @Roles('admin', ...Object.keys(DOMAIN_ADMIN_SYSTEMS))
  @Get('registration-keys/requests')
  async listRegistrationKeyRequests(
    @Query('system') systemQuery: string | undefined,
    @Query('status') status: string | undefined,
    @Req() request: Request,
  ) {
    const role = (request as any).user.role as string;
    const system = role !== 'admin' ? DOMAIN_ADMIN_SYSTEMS[role] : systemQuery;

    if (!system) {
      throw new ForbiddenException('A system must be specified.');
    }

    return this.authService.listRegistrationKeyRequests(system, status);
  }

  @UseGuards(AdminAuthGuard)
  @Roles('admin', ...Object.keys(DOMAIN_ADMIN_SYSTEMS))
  @Post('registration-keys/requests/:id/approve')
  async approveRegistrationKeyRequest(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request,
  ) {
    const role = (request as any).user.role as string;
    const userId = (request as any).user.sub as number;

    if (role !== 'admin') {
      const requests = await this.authService.listRegistrationKeyRequests(DOMAIN_ADMIN_SYSTEMS[role]);
      if (!requests.some((r) => r.id === id)) {
        throw new ForbiddenException('You can only approve requests for your own system.');
      }
    }

    return this.authService.approveRegistrationKeyRequest(id, userId);
  }

  @UseGuards(AdminAuthGuard)
  @Roles('admin', ...Object.keys(DOMAIN_ADMIN_SYSTEMS))
  @Post('registration-keys/requests/:id/reject')
  async rejectRegistrationKeyRequest(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request,
  ) {
    const role = (request as any).user.role as string;

    if (role !== 'admin') {
      const requests = await this.authService.listRegistrationKeyRequests(DOMAIN_ADMIN_SYSTEMS[role]);
      if (!requests.some((r) => r.id === id)) {
        throw new ForbiddenException('You can only reject requests for your own system.');
      }
    }

    return this.authService.rejectRegistrationKeyRequest(id);
  }
}
