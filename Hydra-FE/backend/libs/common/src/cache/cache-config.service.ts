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
    return this.configService.get<number>('REDIS_DEFAULT_TTL', 3600);
  }
  get redisMaxKeys(): number {
    return this.configService.get<number>('REDIS_MAX_KEYS', 10000);
  }
  get refreshThreshold(): number {
    return this.configService.get<number>('REDIS_REFRESH_THRESHOLD', 300);
  }

  getTtl(dataType: 'static' | 'dynamic' | 'user' | 'session'): number {
    const ttlMap = { static: 86400, dynamic: 1800, user: 3600, session: 86400 };
    return this.configService.get<number>(`REDIS_TTL_${dataType.toUpperCase()}`, ttlMap[dataType]);
  }

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
