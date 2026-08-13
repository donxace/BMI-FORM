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

    /*
     * Convert height to meters
     */
    const heightMeters =
      Number(data.height) / 100;

    /*
     * Calculate BMI
     */
    const bmi =
      Number(data.weight) /
      (heightMeters * heightMeters);

    /*
     * Calculate IBW
     */
    const ibw =
      22 * heightMeters * heightMeters;

    /*
     * Calculate weight to lose
     */
    const weightToLose =
      Number(data.weight) > ibw
        ? Number(data.weight) - ibw
        : 0;

    /*
     * PNP Classification
     */
    const pnpClassification =
      bmi < 18.5
        ? 'Underweight'
        : bmi < 23
        ? 'Normal'
        : bmi < 25
        ? 'Overweight'
        : bmi < 30
        ? 'Obese Class I'
        : 'Obese Class II';

    /*
     * WHO Classification
     */
    const whoClassification =
      bmi < 18.5
        ? 'Underweight'
        : bmi < 25
        ? 'Normal'
        : bmi < 30
        ? 'Overweight'
        : 'Obese';

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

        bmi:
          Number(bmi.toFixed(2)),

        ibw:
          Number(ibw.toFixed(2)),

        weight_to_lose:
          Number(weightToLose.toFixed(2)),

        pnp_classification:
          pnpClassification,

        who_classification:
          whoClassification,

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