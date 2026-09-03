import { Controller, Get } from '@nestjs/common';
import { InventoryDivisionsService } from './inventory-divisions.service';
import { Division } from './division.entity';

@Controller('inventory-divisions')
export class InventoryDivisionsController {
  constructor(private readonly inventoryDivisionsService: InventoryDivisionsService) {}

  @Get()
  async getDivisions(): Promise<Division[]> {
    return this.inventoryDivisionsService.findAll();
  }
}
