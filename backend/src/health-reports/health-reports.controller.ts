import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
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
    @Res() res: Response,
  ) {
    console.log('PDF REQUEST ID:', id);

    const pdf =
      await this.healthReportsService.generateBmiPdf(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition':
        `inline; filename="bmi-${id}.pdf"`,
      'Content-Length': pdf.length,
    });

    res.end(pdf);
  }
}