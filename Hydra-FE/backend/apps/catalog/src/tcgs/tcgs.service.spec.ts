import { Test, TestingModule } from '@nestjs/testing';
import { TcgsService } from './tcgs.service';
import { PrismaService } from '@hydra/database';
import { CacheService } from '@hydra/common';

describe('TcgsService', () => {
  let service: TcgsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TcgsService,
        { provide: PrismaService, useValue: {} },
        { provide: CacheService, useValue: { get: jest.fn(), set: jest.fn(), del: jest.fn() } },
      ],
    }).compile();

    service = module.get<TcgsService>(TcgsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
