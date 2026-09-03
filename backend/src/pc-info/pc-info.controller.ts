import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { PcInfoService } from './pc-info.service';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';

@Controller('pc-info')
@UseGuards(AdminAuthGuard)
export class PcInfoController {
  constructor(private readonly pcInfoService: PcInfoService) {}

  @Get('assessments')
  async findAllAssessments() {
    return this.pcInfoService.findAllAssessments();
  }

  @Get('categories')
  async findCategories() {
    return this.pcInfoService.findCategories();
  }

  @Get('findings/:category')
  async findFindingsByCategory(@Param('category') category: string) {
    return this.pcInfoService.findFindingsByCategory(category);
  }

  @Get('connections')
  async findConnectionStatus() {
    return this.pcInfoService.findConnectionStatus();
  }

  @Get('component-status')
  async findComponentStatus() {
    return this.pcInfoService.findComponentStatus();
  }
}
