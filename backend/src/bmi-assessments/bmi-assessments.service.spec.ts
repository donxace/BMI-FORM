import { Test, TestingModule } from '@nestjs/testing';
import { BmiAssessmentsService } from './bmi-assessments.service';

describe('BmiAssessmentsService', () => {
  let service: BmiAssessmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BmiAssessmentsService],
    }).compile();

    service = module.get<BmiAssessmentsService>(BmiAssessmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
