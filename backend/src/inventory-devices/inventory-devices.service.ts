import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Camera } from './entities/camera.entity';
import { Desktop } from './entities/desktop.entity';
import { Laptop } from './entities/laptop.entity';
import { Printer } from './entities/printer.entity';
import { Router } from './entities/router.entity';
import { Switch } from './entities/switch.entity';
import { Switcher } from './entities/switcher.entity';
import { Splitter } from './entities/splitter.entity';
import { Ups } from './entities/ups.entity';
import { Firewall } from './entities/firewall.entity';
import { Headset } from './entities/headset.entity';
import { Other } from './entities/other.entity';

import { DEVICE_TYPE_SLUGS, DeviceTypeSlug, UnifiedDevice, normalizeDevice } from './device-types';
import { AgentReportDto } from './dto/agent-report.dto';

@Injectable()
export class InventoryDevicesService {
  private readonly repositories: Record<DeviceTypeSlug, Repository<any>>;

  constructor(
    @InjectRepository(Desktop, 'inventory') desktopRepo: Repository<Desktop>,
    @InjectRepository(Laptop, 'inventory') laptopRepo: Repository<Laptop>,
    @InjectRepository(Camera, 'inventory') cameraRepo: Repository<Camera>,
    @InjectRepository(Headset, 'inventory') headsetRepo: Repository<Headset>,
    @InjectRepository(Printer, 'inventory') printerRepo: Repository<Printer>,
    @InjectRepository(Splitter, 'inventory') splitterRepo: Repository<Splitter>,
    @InjectRepository(Switcher, 'inventory') switcherRepo: Repository<Switcher>,
    @InjectRepository(Ups, 'inventory') upsRepo: Repository<Ups>,
    @InjectRepository(Other, 'inventory') otherRepo: Repository<Other>,
    @InjectRepository(Router, 'inventory') routerRepo: Repository<Router>,
    @InjectRepository(Firewall, 'inventory') firewallRepo: Repository<Firewall>,
    @InjectRepository(Switch, 'inventory') switchRepo: Repository<Switch>,
  ) {
    this.repositories = {
      desktops: desktopRepo,
      laptops: laptopRepo,
      cameras: cameraRepo,
      headsets: headsetRepo,
      printers: printerRepo,
      splitters: splitterRepo,
      switchers: switcherRepo,
      ups: upsRepo,
      others: otherRepo,
      routers: routerRepo,
      firewalls: firewallRepo,
      switches: switchRepo,
    };
  }

  private repoFor(deviceType: string): Repository<any> {
    if (!(DEVICE_TYPE_SLUGS as readonly string[]).includes(deviceType)) {
      throw new BadRequestException(`Unknown device type "${deviceType}".`);
    }

    return this.repositories[deviceType as DeviceTypeSlug];
  }

  async findAll(): Promise<UnifiedDevice[]> {
    const perType = await Promise.all(
      DEVICE_TYPE_SLUGS.map(async (deviceType) => {
        const rows = await this.repositories[deviceType].find();
        return rows.map((row: Record<string, any>) => normalizeDevice(deviceType, row));
      }),
    );

    return perType.flat();
  }

  async findByPersonnel(personnelId: number): Promise<UnifiedDevice[]> {
    const perType = await Promise.all(
      DEVICE_TYPE_SLUGS.map(async (deviceType) => {
        const rows = await this.repositories[deviceType].find({
          where: { personnel_id: personnelId },
        });
        return rows.map((row: Record<string, any>) => normalizeDevice(deviceType, row));
      }),
    );

    return perType.flat();
  }

  async create(deviceType: string, dto: Record<string, any>): Promise<UnifiedDevice> {
    const repo = this.repoFor(deviceType);
    const created = repo.create(dto);
    const saved = await repo.save(created);
    return normalizeDevice(deviceType as DeviceTypeSlug, saved as Record<string, any>);
  }

  async update(deviceType: string, id: number, dto: Record<string, any>): Promise<UnifiedDevice> {
    const repo = this.repoFor(deviceType);
    const existing = await repo.findOne({ where: { id } });

    if (!existing) {
      throw new NotFoundException(`${deviceType} device with ID ${id} not found.`);
    }

    Object.assign(existing, dto);
    const saved = await repo.save(existing);
    return normalizeDevice(deviceType as DeviceTypeSlug, saved as Record<string, any>);
  }

  async remove(deviceType: string, id: number): Promise<void> {
    const repo = this.repoFor(deviceType);
    const result = await repo.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`${deviceType} device with ID ${id} not found.`);
    }
  }

  // Called by the local collector script (scripts/collect-agent.js), which
  // has no admin session — it only ever patches a device that's already
  // been registered through the UI, matched by its serial number, so it
  // can't create or misidentify records the way a spoofed ID could.
  async reportFromAgent(dto: AgentReportDto): Promise<UnifiedDevice> {
    const tablesToSearch: DeviceTypeSlug[] = dto.device_type
      ? [dto.device_type]
      : ['desktops', 'laptops'];

    for (const deviceType of tablesToSearch) {
      const repo = this.repositories[deviceType];
      const existing = await repo.findOne({ where: { par_serial_no: dto.serial_no } });

      if (!existing) {
        continue;
      }

      const { serial_no: _serialNo, device_type: _deviceType, ...updates } = dto;
      Object.assign(existing, updates, { last_updated_at: new Date().toISOString().slice(0, 10) });
      const saved = await repo.save(existing);
      return normalizeDevice(deviceType, saved as Record<string, any>);
    }

    throw new NotFoundException(
      `No desktop or laptop is registered with serial number "${dto.serial_no}". Add the device in Inventory Personnel first, then re-run the agent.`,
    );
  }
}
