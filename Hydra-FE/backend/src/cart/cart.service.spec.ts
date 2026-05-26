import { Test, TestingModule } from '@nestjs/testing';
import { CartService } from './cart.service';
import { PrismaService } from '../database/prisma.service';
import { SearchService } from '../../apps/catalog/src/search/search.service.js';
import { ImportationService } from '../../apps/catalog/src/importation/importation.service.js';
import { CurrencyService } from '../../apps/catalog/src/importation/currency.service.js';

describe('CartService', () => {
  let service: CartService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: PrismaService, useValue: {} },
        { provide: SearchService, useValue: {} },
        { provide: ImportationService, useValue: {} },
        { provide: CurrencyService, useValue: { convertJPYToMXN: jest.fn() } },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
