import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  BeforeInsert,
} from 'typeorm';
import { randomBytes } from 'crypto';
import { BmiAssessment } from '../bmi-assessments/entities/bmi-assessment.entity'; // Adjust path as needed

@Entity('personnel')
export class Personnel {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  personnel_id!: number;

  // Optional: personnel can be added with only a QR code and get a card later.
  @Column({ type: 'varchar', length: 50, unique: true, nullable: true })
  rfid_uid!: string | null;

  // Independent of rfid_uid: printed on the QR badge, looked up by
  // POST /personnel/qr/scan. Auto-generated on insert (see below).
  @Column({ type: 'varchar', length: 50, unique: true, nullable: true })
  qr_code!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, select: false })
  pin_hash!: string | null;

  @Column({ type: 'boolean', default: true })
  is_claimed!: boolean;

  @Column({ type: 'varchar', length: 50 })
  rank!: string;

  @Column({ type: 'varchar', length: 100 })
  surname!: string;

  @Column({ type: 'varchar', length: 100 })
  first_name!: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  middle_initial!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  q!: string | null;

  @Column({ type: 'int', nullable: true })
  age!: number | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  sex!: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  office!: string | null;

  @CreateDateColumn({ type: 'datetime' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at!: Date;

  @OneToMany(() => BmiAssessment, (assessment) => assessment.personnel, {
    onDelete: 'CASCADE',
  })
  bmi_assessments!: BmiAssessment[];

  // Every new personnel (added by an admin, or a provisioned blank card)
  // gets its own QR code, e.g. QR-7F3A9C21B0.
  @BeforeInsert()
  generateQrCode() {
    if (!this.qr_code) {
      this.qr_code = `QR-${randomBytes(5).toString('hex').toUpperCase()}`;
    }
  }
}