import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

// Gate for POST /pc-info/remote-import — a remote website pushing a FOREN
// CSV export in, with no admin session to log in as (same shape of
// problem as the LAN inventory-collector agent). Deliberately its own
// secret (PCINFO_REMOTE_SHARED_SECRET), not AGENT_SHARED_SECRET — an
// external website is a different trust boundary than a local LAN
// script; a leak or rotation of one must never affect the other.
@Injectable()
export class PcInfoRemoteSecretGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const key = request.headers['x-pcinfo-remote-key'];

    if (!process.env.PCINFO_REMOTE_SHARED_SECRET) {
      throw new UnauthorizedException('Remote PC Info import is not configured.');
    }

    if (key !== process.env.PCINFO_REMOTE_SHARED_SECRET) {
      throw new UnauthorizedException('Invalid remote import key.');
    }

    return true;
  }
}
