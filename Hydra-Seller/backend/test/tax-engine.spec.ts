import { computeTotals } from '../src/utils/tax-engine';

describe('computeTotals', () => {
  test('applies import tax when requiresImport is true', () => {
    const input = {
      priceUSD: 100,
      fxRate: 20,
      requiresImport: true,
      importTaxRate: 0.191,
      profitRate: 0.2,
    };
    const { priceMXN, importTaxMXN, profitMXN, totalMXN } = computeTotals(input);
    expect(priceMXN).toBeCloseTo(2000, 5);
    expect(importTaxMXN).toBeCloseTo(382, 5);
    expect(profitMXN).toBeCloseTo(400, 5);
    expect(totalMXN).toBeCloseTo(2782, 5);
  });

  test('does not apply import tax when not required', () => {
    const input = {
      priceUSD: 50,
      fxRate: 20,
      requiresImport: false,
      importTaxRate: 0.191,
      profitRate: 0.2,
    };
    const res = computeTotals(input);
    expect(res.importTaxMXN).toBe(0);
    expect(res.priceMXN).toBeCloseTo(1000, 5);
    expect(res.profitMXN).toBeCloseTo(200, 5);
    expect(res.totalMXN).toBeCloseTo(1200, 5);
  });
});
