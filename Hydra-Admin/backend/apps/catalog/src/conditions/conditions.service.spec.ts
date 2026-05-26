import { Test, TestingModule } from '@nestjs/testing';
import { ConditionsService } from './conditions.service';
import { PrismaService } from '@hydra/database';

describe('ConditionsService', () => {
  let service: ConditionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConditionsService, { provide: PrismaService, useValue: {} }],
    }).compile();

    service = module.get<ConditionsService>(ConditionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
