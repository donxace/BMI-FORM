import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PcInfoService } from './pc-info.service';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';

// Three PC Info roles: viewer (read-only), editor (can import a new
// assessment CSV), admin (full access, including delete — the one
// irreversible action in this domain, same convention as Inventory's
// own admin-only delete).
const PCINFO_READ_ROLES = ['pcinfo_admin', 'pcinfo_editor', 'pcinfo_viewer'];
const PCINFO_WRITE_ROLES = ['pcinfo_admin', 'pcinfo_editor'];
const PCINFO_ADMIN_ROLES = ['pcinfo_admin'];

@Controller('pc-info')
@UseGuards(AdminAuthGuard)
export class PcInfoController {
  constructor(private readonly pcInfoService: PcInfoService) {}

  // Backs the "Import CSV" button on the PC Information System dashboard —
  // accepts a single FOREN-format security assessment export. Capped at
  // 5MB (a FOREN export is plain text, this is generous) and restricted
  // to CSV-shaped uploads — previously unbounded, so any authenticated
  // pcinfo_editor could push an arbitrarily large file straight into
  // memory before the CSV parser ever got a chance to reject it.
  @Roles(...PCINFO_WRITE_ROLES)
  @Post('import')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, callback) => {
        const isCsv =
          /\.csv$/i.test(file.originalname) ||
          /^(text\/csv|application\/vnd\.ms-excel|text\/plain)$/i.test(file.mimetype);
        callback(isCsv ? null : new BadRequestException('Only .csv files are accepted.'), isCsv);
      },
    }),
  )
  async importAssessment(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No CSV file uploaded.');
    }
    return this.pcInfoService.importAssessmentCsv(file.buffer);
  }

  @Roles(...PCINFO_READ_ROLES)
  @Get('assessments')
  async findAllAssessments() {
    return this.pcInfoService.findAllAssessments();
  }

  // Backs the PC detail page — one specific machine's assessment, not the
  // aggregate views the rest of this controller serves.
  @Roles(...PCINFO_READ_ROLES)
  @Get('assessments/:id')
  async findAssessmentById(@Param('id') id: string) {
    return this.pcInfoService.findAssessmentById(Number(id));
  }

  @Roles(...PCINFO_READ_ROLES)
  @Get('assessments/:id/findings')
  async findFindingsByAssessment(@Param('id') id: string) {
    return this.pcInfoService.findFindingsByAssessment(Number(id));
  }

  @Roles(...PCINFO_ADMIN_ROLES)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('assessments/:id')
  async deleteAssessment(@Param('id', ParseIntPipe) id: number) {
    await this.pcInfoService.deleteAssessment(id);
  }

  @Roles(...PCINFO_READ_ROLES)
  @Get('categories')
  async findCategories() {
    return this.pcInfoService.findCategories();
  }

  @Roles(...PCINFO_READ_ROLES)
  @Get('findings/:category')
  async findFindingsByCategory(@Param('category') category: string) {
    return this.pcInfoService.findFindingsByCategory(category);
  }

  @Roles(...PCINFO_READ_ROLES)
  @Get('connections')
  async findConnectionStatus() {
    return this.pcInfoService.findConnectionStatus();
  }

  @Roles(...PCINFO_READ_ROLES)
  @Get('component-status')
  async findComponentStatus() {
    return this.pcInfoService.findComponentStatus();
  }
}
