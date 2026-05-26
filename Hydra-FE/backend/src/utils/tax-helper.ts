import { computeTotals } from './tax-engine';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

type LocalConfig = {
  importTaxRate: number;
  profitRate: number;
  usdToMexRate: number;
};

function readLocalConfig(): LocalConfig {
  const cfgPath = join(__dirname, '../../config/config.json');
  const defaults: LocalConfig = {
    importTaxRate: 0.191,
    profitRate: 0.2,
    usdToMexRate: 18.5,
  };
  try {
    if (existsSync(cfgPath)) {
      const raw = readFileSync(cfgPath, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        importTaxRate:
          typeof parsed.importTaxRate === 'number' ? parsed.importTaxRate : defaults.importTaxRate,
        profitRate: typeof parsed.profitRate === 'number' ? parsed.profitRate : defaults.profitRate,
        usdToMexRate:
          typeof parsed.usdToMexRate === 'number' ? parsed.usdToMexRate : defaults.usdToMexRate,
      };
    }
  } catch {
    // fallthrough to defaults
  }
  return defaults;
}

export function calculateImportFeeForOrder(order: {
  priceUSD: number;
  fxRate?: number;
  requiresImport: boolean;
}): number {
  const cfg = readLocalConfig();
  const fxRate = order.fxRate ?? cfg.usdToMexRate;
  const totals = computeTotals({
    priceUSD: order.priceUSD,
    fxRate,
    requiresImport: order.requiresImport,
    importTaxRate: cfg.importTaxRate,
    profitRate: cfg.profitRate,
  });
  return totals.importTaxMXN;
}
