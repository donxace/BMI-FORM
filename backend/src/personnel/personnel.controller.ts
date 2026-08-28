import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe, Put, UseGuards } from '@nestjs/common';
import { PersonnelService } from './personnel.service';
import { CreatePersonnelDto } from './dto/create-personnel.dto';
import { UpdatePersonnelDto } from './dto/update-personnel.dto';
import { ProvisionPersonnelDto } from './dto/provision-personnel.dto';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';

@Controller('personnel')
export class PersonnelController {
  constructor(private readonly personnelService: PersonnelService) {}

  @UseGuards(AdminAuthGuard)
  @Post()
  async createPersonnel(@Body() createDto: CreatePersonnelDto) {
    return this.personnelService.create(createDto);
  }

  // ADMIN: register a blank RFID card for later self-registration
  @UseGuards(AdminAuthGuard)
  @Post('provision')
  async provision(@Body() dto: ProvisionPersonnelDto) {
    return this.personnelService.provision(dto);
  }

  @UseGuards(AdminAuthGuard)
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdatePersonnelDto,
  ) {
    return this.personnelService.update(id, updateDto);
  }

  @UseGuards(AdminAuthGuard)
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
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.personnelService.findOne(id);
  }

  @UseGuards(AdminAuthGuard)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.personnelService.remove(id);
  }
}