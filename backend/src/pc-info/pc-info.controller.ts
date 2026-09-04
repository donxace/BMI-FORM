import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PcInfoService } from './pc-info.service';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';

@Controller('pc-info')
@UseGuards(AdminAuthGuard)
export class PcInfoController {
  constructor(private readonly pcInfoService: PcInfoService) {}

  // Backs the "Import CSV" button on the PC Information System dashboard —
  // accepts a single FOREN-format security assessment export.
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importAssessment(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No CSV file uploaded.');
    }
    return this.pcInfoService.importAssessmentCsv(file.buffer);
  }

  @Get('assessments')
  async findAllAssessments() {
    return this.pcInfoService.findAllAssessments();
  }

  // Backs the PC detail page — one specific machine's assessment, not the
  // aggregate views the rest of this controller serves.
  @Get('assessments/:id')
  async findAssessmentById(@Param('id') id: string) {
    return this.pcInfoService.findAssessmentById(Number(id));
  }

  @Get('assessments/:id/findings')
  async findFindingsByAssessment(@Param('id') id: string) {
    return this.pcInfoService.findFindingsByAssessment(Number(id));
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
