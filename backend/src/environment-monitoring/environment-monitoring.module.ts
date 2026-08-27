import { Module } from '@nestjs/common';

import { EnvironmentMonitoringController } from './environment-monitoring.controller';
import { EnvironmentMonitoringService } from './environment-monitoring.service';

@Module({
  controllers: [EnvironmentMonitoringController],
  providers: [EnvironmentMonitoringService],
})
export class EnvironmentMonitoringModule {}
