import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { InventoryDevicesService } from './inventory-devices.service';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';

@Controller('inventory/devices')
@UseGuards(AdminAuthGuard)
export class InventoryDevicesController {
  constructor(private readonly inventoryDevicesService: InventoryDevicesService) {}

  @Get()
  async findAll() {
    return this.inventoryDevicesService.findAll();
  }

  @Get('by-personnel/:personnelId')
  async findByPersonnel(@Param('personnelId', ParseIntPipe) personnelId: number) {
    return this.inventoryDevicesService.findByPersonnel(personnelId);
  }

  @Post(':deviceType')
  async create(
    @Param('deviceType') deviceType: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.inventoryDevicesService.create(deviceType, dto);
  }

  @Put(':deviceType/:id')
  async update(
    @Param('deviceType') deviceType: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Record<string, any>,
  ) {
    return this.inventoryDevicesService.update(deviceType, id, dto);
  }

  @Delete(':deviceType/:id')
  async remove(
    @Param('deviceType') deviceType: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.inventoryDevicesService.remove(deviceType, id);
  }
}
