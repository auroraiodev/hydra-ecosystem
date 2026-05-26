import { Module } from '@nestjs/common';
import { SearchController } from './search.controller.js';
import { SearchService } from './search.service.js';
import { ImportationModule } from '../importation/importation.module.js';
import { PrismaModule } from '@hydra/database';
import { ProductsModule } from '../products/products.module.js';

@Module({
  imports: [ImportationModule, PrismaModule, ProductsModule],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
