import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

// One row per raw line of an imported FOREN CSV — see
// backend/scripts/import-security-assessment.js for how `category`
// values are produced; PcInfoService groups on that column to build
// the PC Information System's category pages.
@Entity('security_assessment_findings')
export class SecurityAssessmentFinding {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  assessment_id!: number;

  @Column({ type: 'tinyint', nullable: true })
  table_no!: number | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  section!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  component!: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  property!: string | null;

  @Column({ type: 'text', nullable: true })
  value!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  status!: string | null;

  @Column({ type: 'text', nullable: true })
  finding!: string | null;

  // Only populated for "FUNCTIONAL TESTING" section rows (table_no = 3) —
  // the real export carries 3 extra descriptive columns beyond the
  // original Category/Component/Status concept. See foren-csv.util.ts.
  @Column({ type: 'text', nullable: true })
  specifications!: string | null;

  @Column({ type: 'text', nullable: true })
  functional_test!: string | null;

  @Column({ type: 'text', nullable: true })
  actual_result!: string | null;
}
