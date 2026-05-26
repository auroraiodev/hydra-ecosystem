import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CatalogClient {
  private readonly logger = new Logger(CatalogClient.name);
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = this.config.get<string>('CATALOG_SERVICE_URL', 'http://hydra-catalog:3010');
  }

  /**
   * Fetch batch prices for importation items (wraps catalog /api/v1/search/importation-pricing).
   */
  async getBatchPrices(items: { importationId: string; name: string }[]): Promise<any[]> {
    try {
      const productIds = items.map((i) => i.importationId);
      const cardNames = items.map((i) => i.name);
      const url = `${this.baseUrl}/api/v1/search/importation-pricing`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds, cardNames }),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        this.logger.warn(`Catalog getBatchPrices returned ${res.status}`);
        return [];
      }
      const body: any = await res.json();
      const payload = body?.data ?? body;
      return payload?.pricing ?? [];
    } catch (err: any) {
      this.logger.error(`Catalog getBatchPrices failed: ${err.message}`);
      return [];
    }
  }

  /**
   * Fetch pricing info for specific importation product IDs.
   */
  async getImportationPricing(input: {
    productIds: string[];
    cardNames?: string[];
  }): Promise<{ success: boolean; pricing: any[] }> {
    try {
      const url = `${this.baseUrl}/api/v1/search/importation-pricing`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        this.logger.warn(`Catalog getImportationPricing returned ${res.status}`);
        return { success: false, pricing: [] };
      }
      const body: any = await res.json();
      const payload = body?.data ?? body;
      return {
        success: true,
        pricing: payload?.pricing ?? [],
      };
    } catch (err: any) {
      this.logger.error(`Catalog getImportationPricing failed: ${err.message}`);
      return { success: false, pricing: [] };
    }
  }
}
