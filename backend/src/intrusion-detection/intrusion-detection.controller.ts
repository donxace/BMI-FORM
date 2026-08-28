import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';

import { IntrusionDetectionService } from './intrusion-detection.service';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';

@Controller('intrusion-detection')
export class IntrusionDetectionController {
  constructor(
    private readonly intrusionDetectionService: IntrusionDetectionService,
  ) {}

  // ESP32 SAVE
  @Post('event')
  async reportEvent(@Body() data: any) {
    console.log('ESP32 INTRUSION EVENT:', data);

    return await this.intrusionDetectionService.reportEvent(data);
  }

  @Get('latest')
  getLatest() {
    return this.intrusionDetectionService.getLatest();
  }

  @UseGuards(AdminAuthGuard)
  @Get('logs')
  async getLogs(@Query('limit') limit?: string) {
    const parsedLimit = limit ? Number(limit) : undefined;

    return await this.intrusionDetectionService.getLogs(
      parsedLimit && parsedLimit > 0 ? parsedLimit : undefined,
    );
  }
}
