// Tax calculation utility for Hydra backend
// - Import tax applies only to products that require import (requiresImport === true)
// - All rates are provided at call time to keep this logic simple and testable

export interface TaxInput {
  // Base price in USD
  priceUSD: number;
  // USD to MXN exchange rate
  fxRate: number;
  // Indicates whether this product requires import (and thus import tax)
  requiresImport: boolean;
  // Import tax rate in decimal (e.g., 0.191 for 19.1%)
  importTaxRate: number;
  // Profit/margin rate in decimal (e.g., 0.20 for 20%)
  profitRate: number;
}

export interface TaxResult {
  // Computed MXN values
  priceMXN: number;
  importTaxMXN: number;
  profitMXN: number;
  totalMXN: number;
}

/**
 * Compute tax and profit totals in MXN for a given USD price.
 * - priceMXN = priceUSD * fxRate
 * - importTaxMXN = priceMXN * importTaxRate (only if requiresImport)
 * - profitMXN = priceMXN * profitRate
 * - totalMXN = priceMXN + importTaxMXN + profitMXN
 */
export function computeTotals(input: TaxInput): TaxResult {
  const priceMXN = input.priceUSD * input.fxRate;

  const importTaxMXN = input.requiresImport ? priceMXN * input.importTaxRate : 0;

  const profitMXN = priceMXN * input.profitRate;
  const totalMXN = priceMXN + importTaxMXN + profitMXN;

  return {
    priceMXN,
    importTaxMXN,
    profitMXN,
    totalMXN,
  };
}
