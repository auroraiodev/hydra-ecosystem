import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CatalogSearchClient {
  private readonly logger = new Logger(CatalogSearchClient.name);
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = this.config.get<string>('CATALOG_SERVICE_URL', 'http://hydra-catalog:3010');
  }

  async searchHybrid(
    query: string,
    page = 1,
    limit = 12,
  ): Promise<{ success: boolean; data: any[]; pagination: any }> {
    try {
      const url = `${this.baseUrl}/api/v1/search/hybrid?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) {
        this.logger.warn(`Catalog search returned ${res.status} for query: ${query}`);
        return { success: false, data: [], pagination: {} };
      }
      // ResponseInterceptor wraps as { data: { success, data, pagination } }
      const body: any = await res.json();
      const payload = body?.data ?? body;
      return {
        success: payload?.success ?? true,
        data: payload?.data ?? [],
        pagination: payload?.pagination ?? {},
      };
    } catch (err: any) {
      this.logger.error(`Catalog search failed for query "${query}": ${err.message}`);
      return { success: false, data: [], pagination: {} };
    }
  }
}
