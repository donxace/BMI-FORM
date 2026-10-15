import {
  BadRequestException,
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { InsightScope } from './bmi-insights.logic';
import { BmiInsightsService } from './bmi-insights.service';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);

const parseDate = (name: string, value?: string): string | null => {
  if (value === undefined || value === '') return null;

  // Must be a real calendar date, not just the right shape (2026-02-31).
  if (!ISO_DATE.test(value) || isoDay(Date.parse(value)) !== value) {
    throw new BadRequestException(`${name} must be a date like 2026-09-01.`);
  }

  return value;
};

/**
 * Turns the query string into an InsightScope. `from` / `to` (to is
 * exclusive) describe a range; with neither the scope is every record.
 */
export function resolveScope(query: { from?: string; to?: string }): InsightScope {
  const from = parseDate('from', query.from);
  const to = parseDate('to', query.to);

  if (from && to && from >= to) {
    throw new BadRequestException('from must be before to.');
  }

  return { from, to };
}

// Same roles that can read the assessments the dashboard is built from.
// Throttled tighter than the app default because a request can start a
// (slow) model run.
@UseGuards(AdminAuthGuard)
@Roles('bmi_admin', 'bmi_editor', 'bmi_viewer')
@Throttle({ default: { limit: 30, ttl: 60_000 } })
@Controller('bmi-insights')
export class BmiInsightsController {
  constructor(private readonly bmiInsightsService: BmiInsightsService) {}

  // Whether a local AI model is configured.
  @Get('status')
  getStatus() {
    return this.bmiInsightsService.getStatus();
  }

  @Get('dashboard')
  getDashboard(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('refresh') refresh?: string,
  ) {
    return this.bmiInsightsService.getDashboardInsights(
      resolveScope({ from, to }),
      refresh === '1' || refresh === 'true',
    );
  }
}
