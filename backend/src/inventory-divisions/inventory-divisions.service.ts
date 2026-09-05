import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Division } from './division.entity';

@Injectable()
export class InventoryDivisionsService {
  constructor(
    @InjectRepository(Division, 'inventory')
    private readonly divisionRepository: Repository<Division>,
  ) {}

  async findAll(): Promise<Division[]> {
    return this.divisionRepository.find({
      order: { division: 'ASC' },
    });
  }
}
