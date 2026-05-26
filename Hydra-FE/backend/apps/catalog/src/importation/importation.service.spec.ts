import { Test, TestingModule } from '@nestjs/testing';
import { ImportationService } from './importation.service';
import { CurrencyService } from './currency.service';
import { PrismaService } from '@hydra/database';

describe('ImportationService', () => {
  let service: ImportationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImportationService,
        { provide: CurrencyService, useValue: { convertJPYToMXN: jest.fn() } },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = module.get<ImportationService>(ImportationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
