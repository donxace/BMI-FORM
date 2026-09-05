import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryRank } from './inventory-rank.entity';
import { InventoryRanksService } from './inventory-ranks.service';
import { InventoryRanksController } from './inventory-ranks.controller';

@Module({
  imports: [TypeOrmModule.forFeature([InventoryRank], 'inventory')],
  controllers: [InventoryRanksController],
  providers: [InventoryRanksService],
  exports: [InventoryRanksService],
})
export class InventoryRanksModule {}
