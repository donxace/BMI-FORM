import { Test, TestingModule } from '@nestjs/testing';
import { BmiAssessmentsController } from './bmi-assessments.controller';

describe('BmiAssessmentsController', () => {
  let controller: BmiAssessmentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BmiAssessmentsController],
    }).compile();

    controller = module.get<BmiAssessmentsController>(BmiAssessmentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
