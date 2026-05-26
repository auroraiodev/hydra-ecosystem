import { Module } from '@nestjs/common';
import { CartController } from './cart.controller.js';
import { CartService } from './cart.service.js';
import { PrismaModule } from '../database/prisma.module.js';
import { SearchModule } from '../../apps/catalog/src/search/search.module.js';
import { ImportationModule } from '../../apps/catalog/src/importation/importation.module.js';

@Module({
  imports: [PrismaModule, SearchModule, ImportationModule],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
