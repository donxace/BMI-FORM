import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { HealthReportsController } from './health-reports.controller';
import { HealthReportsService } from './health-reports.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([]),
  ],
  controllers: [
    HealthReportsController,
  ],
  providers: [
    HealthReportsService,
  ],
})
export class HealthReportsModule {}