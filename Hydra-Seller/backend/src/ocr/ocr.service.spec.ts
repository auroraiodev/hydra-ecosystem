import { Test, TestingModule } from '@nestjs/testing';
import { OcrService } from './ocr.service';
import { PrismaService } from '../database/prisma.service';

describe('OcrService', () => {
  let service: OcrService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OcrService, { provide: PrismaService, useValue: {} }],
    }).compile();

    service = module.get<OcrService>(OcrService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
