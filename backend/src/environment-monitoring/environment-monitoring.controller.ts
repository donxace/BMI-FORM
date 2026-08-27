import { Body, Controller, Get, Post } from '@nestjs/common';

import { EnvironmentMonitoringService } from './environment-monitoring.service';

@Controller('environment-monitoring')
export class EnvironmentMonitoringController {
  constructor(
    private readonly environmentMonitoringService: EnvironmentMonitoringService,
  ) {}

  // ESP32 SAVE
  @Post('reading')
  reportReading(@Body() data: any) {
    console.log('ESP32 ENVIRONMENT READING:', data);

    return this.environmentMonitoringService.reportReading(data);
  }

  @Get('latest')
  getLatest() {
    return this.environmentMonitoringService.getLatest();
  }
}
