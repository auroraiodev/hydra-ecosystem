import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller.js';
import { CategoriesService } from './categories.service.js';
import { PrismaModule } from '@hydra/database';
import { AppCacheModule } from '@hydra/common';

@Module({
  imports: [PrismaModule, AppCacheModule],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
