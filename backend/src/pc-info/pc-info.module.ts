import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SecurityAssessment } from './entities/security-assessment.entity';
import { SecurityAssessmentFinding } from './entities/security-assessment-finding.entity';
import { Desktop } from '../inventory-devices/entities/desktop.entity';
import { Laptop } from '../inventory-devices/entities/laptop.entity';
import { PcInfoService } from './pc-info.service';
import { PcInfoController } from './pc-info.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([SecurityAssessment, SecurityAssessmentFinding, Desktop, Laptop], 'inventory'),
  ],
  controllers: [PcInfoController],
  providers: [PcInfoService],
})
export class PcInfoModule {}
