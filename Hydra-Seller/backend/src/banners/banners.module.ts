import { Module } from '@nestjs/common';
import { BannersService } from './banners.service.js';
import { BannersController } from './banners.controller.js';
import { PrismaModule } from '../database/prisma.module.js';
import { AppCacheModule } from '../common/cache/cache.module.js';

@Module({
  imports: [PrismaModule, AppCacheModule],
  controllers: [BannersController],
  providers: [BannersService],
  exports: [BannersService],
})
export class BannersModule {}
