import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe, Put, UseGuards } from '@nestjs/common';
import { PersonnelService } from './personnel.service';
import { CreatePersonnelDto } from './dto/create-personnel.dto';
import { UpdatePersonnelDto } from './dto/update-personnel.dto';
import { ProvisionPersonnelDto } from './dto/provision-personnel.dto';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';

// Three BMI roles: viewer (read-only), editor (create/update, no
// delete), admin (full access including delete) — same pattern as the
// Hardware Inventory domain.
const BMI_READ_ROLES = ['bmi_admin', 'bmi_editor', 'bmi_viewer'];
const BMI_WRITE_ROLES = ['bmi_admin', 'bmi_editor'];

@Controller('personnel')
export class PersonnelController {
  constructor(private readonly personnelService: PersonnelService) {}

  @UseGuards(AdminAuthGuard)
  @Roles(...BMI_WRITE_ROLES)
  @Post()
  async createPersonnel(@Body() createDto: CreatePersonnelDto) {
    return this.personnelService.create(createDto);
  }

  // ADMIN/EDITOR: register a blank RFID card for later self-registration
  @UseGuards(AdminAuthGuard)
  @Roles(...BMI_WRITE_ROLES)
  @Post('provision')
  async provision(@Body() dto: ProvisionPersonnelDto) {
    return this.personnelService.provision(dto);
  }

  @UseGuards(AdminAuthGuard)
  @Roles(...BMI_WRITE_ROLES)
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdatePersonnelDto,
  ) {
    return this.personnelService.update(id, updateDto);
  }

  @UseGuards(AdminAuthGuard)
  @Roles(...BMI_READ_ROLES)
  @Get()
  async findAll() {
    return this.personnelService.findAll();
  }

  // ESP32 RFID READER SAVE
  @Post('rfid/scan')
  async reportRfidScan(@Body() data: { rfid_uid: string }) {
    console.log('ESP32 RFID SCAN:', data);

    return this.personnelService.reportRfidScan(data.rfid_uid);
  }

  @Get('rfid/latest')
  async getLatestRfidScan() {
    return this.personnelService.getLatestRfidScan();
  }

  @UseGuards(AdminAuthGuard)
  @Roles(...BMI_READ_ROLES)
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.personnelService.findOne(id);
  }

  @UseGuards(AdminAuthGuard)
  @Roles('bmi_admin')
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.personnelService.remove(id);
  }
}
