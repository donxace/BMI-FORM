import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Division } from './division.entity';
import { InventoryDivisionsService } from './inventory-divisions.service';
import { InventoryDivisionsController } from './inventory-divisions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Division], 'inventory')],
  controllers: [InventoryDivisionsController],
  providers: [InventoryDivisionsService],
  exports: [InventoryDivisionsService],
})
export class InventoryDivisionsModule {}
