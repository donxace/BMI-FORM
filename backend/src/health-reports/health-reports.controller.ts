import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Res,
} from '@nestjs/common';

import type { Response } from 'express';

import { HealthReportsService } from './health-reports.service';

@Controller('health-reports')
export class HealthReportsController {

  constructor(
    private readonly healthReportsService: HealthReportsService,
  ) {}

  @Get('bmi/:id/pdf')
  async generateBmiPdf(
    @Param('id', ParseIntPipe) id: number,
    @Query('download') download: string | undefined,
    @Res() res: Response,
  ) {
    console.log('PDF REQUEST ID:', id);

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