import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CatalogSearchClient } from './catalog-search.client.js';

@Module({
  imports: [ConfigModule],
  providers: [CatalogSearchClient],
  exports: [CatalogSearchClient],
})
export class CatalogSearchModule {}
