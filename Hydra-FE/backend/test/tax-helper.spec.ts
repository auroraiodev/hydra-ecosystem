import { calculateImportFeeForOrder } from '../src/utils/tax-helper';

describe('calculateImportFeeForOrder', () => {
  test('computes import fee using local config and order data', () => {
    const order = { priceUSD: 100, fxRate: 20, requiresImport: true };
    const fee = calculateImportFeeForOrder(order);
    expect(fee).toBeCloseTo(382, 5); // 100*20=2000 MXN, 19.1% => 382
  });

  test('returns 0 when does not require import', () => {
    const order = { priceUSD: 50, fxRate: 20, requiresImport: false };
    const fee = calculateImportFeeForOrder(order);
    // Import tax should be zero when not required; with defaults price 1000 MXN, tax 0
    expect(fee).toBeCloseTo(0, 5);
  });
});
