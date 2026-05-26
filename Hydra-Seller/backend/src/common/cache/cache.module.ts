import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { CacheConfigService } from './cache-config.service';
import { CacheService } from './cache.service';

@Global()
@Module({
  imports: [ConfigModule, CacheModule.register({})],
  providers: [CacheConfigService, CacheService],
  exports: [CacheModule, CacheConfigService, CacheService],
})
export class AppCacheModule {}
