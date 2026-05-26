import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '@hydra/database';
import { SearchService } from '../search/search.service';
import { ImportationService } from '../importation/importation.service';
import { CurrencyService } from '../importation/currency.service';
import { CacheService } from '@hydra/common';
import { ConfigService } from '@nestjs/config';

describe('ProductsService', () => {
  let service: ProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: {} },
        { provide: SearchService, useValue: {} },
        { provide: ImportationService, useValue: {} },
        { provide: CurrencyService, useValue: { convertJPYToMXN: jest.fn() } },
        { provide: CacheService, useValue: { get: jest.fn(), set: jest.fn(), del: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
