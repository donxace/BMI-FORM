import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { InventoryPersonnelController } from './inventory-personnel.controller';
import { InventoryPersonnelService } from './inventory-personnel.service';
import { InventoryPersonnel } from './inventory-personnel.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([InventoryPersonnel], 'inventory'),
  ],
  controllers: [
    InventoryPersonnelController,
  ],
  providers: [
    InventoryPersonnelService,
  ],
  exports: [
    InventoryPersonnelService,
  ],
})
export class InventoryPersonnelModule {}
