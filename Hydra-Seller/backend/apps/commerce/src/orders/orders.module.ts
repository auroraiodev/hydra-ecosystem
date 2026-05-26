import { Module, forwardRef } from '@nestjs/common';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';
import { CartModule } from '../cart/cart.module.js';
import { PaymentsModule } from '../payments/payments.module.js';
import { CatalogModule } from '../catalog/catalog.module.js';

@Module({
  imports: [CartModule, forwardRef(() => PaymentsModule), CatalogModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
