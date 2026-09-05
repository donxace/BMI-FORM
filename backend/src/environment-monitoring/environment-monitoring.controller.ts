import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';

import { EnvironmentMonitoringService } from './environment-monitoring.service';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('environment-monitoring')
export class EnvironmentMonitoringController {
  constructor(
    private readonly environmentMonitoringService: EnvironmentMonitoringService,
  ) {}

  // ESP32 SAVE
  @Post('reading')
  async reportReading(@Body() data: any) {
    console.log('ESP32 ENVIRONMENT READING:', data);

    return await this.environmentMonitoringService.reportReading(data);
  }

  @Get('latest')
  getLatest() {
    return this.environmentMonitoringService.getLatest();
  }

  // No write/delete action exists in this domain yet — all three roles
  // get identical access today; the split is here so credentials are
  // consistent with the other domains and ready if that changes.
  @UseGuards(AdminAuthGuard)
  @Roles('environment_admin', 'environment_editor', 'environment_viewer')
  @Get('logs')
  async getLogs(@Query('limit') limit?: string) {
    const parsedLimit = limit ? Number(limit) : undefined;

    return await this.environmentMonitoringService.getLogs(
      parsedLimit && parsedLimit > 0 ? parsedLimit : undefined,
    );
  }
}
