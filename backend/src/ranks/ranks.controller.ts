import { Controller, Get } from '@nestjs/common';
import { RanksService } from './ranks.service';
import { Rank } from './rank.entity';

@Controller('ranks')
export class RanksController {
  constructor(private readonly ranksService: RanksService) {}

  @Get()
  async getRanks(): Promise<Rank[]> {
    return this.ranksService.findAll();
  }
}