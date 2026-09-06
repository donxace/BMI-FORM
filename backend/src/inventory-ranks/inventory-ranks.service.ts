import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryRank } from './inventory-rank.entity';

@Injectable()
export class InventoryRanksService {
  constructor(
    @InjectRepository(InventoryRank, 'inventory')
    private readonly rankRepository: Repository<InventoryRank>,
  ) {}

  async findAll(): Promise<InventoryRank[]> {
    return this.rankRepository.find({
      order: { sort_order: 'ASC' },
    });
  }
}
