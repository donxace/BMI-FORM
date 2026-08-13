import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
} from '@nestjs/common';

import { PersonnelService } from './personnel.service';

@Controller('personnel')
export class PersonnelController {
  constructor(
    private readonly personnelService: PersonnelService,
  ) {}

  @Get()
  findAll() {
    return this.personnelService.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.personnelService.findOne(id);
  }
}