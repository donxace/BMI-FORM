import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe, Put} from '@nestjs/common';
import { PersonnelService } from './personnel.service';
import { CreatePersonnelDto } from './dto/create-personnel.dto';
import { UpdatePersonnelDto } from './dto/update-personnel.dto';

@Controller('personnel')
export class PersonnelController {
  constructor(private readonly personnelService: PersonnelService) {}

  @Post()
  async createPersonnel(@Body() createDto: CreatePersonnelDto) {
    return this.personnelService.create(createDto);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdatePersonnelDto,
  ) {
    return this.personnelService.update(id, updateDto);
  }

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

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.personnelService.findOne(id);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.personnelService.remove(id);
  }
}