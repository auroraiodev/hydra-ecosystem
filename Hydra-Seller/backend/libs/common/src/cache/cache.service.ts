import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { CacheConfigService } from './cache-config.service.js';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private cacheConfig: CacheConfigService,
    private configService: ConfigService,
  ) {}

  async get<T>(_key: string): Promise<T | null> {
    return null;
  }
  async set<T>(_key: string, _value: T, _ttl?: number): Promise<void> {}
  async del(_key: string): Promise<void> {}
  async exists(_key: string): Promise<boolean> {
    return false;
  }
  async clear(): Promise<void> {}

  async getOrSet<T>(_key: string, fetcher: () => Promise<T>, _ttl?: number): Promise<T> {
    return fetcher();
  }

  async invalidatePattern(_pattern: string): Promise<void> {}

  async invalidateFrontend(tag: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const secret = this.configService.get<string>('REVALIDATE_SECRET');
    if (!frontendUrl || !secret) return;

    try {
      const url = `${frontendUrl.replace(/\/$/, '')}/api/revalidate?tag=${tag}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const error = await response.text();
        this.logger.error(
          `❌ Failed to invalidate frontend cache for tag ${tag}: ${response.status} ${error}`,
        );
      }
    } catch (error) {
      this.logger.error(`❌ Error invalidating frontend cache for tag ${tag}:`, error.message);
    }
  }

  async invalidateCategoryCache(): Promise<void> {
    await Promise.all([
      this.del(this.cacheConfig.generateKey('categories', 'all')),
      this.del(this.cacheConfig.generateKey('categories:with-products', 'all')),
      this.invalidateFrontend('categories'),
    ]);
  }

  async invalidateProductCache(): Promise<void> {
    await Promise.all([this.invalidateFrontend('products')]);
  }

  async invalidateBannerCache(): Promise<void> {
    await Promise.all([this.invalidateFrontend('banners')]);
  }

  async invalidateTcgCache(): Promise<void> {
    await Promise.all([this.invalidateCategoryCache(), this.invalidateFrontend('tcgs')]);
  }

  async invalidateFeatureFlagCache(): Promise<void> {
    await Promise.all([this.invalidateFrontend('feature-flags')]);
  }

  async invalidateSettingsCache(): Promise<void> {
    await Promise.all([this.invalidateFrontend('settings')]);
  }

  async invalidateUserCache(userId: string): Promise<void> {
    const keys = [
      this.cacheConfig.generateUserKey(userId, 'profile'),
      this.cacheConfig.generateUserKey(userId, 'preferences'),
      this.cacheConfig.generateUserKey(userId, 'permissions'),
    ];
    await Promise.all(keys.map((key) => this.del(key)));
  }

  async invalidateHomePage(): Promise<void> {
    await Promise.all([this.invalidateFrontend('tcg-home')]);
  }
}
