import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';

import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { PersonnelAuthGuard } from '../auth/guards/personnel-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { BmiAssistantService } from './bmi-assistant.service';

type AskBody = { question?: unknown; history?: unknown };
type PersonnelRequest = Request & { user: { sub: number } };

// A question can start a (slow) local model run, so this is throttled well
// below the app default. History is the visible conversation, sent by the
// browser each time; nothing is stored on the server.
@Throttle({ default: { limit: 12, ttl: 60_000 } })
@Controller('bmi-assistant')
export class BmiAssistantController {
  constructor(private readonly assistant: BmiAssistantService) {}

  // Personnel asking about themselves (My BMI Assistant page).
  @UseGuards(PersonnelAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('me/ask')
  askAsPersonnel(@Body() body: AskBody, @Req() req: PersonnelRequest) {
    return this.assistant.ask(body?.question, body?.history, Number(req.user.sub));
  }

  // BMI System staff asking general questions (no personnel data).
  @UseGuards(AdminAuthGuard)
  @Roles('bmi_admin', 'bmi_editor', 'bmi_viewer')
  @HttpCode(HttpStatus.OK)
  @Post('ask')
  askAsStaff(@Body() body: AskBody) {
    return this.assistant.ask(body?.question, body?.history, null);
  }
}
