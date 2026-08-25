import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rank } from './rank.entity';
import { RanksService } from './ranks.service';
import { RanksController } from './ranks.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Rank])],
  controllers: [RanksController],
  providers: [RanksService],
  exports: [RanksService],
})
export class RanksModule {}