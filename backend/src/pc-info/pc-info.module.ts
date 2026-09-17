import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SecurityAssessment } from './entities/security-assessment.entity';
import { SecurityAssessmentFinding } from './entities/security-assessment-finding.entity';
import { Desktop } from '../inventory-devices/entities/desktop.entity';
import { Laptop } from '../inventory-devices/entities/laptop.entity';
import { InventoryPersonnel } from '../inventory-personnel/inventory-personnel.entity';
import { Division } from '../inventory-divisions/division.entity';
import { InventoryDevicesModule } from '../inventory-devices/inventory-devices.module';
import { PcInfoService } from './pc-info.service';
import { PcInfoController } from './pc-info.controller';
import { PcInfoRemoteController } from './pc-info-remote.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [SecurityAssessment, SecurityAssessmentFinding, Desktop, Laptop, InventoryPersonnel, Division],
      'inventory',
    ),
    // Gives PcInfoService access to InventoryDevicesService, the single
    // source of truth for the full 12-device-type itms_inventech fleet —
    // powers GET /pc-info/inventory (the "IT Inventory" section on the PC
    // Info dashboard), reusing that service instead of re-injecting all
    // 12 repositories here.
    InventoryDevicesModule,
  ],
  controllers: [PcInfoController, PcInfoRemoteController],
  providers: [PcInfoService],
})
export class PcInfoModule {}
