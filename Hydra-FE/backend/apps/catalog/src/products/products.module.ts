import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';
import { PrismaModule } from '@hydra/database';
import { ImportationModule } from '../importation/importation.module.js';
import { AppCacheModule } from '@hydra/common';

@Module({
  imports: [PrismaModule, ImportationModule, ConfigModule, AppCacheModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
