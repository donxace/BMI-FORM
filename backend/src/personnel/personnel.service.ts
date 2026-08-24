import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Personnel } from './personnel.entity';
import { CreatePersonnelDto } from './dto/create-personnel.dto';

@Injectable()
export class PersonnelService {
  constructor(
    @InjectRepository(Personnel)
    private readonly personnelRepository: Repository<Personnel>,
  ) {}

  async create(dto: CreatePersonnelDto): Promise<Personnel> {
    const existing = await this.personnelRepository.findOne({
      where: { rfid_uid: dto.rfid_uid },
    });

    if (existing) {
      throw new ConflictException('RFID Card is already assigned to another personnel.');
    }

    const newPersonnel = this.personnelRepository.create(dto);
    return await this.personnelRepository.save(newPersonnel);
  }

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

  async remove(personnel_id: number): Promise<void> {
    await this.personnelRepository.delete(personnel_id);
  }
}