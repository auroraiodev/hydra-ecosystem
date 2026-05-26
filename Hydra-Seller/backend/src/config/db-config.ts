import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get import tax rate (0-1). Defaults to 0.191 if not found.
export async function getImportTaxRate(): Promise<number> {
  try {
    const rec = await prisma.admin_settings.findUnique({ where: { key: 'importTaxRate' } as any });
    if (rec?.value) {
      const v = parseFloat(rec.value);
      return Number.isFinite(v) ? v : 0.191;
    }
  } catch {
    // swallow and return default
  }
  return 0.191;
}

// Get profit rate (0-1). Defaults to 0.20 if not found.
export async function getProfitRate(): Promise<number> {
  try {
    const rec = await prisma.admin_settings.findUnique({ where: { key: 'profitRate' } as any });
    if (rec?.value) {
      const v = parseFloat(rec.value);
      return Number.isFinite(v) ? v : 0.2;
    }
  } catch {
    // ignore
  }
  return 0.2;
}

// Get USD to MXN rate. Default 18.50.
export async function getUsdToMexRate(): Promise<number> {
  try {
    const rec = await prisma.admin_settings.findUnique({ where: { key: 'usdToMexRate' } as any });
    if (rec?.value) {
      const v = parseFloat(rec.value);
      return Number.isFinite(v) ? v : 18.5;
    }
  } catch {
    // ignore
  }
  return 18.5;
}
