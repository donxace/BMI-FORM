import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BmiAssessment } from '../bmi-assessments/entities/bmi-assessment.entity';
import { BmiInsightsController } from './bmi-insights.controller';
import { BmiInsightsService } from './bmi-insights.service';
import { LocalLlmClient } from './local-llm.client';

@Module({
  imports: [TypeOrmModule.forFeature([BmiAssessment])],
  controllers: [BmiInsightsController],
  providers: [BmiInsightsService, LocalLlmClient],
})
export class BmiInsightsModule {}
