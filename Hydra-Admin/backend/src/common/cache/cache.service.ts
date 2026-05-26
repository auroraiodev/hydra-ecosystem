import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { CacheConfigService } from './cache-config.service';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private cacheConfig: CacheConfigService,
    private configService: ConfigService,
  ) {}

  // Basic cache operations
  async get<T>(_key: string): Promise<T | null> {
    // Cache disabled as requested by user
    return null;
  }

  async set<T>(_key: string, _value: T, _ttl?: number): Promise<void> {
    // Cache disabled as requested by user
  }

  async del(_key: string): Promise<void> {
    // Cache disabled as requested by user
  }

  async exists(_key: string): Promise<boolean> {
    return false;
  }

  async clear(): Promise<void> {
    // Cache disabled as requested by user
  }

  // Advanced cache operations
  async getOrSet<T>(key: string, fetcher: () => Promise<T>, _ttl?: number): Promise<T> {
    // Cache disabled as requested by user - always fetch
    return fetcher();
  }

  async invalidatePattern(_pattern: string): Promise<void> {
    // Cache disabled as requested by user
  }

  async invalidateFrontend(tag: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const secret = this.configService.get<string>('REVALIDATE_SECRET');

    if (!frontendUrl || !secret) {
      this.logger.warn(
        '⚠️ Skipping frontend invalidation: FRONTEND_URL or REVALIDATE_SECRET not set',
      );
      return;
    }

    try {
      const url = `${frontendUrl.replace(/\/$/, '')}/api/revalidate?tag=${tag}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secret}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        this.logger.log(`✅ Successfully invalidated frontend cache for tag: ${tag}`);
      } else {
        const error = await response.text();
        this.logger.error(
          `❌ Failed to invalidate frontend cache for tag ${tag}: ${response.status} ${error}`,
        );
      }
    } catch (error) {
      this.logger.error(`❌ Error invalidating frontend cache for tag ${tag}:`, error.message);
    }
  }

  // Specific cache methods for Hydra data
  async getCachedCategories(tcgId?: string): Promise<any[] | null> {
    const key = this.cacheConfig.generateKey('categories', tcgId || 'all');
    return await this.get(key);
  }

  async setCachedCategories(categories: any[], tcgId?: string): Promise<void> {
    const key = this.cacheConfig.generateKey('categories', tcgId || 'all');
    const ttl = this.cacheConfig.getTtl('static');
    await this.set(key, categories, ttl);
  }

  async getCachedCategoriesWithProducts(tcgId?: string): Promise<any[] | null> {
    const key = this.cacheConfig.generateKey('categories:with-products', tcgId || 'all');
    return await this.get(key);
  }

  async setCachedCategoriesWithProducts(categories: any[], tcgId?: string): Promise<void> {
    const key = this.cacheConfig.generateKey('categories:with-products', tcgId || 'all');
    const ttl = this.cacheConfig.getTtl('static');
    await this.set(key, categories, ttl);
  }

  async invalidateCategoryCache(): Promise<void> {
    // Clear both global and parameterized keys
    // Include category caches and potential subcategory caches to cover supracategorias as well
    const patterns = [
      '*categories:*',
      '*categories:with-products:*',
      '*subcategories:*',
      '*subcategories:with-products:*',
    ];

    await Promise.all([
      this.del(this.cacheConfig.generateKey('categories', 'all')),
      this.del(this.cacheConfig.generateKey('categories:with-products', 'all')),
      ...patterns.map((p) => this.invalidatePattern(p)),
      this.invalidateFrontend('categories'),
    ]);
  }

  async getCachedConditions(): Promise<any[] | null> {
    const key = this.cacheConfig.generateKey('conditions', 'all');
    return await this.get(key);
  }

  async setCachedConditions(conditions: any[]): Promise<void> {
    const key = this.cacheConfig.generateKey('conditions', 'all');
    const ttl = this.cacheConfig.getTtl('static');
    await this.set(key, conditions, ttl);
  }

  async getCachedTcgs(): Promise<any[] | null> {
    const key = this.cacheConfig.generateKey('tcgs', 'all');
    return await this.get(key);
  }

  async setCachedTcgs(tcgs: any[]): Promise<void> {
    const key = this.cacheConfig.generateKey('tcgs', 'all');
    const ttl = this.cacheConfig.getTtl('static');
    await this.set(key, tcgs, ttl);
  }

  async invalidateBannerCache(): Promise<void> {
    await Promise.all([this.invalidatePattern('*banners:*'), this.invalidateFrontend('banners')]);
  }

  async invalidateTcgCache(): Promise<void> {
    const key = this.cacheConfig.generateKey('tcgs', 'all');
    await Promise.all([
      this.del(key),
      this.invalidateCategoryCache(),
      this.invalidateFrontend('tcgs'),
    ]);
  }

  async getCachedProducts(
    page: number = 1,
    limit: number = 10,
    filters: any = {},
  ): Promise<any[] | null> {
    const key = this.cacheConfig.generateListKey('products', page, limit);
    const filterKey = JSON.stringify(filters);
    const fullKey = `${key}:filters:${Buffer.from(filterKey).toString('base64')}`;
    return await this.get(fullKey);
  }

  async setCachedProducts(
    products: any[],
    page: number = 1,
    limit: number = 10,
    filters: any = {},
  ): Promise<void> {
    const key = this.cacheConfig.generateListKey('products', page, limit);
    const filterKey = JSON.stringify(filters);
    const fullKey = `${key}:filters:${Buffer.from(filterKey).toString('base64')}`;
    const ttl = this.cacheConfig.getTtl('dynamic');
    await this.set(fullKey, products, ttl);
  }

  async invalidateFeatureFlagCache(): Promise<void> {
    await Promise.all([
      this.invalidatePattern('feature-flags:*'),
      this.invalidateFrontend('feature-flags'),
    ]);
  }

  async invalidateSettingsCache(): Promise<void> {
    await Promise.all([this.invalidatePattern('settings:*'), this.invalidateFrontend('settings')]);
  }

  async getCachedSearchResults(query: string, filters: any = {}): Promise<any[] | null> {
    const key = this.cacheConfig.generateSearchKey(query, filters);
    return await this.get(key);
  }

  async setCachedSearchResults(results: any[], query: string, filters: any = {}): Promise<void> {
    const key = this.cacheConfig.generateSearchKey(query, filters);
    const ttl = this.cacheConfig.getTtl('dynamic');
    await this.set(key, results, ttl);
  }

  async getCachedUser(userId: string): Promise<any | null> {
    const key = this.cacheConfig.generateUserKey(userId, 'profile');
    return await this.get(key);
  }

  async setCachedUser(userId: string, user: any): Promise<void> {
    const key = this.cacheConfig.generateUserKey(userId, 'profile');
    const ttl = this.cacheConfig.getTtl('user');
    await this.set(key, user, ttl);
  }

  async invalidateUserCache(userId: string): Promise<void> {
    const keys = [
      this.cacheConfig.generateUserKey(userId, 'profile'),
      this.cacheConfig.generateUserKey(userId, 'preferences'),
      this.cacheConfig.generateUserKey(userId, 'permissions'),
    ];

    await Promise.all(keys.map((key) => this.del(key)));
  }

  async invalidateProductCache(): Promise<void> {
    const patterns = ['products:*', 'search:*', 'categories:*'];

    await Promise.all([
      ...patterns.map((pattern) => this.invalidatePattern(pattern)),
      this.invalidateFrontend('products'),
    ]);
  }

  async invalidateHomePage(): Promise<void> {
    await Promise.all([
      this.invalidatePattern('home:search:local:*'),
      this.invalidateFrontend('tcg-home'),
    ]);
  }

  // Cache warming strategies
  async warmStaticCache(): Promise<void> {
    this.logger.log('Warming static cache...');
    try {
      this.logger.log('Static cache warmed');
    } catch (error) {
      this.logger.error('Error warming static cache', error);
    }
  }

  // Cache statistics and monitoring
  async getCacheInfo(): Promise<any> {
    try {
      // This would require direct Redis client access for full stats
      return {
        status: 'connected',
        message: 'Cache info available via Redis CLI',
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
      };
    }
  }

  // Cache debugging
  async debugCache(key: string): Promise<any> {
    try {
      const value = await this.get(key);
      const exists = await this.exists(key);

      return {
        key,
        exists,
        value,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        key,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
