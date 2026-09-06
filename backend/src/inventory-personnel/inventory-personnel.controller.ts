import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { InventoryPersonnelService } from './inventory-personnel.service';
import { CreateInventoryPersonnelDto } from './dto/create-inventory-personnel.dto';
import { UpdateInventoryPersonnelDto } from './dto/update-inventory-personnel.dto';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';

// Three inventory roles: viewer (read-only), editor (create/update, no
// delete), admin (full access including delete). Reads admit all three;
// create/update admit editor and admin; delete is admin-only, since it's
// the one irreversible action in this domain (no soft-delete/trash).
const INVENTORY_READ_ROLES = ['inventory_admin', 'inventory_editor', 'inventory_viewer'];
const INVENTORY_WRITE_ROLES = ['inventory_admin', 'inventory_editor'];

@Controller('inventory-personnel')
@UseGuards(AdminAuthGuard)
export class InventoryPersonnelController {
  constructor(private readonly inventoryPersonnelService: InventoryPersonnelService) {}

  @Roles(...INVENTORY_WRITE_ROLES)
  @Post()
  async create(@Body() dto: CreateInventoryPersonnelDto) {
    return this.inventoryPersonnelService.create(dto);
  }

  @Roles(...INVENTORY_READ_ROLES)
  @Get()
  async findAll() {
    return this.inventoryPersonnelService.findAll();
  }

  @Roles(...INVENTORY_READ_ROLES)
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryPersonnelService.findOne(id);
  }

  @Roles(...INVENTORY_WRITE_ROLES)
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInventoryPersonnelDto,
  ) {
    return this.inventoryPersonnelService.update(id, dto);
  }

  @Roles('inventory_admin')
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryPersonnelService.remove(id);
  }
}
