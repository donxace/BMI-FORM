import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { SecurityAssessment } from './entities/security-assessment.entity';
import { SecurityAssessmentFinding } from './entities/security-assessment-finding.entity';
import { Desktop } from '../inventory-devices/entities/desktop.entity';
import { Laptop } from '../inventory-devices/entities/laptop.entity';
import { InventoryPersonnel } from '../inventory-personnel/inventory-personnel.entity';
import { Division } from '../inventory-divisions/division.entity';
import { InventoryDevicesService } from '../inventory-devices/inventory-devices.service';
import { buildAssessmentSummary, buildHostIdentity, parseForenCsv, toFindingRows } from './foren-csv.util';
import { lookupIpGeolocation } from './ip-geolocation.util';

// Hard safety cap, not real pagination — see the identical note in
// inventory-devices.service.ts. security_assessment_findings already has
// 1000+ rows, so this one is not just a future-proofing measure.
const MAX_FINDING_ROWS = 5000;

@Injectable()
export class PcInfoService {
  constructor(
    @InjectRepository(SecurityAssessment, 'inventory')
    private readonly assessmentRepo: Repository<SecurityAssessment>,
    @InjectRepository(SecurityAssessmentFinding, 'inventory')
    private readonly findingRepo: Repository<SecurityAssessmentFinding>,
    @InjectRepository(Desktop, 'inventory')
    private readonly desktopRepo: Repository<Desktop>,
    @InjectRepository(Laptop, 'inventory')
    private readonly laptopRepo: Repository<Laptop>,
    @InjectRepository(InventoryPersonnel, 'inventory')
    private readonly personnelRepo: Repository<InventoryPersonnel>,
    @InjectRepository(Division, 'inventory')
    private readonly divisionRepo: Repository<Division>,
    private readonly inventoryDevicesService: InventoryDevicesService,
  ) {}

  // Powers the "Import CSV" button on the PC Information System dashboard.
  // Same logic/behavior as backend/scripts/import-security-assessment.js —
  // that script remains useful for scripted/bulk imports, this is the
  // one-off, no-terminal-needed equivalent for a single machine's report.
  async importAssessmentCsv(fileBuffer: Buffer, importedByUsername: string | null, sourceFilename: string | null) {
    const raw = fileBuffer.toString('utf8');

    let rows, hostInfo;
    try {
      ({ rows, hostInfo } = parseForenCsv(raw));
    } catch (err) {
      throw new BadRequestException(err instanceof Error ? err.message : 'Invalid CSV file.');
    }

    const assessmentRows = rows.filter((r) => r.SECTION === 'SECURITY ASSESSMENT');
    const summary = buildAssessmentSummary(assessmentRows);
    const identity = buildHostIdentity(hostInfo);

    // Soft-match against desktops/laptops.par_serial_no, same convention as
    // POST /inventory/devices/agent-report — informational only, the
    // assessment is recorded either way.
    let deviceType: 'desktops' | 'laptops' | null = null;
    let deviceId: number | null = null;

    if (summary.serial_no) {
      const desktopMatch = await this.desktopRepo.findOne({ where: { par_serial_no: summary.serial_no } });
      if (desktopMatch) {
        deviceType = 'desktops';
        deviceId = desktopMatch.id;
      } else {
        const laptopMatch = await this.laptopRepo.findOne({ where: { par_serial_no: summary.serial_no } });
        if (laptopMatch) {
          deviceType = 'laptops';
          deviceId = laptopMatch.id;
        }
      }
    }

    // Import-time geolocation lookup for identity.public_ip, cached on the
    // row — see ip-geolocation.util.ts's header comment for why this runs
    // now instead of on every assessment-detail page view. Never throws:
    // a failed/slow lookup must not fail the import itself.
    const geo = await lookupIpGeolocation(identity.public_ip);

    const assessment = await this.assessmentRepo.save(
      this.assessmentRepo.create({
        ...summary,
        ...identity,
        device_type: deviceType,
        device_id: deviceId,
        public_ip_lat: geo?.lat ?? null,
        public_ip_lon: geo?.lon ?? null,
        public_ip_city: geo?.city ?? null,
        public_ip_region: geo?.region ?? null,
        public_ip_country: geo?.country ?? null,
        // isp comes from ...identity (the CSV's own WAN/Internet row) and
        // is intentionally left as-is here — the geolocation API's ISP
        // field is a generic IP-to-organization lookup that can be wrong
        // or outdated (seen returning an unrelated org/country for a real
        // PLDT-assigned IP in testing); the CSV's value is reported
        // directly by the machine and is the more trustworthy source.
        public_ip_geo_looked_up_at: identity.public_ip ? new Date() : null,
        imported_by_username: importedByUsername,
        source_filename: sourceFilename,
      }),
    );

    const findingRows = toFindingRows(rows).map((r) =>
      this.findingRepo.create({
        assessment_id: assessment.id,
        table_no: r.tableNo,
        section: r.section,
        category: r.category,
        component: r.component,
        property: r.property,
        value: r.value,
        status: r.status,
        finding: r.finding,
        specifications: r.specifications,
        functional_test: r.functionalTest,
        actual_result: r.actualResult,
      }),
    );

    if (findingRows.length > 0) {
      await this.findingRepo.save(findingRows);
    }

    return {
      assessmentId: assessment.id,
      hostname: identity.hostname,
      matchedDevice: deviceId ? { type: deviceType, id: deviceId } : null,
      findingCount: findingRows.length,
      riskLevel: summary.risk_level,
      riskScore: summary.risk_score,
    };
  }

  // Powers the "Recent Devices"-style table on the PC Info dashboard —
  // one row per imported machine, enriched with the OWNER/DIVISION/
  // STATUS columns that table needs. None of those live on
  // SecurityAssessment itself (it's purely device/host data, no
  // personnel or division of its own); they're resolved through
  // whichever desktops/laptops row the CSV import soft-matched by
  // serial number (device_type/device_id), which is where an owner and
  // division can actually be assigned. Unmatched assessments show
  // "Unassigned" the same way an unmatched inventory device does.
  async findAllAssessments() {
    const assessments = await this.assessmentRepo.find({ order: { created_at: 'DESC' } });

    const desktopIds = assessments.filter((a) => a.device_type === 'desktops').map((a) => a.device_id!);
    const laptopIds = assessments.filter((a) => a.device_type === 'laptops').map((a) => a.device_id!);

    const [desktops, laptops] = await Promise.all([
      desktopIds.length > 0 ? this.desktopRepo.find({ where: { id: In(desktopIds) } }) : [],
      laptopIds.length > 0 ? this.laptopRepo.find({ where: { id: In(laptopIds) } }) : [],
    ]);

    const deviceByKey = new Map<string, { device_name: string; personnel_id: number | null; division_id: number | null; is_active: boolean }>();
    for (const d of desktops) deviceByKey.set(`desktops:${d.id}`, d);
    for (const l of laptops) deviceByKey.set(`laptops:${l.id}`, l);

    const personnelIds = [...new Set([...desktops, ...laptops].map((d) => d.personnel_id).filter((id): id is number => id !== null))];
    const divisionIds = [...new Set([...desktops, ...laptops].map((d) => d.division_id).filter((id): id is number => id !== null))];

    const [personnelRows, divisionRows] = await Promise.all([
      personnelIds.length > 0 ? this.personnelRepo.find({ where: { id: In(personnelIds) } }) : [],
      divisionIds.length > 0 ? this.divisionRepo.find({ where: { id: In(divisionIds) } }) : [],
    ]);

    const personnelNameById = new Map<number, string>(
      personnelRows.map((p): [number, string] => [p.id, `${p.first_name} ${p.last_name}`]),
    );
    const divisionNameById = new Map<number, string>(
      divisionRows.map((d): [number, string] => [d.id, d.division]),
    );

    // Additive on top of the full SecurityAssessment row — the dashboard's
    // stat cards/charts already read risk_score, tpm_present,
    // defender_enabled, firewall_*, etc. straight off this same list, so
    // this can't narrow the shape down to just the table's columns.
    return assessments.map((a) => {
      const matchedDevice = a.device_type && a.device_id !== null ? deviceByKey.get(`${a.device_type}:${a.device_id}`) : null;

      return {
        ...a,
        // Falls back to the matched inventory device's own name, then the
        // motherboard model, so the row is never blank even when the CSV
        // export carried no hostname (see foren-csv.util.ts's comment on
        // the legacy "Table N" export shape).
        device_name: a.hostname || matchedDevice?.device_name || a.motherboard_product || 'Unknown Device',
        owner_name: matchedDevice?.personnel_id != null ? personnelNameById.get(matchedDevice.personnel_id) ?? null : null,
        division_name: matchedDevice?.division_id != null ? divisionNameById.get(matchedDevice.division_id) ?? null : null,
        // null (not a boolean) when there's no matched device at all —
        // the frontend renders that as "Unmatched" rather than
        // Active/Inactive, since there's nothing to be active about yet.
        device_status: matchedDevice ? matchedDevice.is_active : null,
      };
    });
  }

  // Powers the "IT Inventory" section on the PC Info dashboard — the
  // complete itms_inventech fleet across all 12 device types (desktops,
  // laptops, printers, routers, switches, UPS, cameras, headsets,
  // firewalls, splitters, switchers, others), not just the desktops/
  // laptops that have had a FOREN security assessment imported. Exposed
  // under pc-info (rather than the caller hitting /inventory/devices
  // directly) so a pcinfo_* role can see it without also needing an
  // inventory_* role.
  async findAllInventory() {
    const devices = await this.inventoryDevicesService.findAll();

    const personnelIds = [...new Set(devices.map((d) => d.personnelId).filter((id): id is number => id !== null))];
    const divisionIds = [...new Set(devices.map((d) => d.divisionId).filter((id): id is number => id !== null))];

    const [personnelRows, divisionRows] = await Promise.all([
      personnelIds.length > 0 ? this.personnelRepo.find({ where: { id: In(personnelIds) } }) : [],
      divisionIds.length > 0 ? this.divisionRepo.find({ where: { id: In(divisionIds) } }) : [],
    ]);

    const personnelNameById = new Map<number, string>(
      personnelRows.map((p): [number, string] => [p.id, `${p.first_name} ${p.last_name}`]),
    );
    const divisionNameById = new Map<number, string>(
      divisionRows.map((d): [number, string] => [d.id, d.division]),
    );

    return devices
      .map((d) => ({
        ...d,
        ownerName: d.personnelId !== null ? personnelNameById.get(d.personnelId) ?? null : null,
        divisionName: d.divisionId !== null ? divisionNameById.get(d.divisionId) ?? null : null,
      }))
      .sort((a, b) => (b.createdDate ?? '').localeCompare(a.createdDate ?? ''));
  }

  // Powers the "PC Name" detail page — the single computer a person clicks
  // into from the "Assessed Machines" table, as opposed to every other
  // endpoint here which aggregates across every imported machine at once.
  async findAssessmentById(id: number): Promise<SecurityAssessment> {
    const assessment = await this.assessmentRepo.findOne({ where: { id } });
    if (!assessment) {
      throw new NotFoundException(`No assessment #${id}.`);
    }
    return assessment;
  }

  // Powers the "Import History" tab on the assessment detail page — every
  // assessment ever imported for the SAME physical machine as `id`, not
  // just this one row, so re-importing the same device over time reads
  // as a timeline instead of a pile of disconnected, unrelated-looking
  // entries. "Same machine" is decided the same way an import already
  // soft-matches to inventory:
  //   - device_type + device_id, when this assessment matched an
  //     inventory device (the more authoritative link), or
  //   - motherboard_serial, for a device never registered in inventory
  //     but whose FOREN export reports the same serial every time.
  // Falls back to just this one row (a "history" of one) when neither
  // identifier is available at all.
  async findAssessmentHistory(id: number) {
    const target = await this.findAssessmentById(id);

    const where =
      target.device_type && target.device_id !== null
        ? { device_type: target.device_type, device_id: target.device_id }
        : target.motherboard_serial
          ? { motherboard_serial: target.motherboard_serial }
          : { id: target.id };

    const history = await this.assessmentRepo.find({
      where,
      order: { assessed_at: 'ASC', created_at: 'ASC' },
    });

    return history.map((a) => ({
      id: a.id,
      is_current: a.id === target.id,
      hostname: a.hostname,
      assessed_at: a.assessed_at,
      created_at: a.created_at,
      risk_score: a.risk_score,
      risk_level: a.risk_level,
      imported_by_username: a.imported_by_username,
      source_filename: a.source_filename,
    }));
  }

  // Deletes one imported machine's assessment and all of its raw finding
  // rows. There's no FK between the two tables (security_assessment_findings
  // has no cascade), so the findings have to be removed explicitly first —
  // otherwise they'd be orphaned, still referencing an assessment_id that
  // no longer exists.
  async deleteAssessment(id: number): Promise<void> {
    const assessment = await this.assessmentRepo.findOne({ where: { id } });
    if (!assessment) {
      throw new NotFoundException(`No assessment #${id}.`);
    }

    await this.findingRepo.delete({ assessment_id: id });
    await this.assessmentRepo.delete({ id });
  }

  // Every raw finding row (all 3 tables) for one specific machine's
  // assessment — the detail page groups these client-side by table_no /
  // category so it reads as organized sections instead of a flat dump.
  async findFindingsByAssessment(id: number): Promise<SecurityAssessmentFinding[]> {
    return this.findingRepo.find({
      where: { assessment_id: id },
      order: { table_no: 'ASC', id: 'ASC' },
    });
  }

  // Powers the sidebar's "PC Information Details" category nav and lets
  // the frontend confirm a category actually has data before linking to
  // it. Scoped to table_no = 1 (PC Information Details) only — Table 3
  // ("Component Status") reuses a couple of the same category names
  // (SECURITY, SYSTEM) for an unrelated pass/fail checklist, which is
  // served separately by findComponentStatus() instead of being mixed
  // in here.
  async findCategories(): Promise<{ category: string; count: number }[]> {
    const rows = await this.findingRepo
      .createQueryBuilder('f')
      .select('f.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .where("f.table_no = 1 AND f.category IS NOT NULL AND f.category <> ''")
      .groupBy('f.category')
      .orderBy('f.category', 'ASC')
      .getRawMany();

    return rows.map((r) => ({ category: r.category, count: Number(r.count) }));
  }

  // "PC Information Details" (Table 1 of the FOREN CSV) — per-host
  // hardware/OS/security facts, one category at a time.
  async findFindingsByCategory(category: string) {
    return this.findingRepo
      .createQueryBuilder('f')
      .innerJoin(SecurityAssessment, 'a', 'a.id = f.assessment_id')
      .select(this.findingSelect())
      .where('f.table_no = 1 AND f.category = :category', { category })
      .orderBy('a.assessed_at', 'DESC')
      .addOrderBy('f.id', 'ASC')
      .limit(MAX_FINDING_ROWS)
      .getRawMany();
  }

  // "PC Connection Status" (Table 2) — one row per network-connection
  // finding; the source CSV leaves Category/Component/Property/Value
  // blank for these, only Finding is populated.
  async findConnectionStatus() {
    return this.findingRepo
      .createQueryBuilder('f')
      .innerJoin(SecurityAssessment, 'a', 'a.id = f.assessment_id')
      .select(this.findingSelect())
      .where('f.table_no = 2')
      .orderBy('a.assessed_at', 'DESC')
      .addOrderBy('f.id', 'ASC')
      .limit(MAX_FINDING_ROWS)
      .getRawMany();
  }

  // "Component Status" (Table 3) — the pass/fail hardware component
  // checklist (Keyboard, Mouse/Touchpad, CPU, Memory, BIOS/UEFI, ...).
  async findComponentStatus() {
    return this.findingRepo
      .createQueryBuilder('f')
      .innerJoin(SecurityAssessment, 'a', 'a.id = f.assessment_id')
      .select(this.findingSelect())
      .where('f.table_no = 3')
      .orderBy('a.assessed_at', 'DESC')
      .addOrderBy('f.id', 'ASC')
      .limit(MAX_FINDING_ROWS)
      .getRawMany();
  }

  private findingSelect(): string[] {
    return [
      'f.id AS id',
      'f.table_no AS table_no',
      'f.category AS category',
      'f.component AS component',
      'f.property AS property',
      'f.value AS value',
      'f.status AS status',
      'f.finding AS finding',
      'f.specifications AS specifications',
      'f.functional_test AS functional_test',
      'f.actual_result AS actual_result',
      'a.id AS assessment_id',
      'a.assessed_at AS assessed_at',
      'a.serial_no AS serial_no',
      'a.motherboard_manufacturer AS motherboard_manufacturer',
      'a.motherboard_product AS motherboard_product',
      'a.risk_level AS risk_level',
      'a.device_type AS device_type',
      'a.device_id AS device_id',
    ];
  }
}
