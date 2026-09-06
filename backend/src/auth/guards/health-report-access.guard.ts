import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

const BMI_READ_ROLES = ['admin', 'bmi_admin', 'bmi_editor', 'bmi_viewer'];

// GET /health-reports/bmi/:id/pdf used to have NO guard at all — anyone
// could download any assessment's BMI report by just incrementing the
// id in the URL, no login required (verified live against the running
// backend). See docs/SECURITY_AND_PERFORMANCE.md.
//
// Accepts the token from either the Authorization header (normal fetch
// calls) or a `?token=` query param, because this endpoint is also used
// as an <iframe src> / window.open target for in-page PDF previews — a
// browser navigation like that can't attach a custom header, so a query
// param is the only way to authenticate it at all. This trades some
// exposure (the token can end up in browser history / server access
// logs) for closing what was previously a fully open endpoint; reworking
// every preview into a fetch-blob-object-URL instead would avoid that
// but is a larger frontend change than this fix covers.
//
// A BMI-domain admin/editor/viewer (or the literal super-admin) may view
// any report. Personnel may only view their own — enforced by checking
// the assessment's owning personnel_id against the token's subject, not
// just "is this a valid personnel token."
@Injectable()
export class HealthReportAccessGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers['authorization'];
    const headerToken = authHeader?.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : null;
    const queryToken =
      typeof request.query?.token === 'string' ? request.query.token : null;
    const token = headerToken ?? queryToken;

    if (!token) {
      throw new UnauthorizedException('Missing authentication token.');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);

      if (BMI_READ_ROLES.includes(payload.role)) {
        request.user = payload;
        return true;
      }

      if (payload.role === 'personnel') {
        const assessmentId = Number(request.params.id);
        const [assessment] = await this.dataSource.query(
          'SELECT personnel_id FROM bmi_assessments WHERE assessment_id = ? LIMIT 1',
          [assessmentId],
        );
        if (!assessment || Number(assessment.personnel_id) !== Number(payload.sub)) {
          throw new UnauthorizedException();
        }
        request.user = payload;
        return true;
      }

      throw new UnauthorizedException();
    } catch {
      throw new UnauthorizedException('Invalid or expired token.');
    }
  }
}
