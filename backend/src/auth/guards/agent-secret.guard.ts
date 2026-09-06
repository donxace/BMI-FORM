import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

// Gate for endpoints the LAN inventory-collector agent calls without any
// admin session (it has no user to log in as) — checks a shared-secret
// header instead, so hardware-facts reports can't be spoofed by anyone
// who can merely read/guess a device's serial number off its label.
@Injectable()
export class AgentSecretGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const key = request.headers['x-agent-key'];

    if (!process.env.AGENT_SHARED_SECRET) {
      throw new UnauthorizedException('Agent reporting is not configured.');
    }

    if (key !== process.env.AGENT_SHARED_SECRET) {
      throw new UnauthorizedException('Invalid agent key.');
    }

    return true;
  }
}
