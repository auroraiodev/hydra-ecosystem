import { Module, forwardRef } from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import { OrdersController } from './orders.controller.js';
import { AdminOrdersController } from './admin-orders.controller.js';
import { OrderCleanupService } from './order-cleanup.service.js';
import { CartModule } from '../cart/cart.module.js';
import { PaymentsModule } from '../payments/payments.module.js';
import { ImportationModule } from '../../apps/catalog/src/importation/importation.module.js';
import { EmailModule } from '../email/email.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [
    CartModule,
    forwardRef(() => PaymentsModule),
    ImportationModule,
    EmailModule,
    NotificationsModule,
  ],
  controllers: [OrdersController, AdminOrdersController],
  providers: [OrdersService, OrderCleanupService],
  exports: [OrdersService],
})
export class OrdersModule {}
