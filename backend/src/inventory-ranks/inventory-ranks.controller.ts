import { Controller, Get } from '@nestjs/common';
import { InventoryRanksService } from './inventory-ranks.service';
import { InventoryRank } from './inventory-rank.entity';

@Controller('inventory-ranks')
export class InventoryRanksController {
  constructor(private readonly inventoryRanksService: InventoryRanksService) {}

  @Get()
  async getRanks(): Promise<InventoryRank[]> {
    return this.inventoryRanksService.findAll();
  }
}
