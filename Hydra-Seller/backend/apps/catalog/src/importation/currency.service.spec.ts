import { Test, TestingModule } from '@nestjs/testing';
import { CurrencyService } from './currency.service';
import { PrismaService } from '@hydra/database';

/**
 * Tests for CurrencyService — verifies the CORRECTED pricing logic:
 *
 *   baseprice              = jpyAmount * exchangeRate
 *   price_mxn_local        = baseprice + (baseprice * profitRate)
 *   price_mxn_importation  = baseprice + (baseprice * profitRate) + (baseprice * importTaxRate)
 *
 * Used by labels:
 *   Local                  -> price_mxn_local           (no import fee — already in our warehouse)
 *   Importacion            -> price_mxn_importation    (with import fee — needs to be imported)
 *   Importacion Express    -> price_mxn_importation    (same as Importacion, just faster)
 */
describe('CurrencyService (pricing logic)', () => {
  let service: CurrencyService;

  beforeEach(async () => {
    const prismaMock = {
      admin_settings: {
        findMany: jest.fn().mockResolvedValue([
          { key: 'importTaxRate', value: '0.191' },
          { key: 'profitRate', value: '0.20' },
          { key: 'importation_fixed_fee', value: '0' },
        ]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [CurrencyService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = module.get<CurrencyService>(CurrencyService);

    // Force a known exchange rate and pricing settings so tests are deterministic.
    (service as any).exchangeRate = 0.15;
    (service as any).pricingSettings = {
      tax: 0.191, // importation fee
      profit: 0.2, // profit margin
      fixedFee: 0,
    };
    (service as any).lastUpdate = Date.now();
    (service as any).settingsLastUpdate = Date.now();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getImportationPriceBreakdown', () => {
    it('should compute baseprice as JPY * exchangeRate', () => {
      const result = service.getImportationPriceBreakdown(1000);
      // 1000 * 0.15 = 150
      expect(result.baseprice).toBeCloseTo(150.0, 2);
    });

    it('price_mxn_local should be baseprice + (baseprice * profit) — NO import fee', () => {
      const result = service.getImportationPriceBreakdown(1000);
      // 150 + (150 * 0.20) = 150 + 30 = 180
      expect(result.price_mxn_local).toBeCloseTo(180.0, 2);
    });

    it('price_mxn_importation should be baseprice + (baseprice * profit) + (baseprice * import fee)', () => {
      const result = service.getImportationPriceBreakdown(1000);
      // 150 + (150 * 0.20) + (150 * 0.191) = 150 + 30 + 28.65 = 208.65
      expect(result.price_mxn_importation).toBeCloseTo(208.65, 2);
    });

    it('importation price MUST be greater than local price (by exactly the import fee)', () => {
      const result = service.getImportationPriceBreakdown(1000);
      const expectedDifference = 150 * 0.191; // 28.65
      expect(result.price_mxn_importation - result.price_mxn_local).toBeCloseTo(
        expectedDifference,
        2,
      );
    });

    it('should expose profitAmount and importationFeeAmount as separate fields', () => {
      const result = service.getImportationPriceBreakdown(1000);
      expect(result.profitAmount).toBeCloseTo(30.0, 2); // 150 * 0.20
      expect(result.importationFeeAmount).toBeCloseTo(28.65, 2); // 150 * 0.191
    });

    it('should keep legacy aliases for backward compatibility', () => {
      const result = service.getImportationPriceBreakdown(1000);
      // Legacy: baseMXN was used as "local price" (no import tax)
      expect(result.baseMXN).toBeCloseTo(result.price_mxn_local, 2);
      // Legacy: feeMXN was the import fee amount
      expect(result.feeMXN).toBeCloseTo(result.importationFeeAmount, 2);
      // Legacy: finalMXN was the full importation price
      expect(result.finalMXN).toBeCloseTo(result.price_mxn_importation, 2);
    });

    it('should handle 0 JPY input', () => {
      const result = service.getImportationPriceBreakdown(0);
      expect(result.baseprice).toBe(0);
      expect(result.price_mxn_local).toBe(0);
      expect(result.price_mxn_importation).toBe(0);
    });

    it('should round all values to 2 decimal places', () => {
      const result = service.getImportationPriceBreakdown(333);
      // 333 * 0.15 = 49.95 (already 2 decimals)
      // 49.95 + 9.99 = 59.94 (local)
      // 49.95 + 9.99 + 9.54045 = 69.48 (importation, after rounding)
      expect(result.baseprice.toString()).toMatch(/^\d+(\.\d{1,2})?$/);
      expect(result.price_mxn_local.toString()).toMatch(/^\d+(\.\d{1,2})?$/);
      expect(result.price_mxn_importation.toString()).toMatch(/^\d+(\.\d{1,2})?$/);
    });

    it('should apply additive — NOT compound — formula (regression test)', () => {
      // OLD BROKEN formula: finalMXN = priceWithTax * (1 + profit) = base * (1+tax) * (1+profit)
      //   = 150 * 1.191 * 1.20 = 214.38 (WRONG — compounds profit on the taxed amount)
      // NEW CORRECT formula: base + (base*profit) + (base*tax) = 150 + 30 + 28.65 = 208.65
      const result = service.getImportationPriceBreakdown(1000);
      const compoundResult = 150 * 1.191 * 1.2; // 214.38 — the wrong value
      const additiveResult = 150 + 150 * 0.2 + 150 * 0.191; // 208.65 — the correct value

      expect(result.price_mxn_importation).toBeCloseTo(additiveResult, 2);
      expect(result.price_mxn_importation).not.toBeCloseTo(compoundResult, 2);
    });
  });

  describe('convertJPYToMXN', () => {
    it('should return price_mxn_importation by default (skipTax not set)', () => {
      const result = service.convertJPYToMXN(1000);
      expect(result).toBeCloseTo(208.65, 2); // base + profit + import fee
    });

    it('should return price_mxn_local when skipTax: true', () => {
      const result = service.convertJPYToMXN(1000, { skipTax: true });
      expect(result).toBeCloseTo(180.0, 2); // base + profit only
    });

    it('should return price_mxn_importation when skipTax: false explicitly', () => {
      const result = service.convertJPYToMXN(1000, { skipTax: false });
      expect(result).toBeCloseTo(208.65, 2);
    });

    it('importation result > local result (the difference IS the import fee)', () => {
      const importation = service.convertJPYToMXN(1000);
      const local = service.convertJPYToMXN(1000, { skipTax: true });
      expect(importation).toBeGreaterThan(local);
      expect(importation - local).toBeCloseTo(28.65, 2); // 150 * 0.191
    });
  });

  describe('default rate fallback', () => {
    it('should fall back to importTaxRate=0.191 if not provided in settings', () => {
      const newService = new CurrencyService({
        admin_settings: {
          findMany: jest.fn().mockResolvedValue([]),
        },
      } as any);
      // The default in the constructor is 0.191
      const settings = newService.getPricingSettings();
      expect(settings.tax).toBe(0.191);
      expect(settings.profit).toBe(0.2);
      expect(settings.fixedFee).toBe(0);
    });
  });

  describe('with fixedFee > 0', () => {
    beforeEach(() => {
      (service as any).pricingSettings = {
        tax: 0.191,
        profit: 0.2,
        fixedFee: 10, // 10 MXN flat fee
      };
    });

    it('should add fixedFee to both local and importation prices', () => {
      const result = service.getImportationPriceBreakdown(1000);
      expect(result.price_mxn_local).toBeCloseTo(180 + 10, 2); // 190
      expect(result.price_mxn_importation).toBeCloseTo(208.65 + 10, 2); // 218.65
    });
  });
});
