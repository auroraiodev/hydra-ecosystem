import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@hydra/database';

interface ExchangeRateResponse {
  result: string;
  rates: {
    [key: string]: number;
  };
}

@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);
  private exchangeRate: number = 0.15; // Default fallback (approx 1 JPY = 0.15 MXN)
  private lastUpdate: number = 0;
  private readonly CACHE_TTL = 3600 * 1000; // 1 hour

  // Pricing settings cache
  private pricingSettings = {
    tax: 0.191, // Default 19.1% (importation fee)
    profit: 0.2, // Default 20% (profit margin)
    fixedFee: 0, // Default 0
  };
  private settingsLastUpdate = 0;
  private readonly SETTINGS_TTL = 300 * 1000; // 5 minutes

  constructor(private prisma: PrismaService) {
    this.refreshExchangeRate();
    this.refreshPricingSettings();
  }

  private async refreshExchangeRate(): Promise<void> {
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/JPY');
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }

      const data = (await response.json()) as ExchangeRateResponse;

      if (data && data.result === 'success' && data.rates && data.rates.MXN) {
        let rate = data.rates.MXN;
        // Safety cap: JPY/MXN shouldn't normally exceed 0.25 based on historical data
        if (rate > 0.25) {
          this.logger.warn(
            `[Currency] Received abnormally high exchange rate: ${rate}. Capping at 0.15`,
          );
          rate = 0.15;
        }
        this.exchangeRate = rate;
        this.lastUpdate = Date.now();
        this.logger.log(`Updated exchange rate: 1 JPY = ${this.exchangeRate} MXN`);
      } else {
        this.logger.warn('Invalid exchange rate API response format');
      }
    } catch (error) {
      this.logger.error('Failed to fetch exchange rate', error);
    }
  }

  private async refreshPricingSettings(): Promise<void> {
    try {
      const settings = await this.prisma.admin_settings.findMany({
        where: {
          key: {
            in: ['importTaxRate', 'profitRate', 'importation_fixed_fee'],
          },
        },
      });

      const settingsMap = settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});

      const normalize = (raw: string, fallback: number) => {
        const v = parseFloat(raw.trim());
        if (!isFinite(v)) return fallback;
        // Values > 1 were stored as percentages (e.g. 19.1) instead of decimals (0.191)
        return v > 1 ? v / 100 : v;
      };

      this.pricingSettings = {
        tax: settingsMap['importTaxRate'] ? normalize(settingsMap['importTaxRate'], 0.191) : 0.191,
        profit: settingsMap['profitRate'] ? normalize(settingsMap['profitRate'], 0.2) : 0.2,
        fixedFee: settingsMap['importation_fixed_fee']
          ? parseFloat(settingsMap['importation_fixed_fee'].trim()) || 0
          : 0,
      };

      this.logger.log(
        `[PricingSettings] Parsed settings: Tax=${this.pricingSettings.tax}, Profit=${this.pricingSettings.profit}, Fee=${this.pricingSettings.fixedFee}`,
      );
    } catch (error) {
      this.logger.error('Failed to refresh pricing settings:', error);
    } finally {
      this.logger.log(`[PricingSettings] Current Settings:
       - Tax: ${this.pricingSettings.tax}
       - Profit: ${this.pricingSettings.profit}
       - Fixed Fee: ${this.pricingSettings.fixedFee}
       - Exchange Rate: ${this.exchangeRate}`);
      this.settingsLastUpdate = Date.now();
    }
  }

  /**
   * Convert JPY to MXN with profit margin (and optionally importation fee).
   *
   * Pricing formulas (additive, NOT compound):
   *   baseprice           = jpyAmount * exchangeRate
   *   price_mxn_local     = baseprice + (baseprice * profit) + fixedFee
   *   price_mxn_importation = baseprice + (baseprice * profit) + (baseprice * importationFee) + fixedFee
   *
   * @param jpyAmount Amount in Japanese Yen
   * @param options.skipTax If true, returns local price (no importation fee). Otherwise returns importation price.
   * @returns Amount in Mexican Pesos
   */
  convertJPYToMXN(jpyAmount: number, options?: { skipTax?: boolean }): number {
    const breakdown = this.getImportationPriceBreakdown(jpyAmount);
    return options?.skipTax ? breakdown.price_mxn_local : breakdown.price_mxn_importation;
  }

  /**
   * Returns the full price breakdown for a JPY amount.
   *
   * Returned fields:
   *   - baseprice:               JPY converted to MXN (no profit, no fee)
   *   - price_mxn_local:         For LOCAL items (in our warehouse). baseprice + profit only.
   *   - price_mxn_importation:   For IMPORTATION items (and Importacion Express). baseprice + profit + import fee.
   *   - profitAmount:            Profit component in MXN
   *   - importationFeeAmount:    Importation fee component in MXN (only applied to importation items)
   *
   * Legacy aliases (kept for backward compatibility — DO NOT use in new code):
   *   - baseMXN  -> price_mxn_local
   *   - feeMXN   -> importationFeeAmount
   *   - finalMXN -> price_mxn_importation
   */
  getImportationPriceBreakdown(jpyAmount: number): {
    // New, semantic names
    baseprice: number;
    price_mxn_local: number;
    price_mxn_importation: number;
    profitAmount: number;
    importationFeeAmount: number;
    // Legacy aliases (deprecated)
    baseMXN: number;
    feeMXN: number;
    finalMXN: number;
  } {
    if (Date.now() - this.lastUpdate > this.CACHE_TTL) {
      this.refreshExchangeRate();
    }
    if (Date.now() - this.settingsLastUpdate > this.SETTINGS_TTL) {
      this.refreshPricingSettings();
    }

    const baseprice = jpyAmount * this.exchangeRate;
    const profitRate = this.pricingSettings.profit || 0.2;
    const importationFeeRate = this.pricingSettings.tax || 0.191;
    const fixedFee = this.pricingSettings.fixedFee || 0;

    // Additive (NOT compound) calculation matching tax-engine.ts:
    //   priceMXN + (priceMXN * profitRate) + (priceMXN * importTaxRate if importing)
    const profitAmount = baseprice * profitRate;
    const importationFeeAmount = baseprice * importationFeeRate;

    // LOCAL: base + profit only (no import fee — already in our warehouse)
    const price_mxn_local = baseprice + profitAmount + fixedFee;

    // IMPORTATION: base + profit + import fee (needs to be imported)
    const price_mxn_importation = baseprice + profitAmount + importationFeeAmount + fixedFee;

    this.logger.log(
      `[CALC] JPY:${jpyAmount} * Rate:${this.exchangeRate} = base:${baseprice.toFixed(2)}`,
    );
    this.logger.log(
      `[CALC] Profit:${profitRate} (${profitAmount.toFixed(2)}) | ImportFee:${importationFeeRate} (${importationFeeAmount.toFixed(2)})`,
    );
    this.logger.log(
      `[CALC] price_mxn_local:${price_mxn_local.toFixed(2)} | price_mxn_importation:${price_mxn_importation.toFixed(2)}`,
    );

    const round = (n: number) => Math.round(n * 100) / 100;

    const baseRounded = round(baseprice);
    const localRounded = round(price_mxn_local);
    const importationRounded = round(price_mxn_importation);
    const profitRounded = round(profitAmount);
    const importationFeeRounded = round(importationFeeAmount);

    return {
      // Semantic names (preferred)
      baseprice: baseRounded,
      price_mxn_local: localRounded,
      price_mxn_importation: importationRounded,
      profitAmount: profitRounded,
      importationFeeAmount: importationFeeRounded,
      // Legacy aliases (deprecated — map old names to correct semantics)
      baseMXN: localRounded, // OLD: "price with no import tax (Entrega Inmediata)"  -> price_mxn_local
      feeMXN: importationFeeRounded, // OLD: "tax amount"                              -> importationFeeAmount
      finalMXN: importationRounded, // OLD: "final price with everything"             -> price_mxn_importation
    };
  }

  getExchangeRate(): number {
    return this.exchangeRate;
  }

  getPricingSettings() {
    return this.pricingSettings;
  }
}
