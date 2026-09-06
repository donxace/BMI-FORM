import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { InventoryDevicesController } from './inventory-devices.controller';
import { InventoryDevicesService } from './inventory-devices.service';

import { Camera } from './entities/camera.entity';
import { Desktop } from './entities/desktop.entity';
import { Laptop } from './entities/laptop.entity';
import { Printer } from './entities/printer.entity';
import { Router } from './entities/router.entity';
import { Switch } from './entities/switch.entity';
import { Switcher } from './entities/switcher.entity';
import { Splitter } from './entities/splitter.entity';
import { Ups } from './entities/ups.entity';
import { Firewall } from './entities/firewall.entity';
import { Headset } from './entities/headset.entity';
import { Other } from './entities/other.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [Camera, Desktop, Laptop, Printer, Router, Switch, Switcher, Splitter, Ups, Firewall, Headset, Other],
      'inventory',
    ),
  ],
  controllers: [InventoryDevicesController],
  providers: [InventoryDevicesService],
  exports: [InventoryDevicesService],
})
export class InventoryDevicesModule {}
