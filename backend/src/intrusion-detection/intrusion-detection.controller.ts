import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';

import { IntrusionDetectionService } from './intrusion-detection.service';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';

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

  // No write/delete action exists in this domain yet — all three roles
  // get identical access today; the split is here so credentials are
  // consistent with the other domains and ready if that changes.
  @UseGuards(AdminAuthGuard)
  @Roles('intrusion_admin', 'intrusion_editor', 'intrusion_viewer')
  @Get('logs')
  async getLogs(@Query('limit') limit?: string) {
    const parsedLimit = limit ? Number(limit) : undefined;

    return await this.intrusionDetectionService.getLogs(
      parsedLimit && parsedLimit > 0 ? parsedLimit : undefined,
    );
  }
}
