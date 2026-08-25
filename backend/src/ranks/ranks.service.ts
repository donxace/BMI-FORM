import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rank } from './rank.entity';

@Injectable()
export class RanksService {
  constructor(
    @InjectRepository(Rank)
    private readonly rankRepository: Repository<Rank>,
  ) {}

  async findAll(): Promise<Rank[]> {
    return this.rankRepository.find({
      order: {
        hierarchy_level: 'ASC', // Sorting by hierarchy level
      },
    });
  }
}