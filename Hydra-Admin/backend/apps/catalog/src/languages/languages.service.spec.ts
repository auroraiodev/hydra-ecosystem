import { Test, TestingModule } from '@nestjs/testing';
import { LanguagesService } from './languages.service';
import { PrismaService } from '@hydra/database';

describe('LanguagesService', () => {
  let service: LanguagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LanguagesService, { provide: PrismaService, useValue: {} }],
    }).compile();

    service = module.get<LanguagesService>(LanguagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
