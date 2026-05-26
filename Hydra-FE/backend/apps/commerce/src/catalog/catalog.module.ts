import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CatalogClient } from './catalog.client.js';

@Module({
  imports: [ConfigModule],
  providers: [CatalogClient],
  exports: [CatalogClient],
})
export class CatalogModule {}
