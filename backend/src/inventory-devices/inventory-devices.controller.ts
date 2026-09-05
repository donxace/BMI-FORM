import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { InventoryDevicesService } from './inventory-devices.service';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { AgentReportDto } from './dto/agent-report.dto';

@Controller('inventory/devices')
export class InventoryDevicesController {
  constructor(private readonly inventoryDevicesService: InventoryDevicesService) {}

  @UseGuards(AdminAuthGuard)
  @Get()
  async findAll() {
    return this.inventoryDevicesService.findAll();
  }

  @UseGuards(AdminAuthGuard)
  @Get('by-personnel/:personnelId')
  async findByPersonnel(@Param('personnelId', ParseIntPipe) personnelId: number) {
    return this.inventoryDevicesService.findByPersonnel(personnelId);
  }

  // Unauthenticated on purpose, same trust model as POST /personnel/rfid/scan:
  // the local collector script has no admin session, and this can only ever
  // patch a device that was already registered through the UI (matched by
  // serial number), never create or delete one.
  @Post('agent-report')
  async agentReport(@Body() dto: AgentReportDto) {
    return this.inventoryDevicesService.reportFromAgent(dto);
  }

  @UseGuards(AdminAuthGuard)
  @Post(':deviceType')
  async create(
    @Param('deviceType') deviceType: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.inventoryDevicesService.create(deviceType, dto);
  }

  @UseGuards(AdminAuthGuard)
  @Put(':deviceType/:id')
  async update(
    @Param('deviceType') deviceType: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Record<string, any>,
  ) {
    return this.inventoryDevicesService.update(deviceType, id, dto);
  }

  @UseGuards(AdminAuthGuard)
  @Delete(':deviceType/:id')
  async remove(
    @Param('deviceType') deviceType: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.inventoryDevicesService.remove(deviceType, id);
  }
}
