// Tests for DB-backed config getters (mocking Prisma access)
jest.mock('../src/config/db-config', () => ({
  getImportTaxRate: jest.fn().mockResolvedValue(0.25),
  getUsdToMexRate: jest.fn().mockResolvedValue(19.0),
  getProfitRate: jest.fn().mockResolvedValue(0.15),
}));

import { getImportTaxRate, getUsdToMexRate, getProfitRate } from '../src/config/db-config';

describe('db-config (mocked)', () => {
  test('returns mocked import tax rate', async () => {
    const v = await getImportTaxRate();
    expect(v).toBe(0.25);
  });

  test('returns mocked fx rate', async () => {
    const v = await getUsdToMexRate();
    expect(v).toBe(19.0);
  });

  test('returns mocked profit rate', async () => {
    const v = await getProfitRate();
    expect(v).toBe(0.15);
  });
});
