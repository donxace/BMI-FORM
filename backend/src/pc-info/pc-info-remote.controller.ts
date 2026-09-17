import {
  BadRequestException,
  Controller,
  Headers,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PcInfoService } from './pc-info.service';
import { PcInfoRemoteSecretGuard } from '../auth/guards/pcinfo-remote-secret.guard';

// A separate controller (not a route added to PcInfoController) purely
// because that one carries a class-level @UseGuards(AdminAuthGuard) —
// NestJS stacks guards rather than letting a method-level one replace a
// class-level one, so a remote-import route declared there would still
// demand a valid admin JWT on top of the shared secret. A remote website
// pushing this has no admin session to present at all, same problem the
// LAN inventory-collector agent has (see AgentSecretGuard) — this is that
// same shape of endpoint, applied to PC Info's own import pipeline
// instead of inventory-devices'.
@Controller('pc-info')
export class PcInfoRemoteController {
  constructor(private readonly pcInfoService: PcInfoService) {}

  // Same CSV parsing/import pipeline as the in-app "Import CSV" button
  // (POST /pc-info/import) — this is the remote-website equivalent,
  // authenticated by PcInfoRemoteSecretGuard's shared-secret header
  // instead of an admin session. Same 5MB cap / CSV-only filter as the
  // in-app upload.
  @UseGuards(PcInfoRemoteSecretGuard)
  @Post('remote-import')
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
  async remoteImportAssessment(
    @UploadedFile() file: Express.Multer.File | undefined,
    // Optional — lets the pushing site identify itself for the Import
    // History timeline (e.g. "branch-office-scanner"), same spirit as
    // imported_by_username for an in-app import. Falls back to a fixed
    // label so the history entry is never blank about where it came from.
    @Headers('x-pcinfo-remote-source') remoteSource: string | undefined,
  ) {
    if (!file) {
      throw new BadRequestException('No CSV file uploaded.');
    }

    const importedByUsername = remoteSource?.trim() ? `remote:${remoteSource.trim()}` : 'remote-import';

    return this.pcInfoService.importAssessmentCsv(file.buffer, importedByUsername, file.originalname ?? null);
  }
}
