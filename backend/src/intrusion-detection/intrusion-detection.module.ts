import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { IntrusionDetectionController } from './intrusion-detection.controller';
import { IntrusionDetectionService } from './intrusion-detection.service';
import { IntrusionLog } from './entities/intrusion-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([IntrusionLog])],
  controllers: [IntrusionDetectionController],
  providers: [IntrusionDetectionService],
})
export class IntrusionDetectionModule {}
