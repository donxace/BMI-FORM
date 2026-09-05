import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EnvironmentMonitoringController } from './environment-monitoring.controller';
import { EnvironmentMonitoringService } from './environment-monitoring.service';
import { EnvironmentLog } from './entities/environment-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EnvironmentLog])],
  controllers: [EnvironmentMonitoringController],
  providers: [EnvironmentMonitoringService],
})
export class EnvironmentMonitoringModule {}
