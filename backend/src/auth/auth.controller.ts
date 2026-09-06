import { Controller, Post, Get, Body, Query, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { PersonnelLoginDto } from './dto/personnel-login.dto';
import { PersonnelRegisterDto } from './dto/personnel-register.dto';
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
}
