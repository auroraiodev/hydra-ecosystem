import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CacheConfigService {
  constructor(private configService: ConfigService) {}

  get redisUrl(): string | undefined {
    return this.configService.get<string>('REDIS_URL');
  }

  get redisHost(): string {
    return this.configService.get<string>('REDIS_HOST', 'localhost');
  }

  get redisPort(): number {
    return this.configService.get<number>('REDIS_PORT', 6379);
  }

  get redisPassword(): string | undefined {
    return this.configService.get<string>('REDIS_PASSWORD');
  }

  get redisDb(): number {
    return this.configService.get<number>('REDIS_DB', 0);
  }

  get redisKeyPrefix(): string {
    return this.configService.get<string>('REDIS_KEY_PREFIX', 'hydra:');
  }

  get defaultTtl(): number {
    return this.configService.get<number>('REDIS_DEFAULT_TTL', 3600); // 1 hour
  }

  get redisMaxKeys(): number {
    return this.configService.get<number>('REDIS_MAX_KEYS', 10000);
  }

  get refreshThreshold(): number {
    return this.configService.get<number>('REDIS_REFRESH_THRESHOLD', 300); // 5 minutes
  }

  get redisClusterEnabled(): boolean {
    return this.configService.get<boolean>('REDIS_CLUSTER_ENABLED', false);
  }

  get redisClusterNodes(): Array<{ host: string; port: number }> {
    const nodes = this.configService.get<string>('REDIS_CLUSTER_NODES');
    if (!nodes) return [];

    return nodes.split(',').map((node) => {
      const [host, port] = node.trim().split(':');
      return { host, port: parseInt(port) };
    });
  }

  // Cache TTL configurations for different data types
  getTtl(dataType: 'static' | 'dynamic' | 'user' | 'session'): number {
    const ttlMap = {
      static: 86400, // 24 hours - categories, conditions, languages
      dynamic: 1800, // 30 minutes - product listings, search results
      user: 3600, // 1 hour - user profiles, preferences
      session: 86400, // 24 hours - active sessions
    };

    return this.configService.get<number>(`REDIS_TTL_${dataType.toUpperCase()}`, ttlMap[dataType]);
  }

  // Cache keys patterns
  generateKey(prefix: string, identifier: string): string {
    return `${prefix}:${identifier}`;
  }

  generateListKey(prefix: string, page: number = 1, limit: number = 10): string {
    return `${prefix}:page:${page}:limit:${limit}`;
  }

  generateSearchKey(query: string, filters: any = {}): string {
    const filterString = JSON.stringify(filters, Object.keys(filters).sort());
    const queryHash = Buffer.from(`${query}:${filterString}`).toString('base64');
    return `search:${queryHash}`;
  }

  generateUserKey(userId: string, type: string): string {
    return `user:${userId}:${type}`;
  }

  generateSessionKey(sessionId: string): string {
    return `session:${sessionId}`;
  }
}
