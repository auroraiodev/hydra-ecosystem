import { Module, forwardRef } from '@nestjs/common';
import { PaymentsService } from './payments.service.js';
import { PaymentsController } from './payments.controller.js';
import { CartModule } from '../cart/cart.module.js';
import { OrdersModule } from '../orders/orders.module.js';

@Module({
  imports: [CartModule, forwardRef(() => OrdersModule)],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
