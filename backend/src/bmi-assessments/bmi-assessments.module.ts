import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BmiAssessmentsController } from './bmi-assessments.controller';
import { BmiAssessmentsService } from './bmi-assessments.service';

import { BmiAssessment } from './entities/bmi-assessment.entity';
import { Personnel } from '../personnel/personnel.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BmiAssessment,
      Personnel,
    ]),
  ],

  controllers: [
    BmiAssessmentsController,
  ],

  providers: [
    BmiAssessmentsService,
  ],

  exports: [
    BmiAssessmentsService,
  ],
})
export class BmiAssessmentsModule {}