import { computeTotals } from '../utils/tax-engine';
import { getImportTaxRate, getUsdToMexRate, getProfitRate } from '../config/db-config';

type Input = {
  priceUSD: number;
  fxRate?: number; // optional override for current conversion rate
  requiresImport: boolean;
  chargedMXN: number; // amount charged to user in MXN
};
// Input type retained from above

/**
 * Verify the charged MXN amount against computed totals using config values from DB.
 * Falls back to sensible defaults if DB access fails.
 */
export async function verifyPaymentWithConfig(input: Input): Promise<boolean> {
  let fxRate = input.fxRate;
  let importTaxRate: number | undefined = undefined;
  let profitRate: number | undefined = undefined;
  try {
    if (typeof fxRate !== 'number') fxRate = await getUsdToMexRate();
    if (typeof importTaxRate !== 'number') importTaxRate = await getImportTaxRate();
    if (typeof profitRate !== 'number') profitRate = await getProfitRate();
  } catch {
    // Fallback defaults
    fxRate = fxRate ?? 18.5;
    importTaxRate = importTaxRate ?? 0.191;
    profitRate = profitRate ?? 0.2;
  }

  const totals = computeTotals({
    priceUSD: input.priceUSD,
    fxRate: fxRate,
    requiresImport: input.requiresImport,
    importTaxRate: importTaxRate,
    profitRate: profitRate,
  });

  const diff = Math.abs(totals.totalMXN - input.chargedMXN);
  // Tolerancia razonable para redondeos y pequeños desvíos de red de pagos
  const tolerance = 0.5; // MXN
  return diff <= tolerance;
}
