// personnel.service.ts

import { 
  Injectable, 
  ConflictException, 
  NotFoundException // <--- ADD THIS IMPORT
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Personnel } from './personnel.entity';
import { CreatePersonnelDto } from './dto/create-personnel.dto';
import { UpdatePersonnelDto } from './dto/update-personnel.dto';
import { ProvisionPersonnelDto } from './dto/provision-personnel.dto';

@Injectable()
export class PersonnelService {
  private latestRfidScan: {
    rfid_uid: string | null;
    personnel: Personnel | null;
    scan_id: number;
  } = { rfid_uid: null, personnel: null, scan_id: 0 };

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

  /*
   * =========================================================
   * PROVISION A BLANK RFID CARD
   *
   * Admin registers a bare rfid_uid ahead of time (e.g. handing
   * out physical stickers) without knowing who will claim it
   * yet. The person fills in their own profile + PIN later via
   * POST /auth/personnel-register.
   * =========================================================
   */

  async provision(dto: ProvisionPersonnelDto): Promise<Personnel> {
    const existing = await this.personnelRepository.findOne({
      where: { rfid_uid: dto.rfid_uid },
    });

    if (existing) {
      throw new ConflictException('RFID Card is already provisioned or assigned.');
    }

    const blank = this.personnelRepository.create({
      rfid_uid: dto.rfid_uid,
      rank: '',
      surname: '',
      first_name: '',
      is_claimed: false,
    });

    return await this.personnelRepository.save(blank);
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
    const result = await this.personnelRepository.delete(personnel_id);

    if (result.affected === 0) {
      throw new NotFoundException(`Personnel with ID ${personnel_id} not found.`);
    }
  }

  async update(personnel_id: number, dto: UpdatePersonnelDto): Promise<Personnel> {
    const personnel = await this.personnelRepository.findOne({
      where: { personnel_id },
    });

    if (!personnel) {
      throw new NotFoundException(`Personnel with ID ${personnel_id} not found.`);
    }

    // Check if RFID is being updated and already belongs to someone else
    if (dto.rfid_uid && dto.rfid_uid !== personnel.rfid_uid) {
      const existingRfid = await this.personnelRepository.findOne({
        where: { rfid_uid: dto.rfid_uid },
      });

      if (existingRfid) {
        throw new ConflictException('RFID Card is already assigned to another personnel.');
      }
    }

    Object.assign(personnel, dto);
    return await this.personnelRepository.save(personnel);
  }

  // ESP32/RFID reader reports a scanned card UID
  async reportRfidScan(rfid_uid: string) {
    const personnel = await this.personnelRepository.findOne({
      where: { rfid_uid },
    });

    this.latestRfidScan = {
      rfid_uid,
      personnel: personnel ?? null,
      // Bumped on every physical tap, even a repeat tap of the same
      // card, so pollers (e.g. the Kiosk) can tell "a fresh tap just
      // happened" apart from "still the same cached scan as before"
      // — comparing rfid_uid alone can't distinguish those.
      scan_id: this.latestRfidScan.scan_id + 1,
    };

    return this.latestRfidScan;
  }

  getLatestRfidScan() {
    return this.latestRfidScan;
  }
}