import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  InjectRepository,
} from '@nestjs/typeorm';

import {
  Repository,
} from 'typeorm';

import {
  BmiAssessment,
} from './entities/bmi-assessment.entity';

import {
  Personnel,
} from '../personnel/personnel.entity';

@Injectable()
export class BmiAssessmentsService {
  private latestReading: {
    height: number | null;
    weight: number | null;
    received_at: string | null;
  } = { height: null, weight: null, received_at: null };

  private sessionActive = false;

  constructor(
    @InjectRepository(BmiAssessment)
    private readonly bmiAssessmentRepository:
      Repository<BmiAssessment>,

    @InjectRepository(Personnel)
    private readonly personnelRepository:
      Repository<Personnel>,
  ) {}

  async create(data: Partial<BmiAssessment>) {
    const assessment =
      this.bmiAssessmentRepository.create(data);

    return await this.bmiAssessmentRepository.save(
      assessment,
    );
  }

  /*
   * =========================================================
   * SHARED BMI CALCULATION
   * =========================================================
   */

  // PNP Acceptable BMI Classification, as of January 2020 (DHRDD). The
  // Severely Underweight / Underweight / Normal / Obese Class 1-2-3 bands
  // are fixed for every age; only the "Acceptable BMI" buffer above
  // Normal (and therefore where Overweight starts) widens with age.
  private getPnpAcceptableUpperBound(age: number | null): number {
    if (age === null) return 24.9; // no age on file — use the strictest (youngest) band
    if (age <= 29) return 24.9;
    if (age <= 34) return 25.0;
    if (age <= 39) return 25.5;
    if (age <= 44) return 26.0;
    if (age <= 50) return 26.5;
    return 27.0; // 51 and above
  }

  private getPnpClassification(bmi: number, age: number | null): string {
    if (bmi < 17) return 'Severely Underweight';
    if (bmi < 18.5) return 'Underweight';
    if (bmi <= 24.9) return 'Normal';

    if (bmi <= this.getPnpAcceptableUpperBound(age)) return 'Acceptable BMI';

    if (bmi <= 29.9) return 'Overweight';
    if (bmi <= 34.9) return 'Obese Class 1';
    if (bmi <= 39.9) return 'Obese Class 2';

    return 'Obese Class 3';
  }

  private calculateBmiFields(
    height: number,
    weight: number,
    age: number | null = null,
  ) {
    const heightMeters = height / 100;

    const bmi = weight / (heightMeters * heightMeters);

    const ibw = 22 * heightMeters * heightMeters;

    const weightToLose = weight > ibw ? weight - ibw : 0;

    const pnpClassification = this.getPnpClassification(bmi, age);

    const whoClassification =
      bmi < 18.5
        ? 'Underweight'
        : bmi < 25
        ? 'Normal'
        : bmi < 30
        ? 'Overweight'
        : 'Obese';

    return {
      bmi: Number(bmi.toFixed(2)),
      ibw: Number(ibw.toFixed(2)),
      weight_to_lose: Number(weightToLose.toFixed(2)),
      pnp_classification: pnpClassification,
      who_classification: whoClassification,
    };
  }

  /*
   * =========================================================
   * ESP32 MEASUREMENT
   * =========================================================
   */

  async createFromEsp32(data: any) {
    /*
     * Find personnel using RFID
     */
    const personnel =
      await this.personnelRepository.findOne({
        where: {
          rfid_uid: data.rfid_uid,
        },
      });

    if (!personnel) {
      throw new NotFoundException(
        `RFID ${data.rfid_uid} not found`,
      );
    }

    const calc = this.calculateBmiFields(
      Number(data.height),
      Number(data.weight),
      personnel.age,
    );

    /*
     * Create assessment
     */
    const assessment =
      this.bmiAssessmentRepository.create({
        personnel_id:
          personnel.personnel_id,

        height:
          Number(data.height),

        weight:
          Number(data.weight),

        waist:
          data.waist != null
            ? Number(data.waist)
            : null,

        hip:
          data.hip != null
            ? Number(data.hip)
            : null,

        wrist:
          data.wrist != null
            ? Number(data.wrist)
            : null,

        ...calc,

        assessment_date:
          new Date()
            .toISOString()
            .split('T')[0],

        unit_representative: null,

        health_service_representative:
          null,

        encoder: null,
      });

    /*
     * Save to database
     */
    const savedAssessment =
      await this.bmiAssessmentRepository.save(
        assessment,
      );

    return savedAssessment;
  }

  /*
   * =========================================================
   * PERSONNEL SELF-ENCODED MEASUREMENT
   * =========================================================
   */

  async createSelfAssessment(personnelId: number, data: any) {
    const personnel = await this.personnelRepository.findOne({
      where: { personnel_id: personnelId },
    });

    const calc = this.calculateBmiFields(
      Number(data.height),
      Number(data.weight),
      personnel?.age ?? null,
    );

    const assessment = this.bmiAssessmentRepository.create({
      personnel_id: personnelId,

      height: Number(data.height),

      weight: Number(data.weight),

      waist: data.waist != null ? Number(data.waist) : null,

      hip: data.hip != null ? Number(data.hip) : null,

      wrist: data.wrist != null ? Number(data.wrist) : null,

      ...calc,

      assessment_date: new Date().toISOString().split('T')[0],

      unit_representative: null,

      health_service_representative: null,

      encoder: 'Self-Encoded',
    });

    return await this.bmiAssessmentRepository.save(assessment);
  }

  /*
   * =========================================================
   * LIVE WEIGHT / HEIGHT READING (ESP32 SERIAL INPUT)
   * =========================================================
   */

  reportReading(data: { height?: number; weight?: number }) {
    this.latestReading = {
      height:
        data.height != null
          ? Number(data.height)
          : this.latestReading.height,

      weight:
        data.weight != null
          ? Number(data.weight)
          : this.latestReading.weight,

      received_at: new Date().toISOString(),
    };

    return this.latestReading;
  }

  getLatestReading() {
    return this.latestReading;
  }

  /*
   * =========================================================
   * MEASUREMENT SESSION (ADMIN-CONTROLLED)
   *
   * The microcontroller only prompts for/sends height and
   * weight while a session is active, so it won't push data
   * until the admin presses "Start Measurement" on the website.
   * =========================================================
   */

  startSession() {
    this.sessionActive = true;

    this.latestReading = {
      height: null,
      weight: null,
      received_at: null,
    };

    return { active: true };
  }

  endSession() {
    this.sessionActive = false;

    return { active: false };
  }

  getSessionStatus() {
    return { active: this.sessionActive };
  }

  /*
   * =========================================================
   * FIND ALL ASSESSMENTS + PERSONNEL INFORMATION
   * =========================================================
   */

  async findAll() {
    return this.bmiAssessmentRepository
      .createQueryBuilder('assessment')
      .leftJoin(
        'personnel',
        'personnel',
        'personnel.personnel_id = assessment.personnel_id',
      )
      .select([
        'assessment.assessment_id',
        'assessment.personnel_id',
        'assessment.height',
        'assessment.weight',
        'assessment.waist',
        'assessment.hip',
        'assessment.wrist',
        'assessment.bmi',
        'assessment.ibw',
        'assessment.weight_to_lose',
        'assessment.pnp_classification',
        'assessment.who_classification',
        'assessment.assessment_date',
        'assessment.unit_representative',
        'assessment.health_service_representative',
        'assessment.encoder',
        'assessment.created_at',

        'personnel.rfid_uid',
        'personnel.rank',
        'personnel.surname',
        'personnel.first_name',
        'personnel.middle_initial',
        'personnel.q',
        'personnel.age',
        'personnel.sex',
        'personnel.office',
      ])
      .getRawMany();
  }

  /*
   * =========================================================
   * FIND ASSESSMENTS BY PERSONNEL
   * =========================================================
   */

  async findByPersonnel(
    personnelId: number,
  ) {
    return await this.bmiAssessmentRepository.find({
      where: {
        personnel_id: personnelId,
      },
      order: {
        assessment_id: 'DESC',
      },
    });
  }
}