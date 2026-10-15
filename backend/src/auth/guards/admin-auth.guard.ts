
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { systemOfRole } from '../it-assets';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined =
      request.headers['authorization'];

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing authentication token.');
    }

    const token = authHeader.slice('Bearer '.length);

    let payload: any;

    try {
      payload = await this.jwtService.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token.');
    }

    // The legacy 'admin' account predates per-domain roles and is kept as
    // an unrestricted super-role so existing accounts don't get locked out.
    if (payload.role === 'admin') {
      request.user = payload;
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // A combined IT Asset Management token carries one role per part
    // (e.g. ['inventory_viewer', 'pcinfo_admin']); a normal token has one.
    const heldRoles: string[] = Array.isArray(payload.roles)
      ? payload.roles
      : [payload.role];

    const matching = requiredRoles?.length
      ? heldRoles.filter((r) => requiredRoles.includes(r))
      : heldRoles;

    if (!matching.length) {
      throw new UnauthorizedException(
        'This account does not have access to this resource.',
      );
    }

    // Downstream code reads request.user.role as THE role, so hand it the
    // one this request needs: the role for the system the request names
    // (?system= / body.system, e.g. Auth Logs, registration keys), else
    // the first held role this route accepts.
    const wanted = String(request.query?.system ?? request.body?.system ?? '')
      .split(',')
      .map((s: string) => s.trim());
    const effectiveRole =
      matching.find((r) => wanted.includes(systemOfRole(r))) ?? matching[0];

    request.user = { ...payload, role: effectiveRole };
    return true;
  }
}
