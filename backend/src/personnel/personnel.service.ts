import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Personnel } from './personnel.entity';

@Injectable()
export class PersonnelService {
  constructor(
    @InjectRepository(Personnel)
    private readonly personnelRepository: Repository<Personnel>,
  ) {}

  async findAll(): Promise<Personnel[]> {
    return this.personnelRepository.find({
      order: {
        surname: 'ASC',
        first_name: 'ASC',
      },
    });
  }

  async findOne(personnel_id: number): Promise<Personnel | null> {
    return this.personnelRepository.findOne({
      where: {
        personnel_id,
      },
    });
  }
}