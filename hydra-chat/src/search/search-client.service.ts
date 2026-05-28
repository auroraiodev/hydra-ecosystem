import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SearchClientService {
  private readonly logger = new Logger(SearchClientService.name);
  private readonly mtgsrcUrl: string;
  private readonly tax: string;
  private readonly profit: string;

  constructor(private readonly config: ConfigService) {
    this.mtgsrcUrl = this.config.get<string>('MTGSRC_SERVICE_URL', 'http://localhost:3006');
    this.tax = this.config.get<string>('MTGSRC_TAX', '0.191');
    this.profit = this.config.get<string>('MTGSRC_PROFIT', '0.20');
  }

  async searchHybrid(query: string, _page: number, limit: number): Promise<{ data: any[] }> {
    try {
      const url = `${this.mtgsrcUrl}/search?cardName=${encodeURIComponent(query)}&tax=${this.tax}&profit=${this.profit}&limit=${limit}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) {
        this.logger.warn(`mtgsrc search ${res.status} for "${query}"`);
        return { data: [] };
      }
      const body = await res.json();
      const items: any[] = Array.isArray(body) ? body : (body.data ?? body.results ?? []);
      return { data: items };
    } catch (err) {
      this.logger.error(`Search failed for "${query}": ${err.message}`);
      return { data: [] };
    }
  }
}
