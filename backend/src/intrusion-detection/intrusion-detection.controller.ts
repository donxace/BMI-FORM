import { Body, Controller, Get, Post } from '@nestjs/common';

import { IntrusionDetectionService } from './intrusion-detection.service';

@Controller('intrusion-detection')
export class IntrusionDetectionController {
  constructor(
    private readonly intrusionDetectionService: IntrusionDetectionService,
  ) {}

  // ESP32 SAVE
  @Post('event')
  reportEvent(@Body() data: any) {
    console.log('ESP32 INTRUSION EVENT:', data);

    return this.intrusionDetectionService.reportEvent(data);
  }

  @Get('latest')
  getLatest() {
    return this.intrusionDetectionService.getLatest();
  }
}
