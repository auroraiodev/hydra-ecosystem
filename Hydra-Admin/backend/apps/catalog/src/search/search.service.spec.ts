import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { PrismaService } from '@hydra/database';
import { ImportationService } from '../importation/importation.service';
import { ProductsService } from '../products/products.service';
import { CurrencyService } from '../importation/currency.service';
import { CacheService } from '@hydra/common';

describe('SearchService', () => {
  let service: SearchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: PrismaService, useValue: {} },
        { provide: ImportationService, useValue: {} },
        { provide: ProductsService, useValue: {} },
        {
          provide: CurrencyService,
          useValue: {
            convertJPYToMXN: jest.fn(),
            getExchangeRate: jest.fn(),
            getImportationPriceBreakdown: jest.fn(),
            getPricingSettings: jest.fn(),
          },
        },
        { provide: CacheService, useValue: { get: jest.fn(), set: jest.fn(), del: jest.fn() } },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
