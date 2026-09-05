import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { InventoryPersonnelService } from './inventory-personnel.service';
import { CreateInventoryPersonnelDto } from './dto/create-inventory-personnel.dto';
import { UpdateInventoryPersonnelDto } from './dto/update-inventory-personnel.dto';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';

@Controller('inventory-personnel')
@UseGuards(AdminAuthGuard)
export class InventoryPersonnelController {
  constructor(private readonly inventoryPersonnelService: InventoryPersonnelService) {}

  @Post()
  async create(@Body() dto: CreateInventoryPersonnelDto) {
    return this.inventoryPersonnelService.create(dto);
  }

  @Get()
  async findAll() {
    return this.inventoryPersonnelService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryPersonnelService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInventoryPersonnelDto,
  ) {
    return this.inventoryPersonnelService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryPersonnelService.remove(id);
  }
}
