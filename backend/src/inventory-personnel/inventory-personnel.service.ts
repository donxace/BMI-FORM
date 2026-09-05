import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryPersonnel } from './inventory-personnel.entity';
import { CreateInventoryPersonnelDto } from './dto/create-inventory-personnel.dto';
import { UpdateInventoryPersonnelDto } from './dto/update-inventory-personnel.dto';

@Injectable()
export class InventoryPersonnelService {
  constructor(
    @InjectRepository(InventoryPersonnel, 'inventory')
    private readonly personnelRepository: Repository<InventoryPersonnel>,
  ) {}

  // itms_inventech's `personnels.created_by` has no session of its own to
  // draw from (Inventory reuses the BMI admin login, a different DB's user
  // table), and the column carries no FK constraint — so every record
  // created through this UI is attributed to this fixed placeholder id.
  private static readonly SYSTEM_CREATOR_ID = 1;

  async create(dto: CreateInventoryPersonnelDto): Promise<InventoryPersonnel> {
    const newPersonnel = this.personnelRepository.create({
      ...dto,
      created_by: InventoryPersonnelService.SYSTEM_CREATOR_ID,
    });

    return await this.personnelRepository.save(newPersonnel);
  }

  async findAll(): Promise<InventoryPersonnel[]> {
    return this.personnelRepository.find({
      order: {
        last_name: 'ASC',
        first_name: 'ASC',
      },
    });
  }

  async findOne(id: number): Promise<InventoryPersonnel | null> {
    return this.personnelRepository.findOne({ where: { id } });
  }

  async update(id: number, dto: UpdateInventoryPersonnelDto): Promise<InventoryPersonnel> {
    const personnel = await this.personnelRepository.findOne({ where: { id } });

    if (!personnel) {
      throw new NotFoundException(`Personnel with ID ${id} not found.`);
    }

    Object.assign(personnel, dto);
    return await this.personnelRepository.save(personnel);
  }

  async remove(id: number): Promise<void> {
    const result = await this.personnelRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Personnel with ID ${id} not found.`);
    }
  }
}
