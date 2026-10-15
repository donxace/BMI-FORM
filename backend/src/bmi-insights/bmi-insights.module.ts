import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BmiAssessment } from '../bmi-assessments/entities/bmi-assessment.entity';
import { Personnel } from '../personnel/personnel.entity';
import { BmiInsightsController } from './bmi-insights.controller';
import { BmiInsightsService } from './bmi-insights.service';
import { BmiAssistantController } from './bmi-assistant.controller';
import { BmiAssistantService } from './bmi-assistant.service';
import { LocalLlmClient } from './local-llm.client';

@Module({
  imports: [TypeOrmModule.forFeature([BmiAssessment, Personnel])],
  controllers: [BmiInsightsController, BmiAssistantController],
  providers: [BmiInsightsService, BmiAssistantService, LocalLlmClient],
})
export class BmiInsightsModule {}
