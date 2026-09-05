import { Module } from '@nestjs/common';

import { InventoryPersonnelModule } from '../inventory-personnel/inventory-personnel.module';
import { InventoryDivisionsModule } from '../inventory-divisions/inventory-divisions.module';
import { InventoryRanksModule } from '../inventory-ranks/inventory-ranks.module';
import { InventoryDevicesModule } from '../inventory-devices/inventory-devices.module';

@Module({
  imports: [
    InventoryPersonnelModule,
    InventoryDivisionsModule,
    InventoryRanksModule,
    InventoryDevicesModule,
  ],
})
export class InventoryModule {}
