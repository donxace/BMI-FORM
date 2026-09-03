import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SecurityAssessment } from './entities/security-assessment.entity';
import { SecurityAssessmentFinding } from './entities/security-assessment-finding.entity';

@Injectable()
export class PcInfoService {
  constructor(
    @InjectRepository(SecurityAssessment, 'inventory')
    private readonly assessmentRepo: Repository<SecurityAssessment>,
    @InjectRepository(SecurityAssessmentFinding, 'inventory')
    private readonly findingRepo: Repository<SecurityAssessmentFinding>,
  ) {}

  async findAllAssessments(): Promise<SecurityAssessment[]> {
    return this.assessmentRepo.find({ order: { assessed_at: 'DESC' } });
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
