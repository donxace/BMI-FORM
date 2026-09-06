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

// Columns that store agent-reported arrays as JSON text rather than a
// native column type — shared between the write side (reportFromAgent,
// which stringifies) and the read side (findOne, which parses back).
const AGENT_JSON_FIELDS = [
  'installed_software',
  'missing_updates',
  'usb_history',
  'network_adapters',
  'printers_detected',
  'hotfixes',
] as const;

// create()/update() take a plain Record<string, any> instead of a typed
// DTO — the 12 device tables span 3 incompatible column shapes with
// 15-38 fields each, and guessing the "legitimate" field set per type
// risks silently breaking real device forms. Denylisting the columns
// that must never come from client input (the primary key, every
// audit/timestamp column, and the agent-report-only telemetry fields)
// closes the actual mass-assignment hole without that risk: an
// inventory_editor can no longer overwrite `id`, forge `created_date`,
// or inject fake agent-reported data through the regular edit form.
const PROTECTED_DEVICE_FIELDS = [
  'id',
  'created_date',
  'last_updated_at',
  'last_update_at',
  'last_agent_report_at',
  ...AGENT_JSON_FIELDS,
] as const;

const MAX_ROWS_PER_TYPE = 2000;

function stripProtectedFields(dto: Record<string, any>): Record<string, any> {
  const clean = { ...dto };
  for (const field of PROTECTED_DEVICE_FIELDS) {
    delete clean[field];
  }
  return clean;
}

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
        // Hard safety cap, not real pagination — this still returns
        // "everything" for the dashboard's current dataset sizes (tens of
        // rows per type), it just stops an unbounded full-table load from
        // becoming an outage once real inventory data accumulates. A
        // proper paged list view (page/limit + a frontend rework of the
        // pages that currently filter this client-side) is a separate,
        // larger follow-up — see docs/SECURITY_AND_PERFORMANCE.md.
        const rows = await this.repositories[deviceType].find({ take: MAX_ROWS_PER_TYPE });
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
    const created = repo.create(stripProtectedFields(dto));
    const saved = await repo.save(created);
    return normalizeDevice(deviceType as DeviceTypeSlug, saved as Record<string, any>);
  }

  async update(deviceType: string, id: number, dto: Record<string, any>): Promise<UnifiedDevice> {
    const repo = this.repoFor(deviceType);
    const existing = await repo.findOne({ where: { id } });

    if (!existing) {
      throw new NotFoundException(`${deviceType} device with ID ${id} not found.`);
    }

    Object.assign(existing, stripProtectedFields(dto));
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

  // Single-device detail view (Inventory Dashboard's "View Full Report").
  // Parses the JSON-encoded agent-report columns back into arrays so the
  // frontend never has to deal with the stored string form.
  async findOne(deviceType: string, id: number): Promise<UnifiedDevice> {
    const repo = this.repoFor(deviceType);
    const row = await repo.findOne({ where: { id } });

    if (!row) {
      throw new NotFoundException(`${deviceType} device with ID ${id} not found.`);
    }

    const parsed: Record<string, any> = { ...row };

    for (const field of AGENT_JSON_FIELDS) {
      if (typeof parsed[field] === 'string') {
        try {
          parsed[field] = JSON.parse(parsed[field]);
        } catch {
          // Leave malformed/legacy values as-is rather than fail the request.
        }
      }
    }

    return normalizeDevice(deviceType as DeviceTypeSlug, parsed);
  }

  // Called by the local collector scripts (collect-agent.js,
  // Get-InventoryAgent.ps1), which have no admin session. Patches an
  // already-registered device when its serial matches one; if nothing
  // matches anywhere, auto-registers a brand-new one instead of
  // rejecting the report — this is what makes fleet rollout zero-touch
  // (no manual pre-registration step per machine). A freshly
  // auto-registered device has no owner/division yet (see the entity
  // comments — those columns are nullable for exactly this reason) and
  // shows up on the dashboard's Suspicious Device Alerts as
  // "No Owner/Division" until an admin assigns it to someone.
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

      // hostname only ever seeds a brand-new device's name (below) — an
      // existing, possibly admin-renamed device_name is never touched.
      const { serial_no: _serialNo, device_type: _deviceType, hostname: _hostname, ...updates } = dto;

      this.stringifyAgentJsonFields(updates as Record<string, any>);

      Object.assign(existing, updates, {
        last_updated_at: new Date().toISOString().slice(0, 10),
        last_agent_report_at: new Date(),
      });
      const saved = await repo.save(existing);
      return normalizeDevice(deviceType, saved as Record<string, any>);
    }

    const createType: DeviceTypeSlug = dto.device_type ?? 'desktops';
    const repo = this.repositories[createType];

    const { serial_no, device_type: _deviceType2, hostname, ...rest } = dto;
    this.stringifyAgentJsonFields(rest as Record<string, any>);

    const today = new Date().toISOString().slice(0, 10);

    const created = repo.create({
      ...rest,
      device_id: 0,
      device_name: hostname?.trim() || serial_no,
      personnel_id: null,
      division_id: null,
      par_serial_no: serial_no,
      is_active: true,
      created_date: today,
      last_updated_at: today,
      last_agent_report_at: new Date(),
    });

    const saved = await repo.save(created);
    return normalizeDevice(createType, saved as Record<string, any>);
  }

  private stringifyAgentJsonFields(target: Record<string, any>): void {
    for (const field of AGENT_JSON_FIELDS) {
      const value = target[field];
      if (value !== undefined) {
        target[field] = JSON.stringify(value);
      }
    }
  }
}
