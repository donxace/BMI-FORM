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

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.personnelService.findOne(id);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.personnelService.remove(id);
  }
}