import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';

import type { Response } from 'express';

import { HealthReportsService } from './health-reports.service';
import { HealthReportAccessGuard } from '../auth/guards/health-report-access.guard';

@Controller('health-reports')
export class HealthReportsController {

  constructor(
    private readonly healthReportsService: HealthReportsService,
  ) {}

  // Used to have no guard at all — any assessment's PDF (someone's BMI
  // health report) was downloadable by anyone who could increment :id.
  // Verified live against the running backend before this fix. See
  // HealthReportAccessGuard and docs/SECURITY_AND_PERFORMANCE.md.
  @UseGuards(HealthReportAccessGuard)
  @Get('bmi/:id/pdf')
  async generateBmiPdf(
    @Param('id', ParseIntPipe) id: number,
    @Query('download') download: string | undefined,
    @Res() res: Response,
  ) {
    const pdf =
      await this.healthReportsService.generateBmiPdf(id);

    /*
     * `attachment` makes iOS Safari and Android Chrome actually
     * save/share the file instead of just opening the built-in
     * viewer with no reliable save action. Previews (the iframe
     * on Measurement/MyMeasurement) still use the default
     * `inline` disposition.
     */
    const disposition = download ? 'attachment' : 'inline';

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition':
        `${disposition}; filename="bmi-${id}.pdf"`,
      'Content-Length': pdf.length,
    });

    res.end(pdf);
  }
}
