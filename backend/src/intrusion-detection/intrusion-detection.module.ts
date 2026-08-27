import { Module } from '@nestjs/common';

import { IntrusionDetectionController } from './intrusion-detection.controller';
import { IntrusionDetectionService } from './intrusion-detection.service';

@Module({
  controllers: [IntrusionDetectionController],
  providers: [IntrusionDetectionService],
})
export class IntrusionDetectionModule {}
