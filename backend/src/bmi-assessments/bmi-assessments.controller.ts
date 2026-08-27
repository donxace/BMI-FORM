import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';

import { BmiAssessmentsService } from './bmi-assessments.service';

@Controller('bmi-assessments')
export class BmiAssessmentsController {
  constructor(
    private readonly bmiAssessmentsService: BmiAssessmentsService,
  ) {}

  // EXISTING WEBSITE SAVE
  @Post()
  async create(@Body() data: any) {
    console.log('WEBSITE BMI ASSESSMENT:', data);

    return await this.bmiAssessmentsService.create(data);
  }

  // ESP32 SAVE
  @Post('esp32')
  async createFromEsp32(@Body() data: any) {
    console.log('ESP32 BMI DATA:', data);

    return await this.bmiAssessmentsService.createFromEsp32(data);
  }

  // ESP32 LIVE WEIGHT / HEIGHT READING
  @Post('reading')
  reportReading(@Body() data: any) {
    console.log('ESP32 READING:', data);

    return this.bmiAssessmentsService.reportReading(data);
  }

  @Get('reading/latest')
  getLatestReading() {
    return this.bmiAssessmentsService.getLatestReading();
  }

  // ADMIN STARTS/ENDS A MEASUREMENT SESSION FROM THE WEBSITE
  @Post('session/start')
  startSession() {
    return this.bmiAssessmentsService.startSession();
  }

  @Post('session/end')
  endSession() {
    return this.bmiAssessmentsService.endSession();
  }

  @Get('session/status')
  getSessionStatus() {
    return this.bmiAssessmentsService.getSessionStatus();
  }

  @Get()
  async findAll() {
    return await this.bmiAssessmentsService.findAll();
  }

  @Get('personnel/:personnelId')
  async findByPersonnel(
    @Param('personnelId') personnelId: string,
  ) {
    return await this.bmiAssessmentsService.findByPersonnel(
      Number(personnelId),
    );
  }
}