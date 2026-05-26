import * as path from 'path';
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from '@hydra/database';
import {
  AppCacheModule,
  ThrottleModule,
  ResponseInterceptor,
  ErrorInterceptor,
  ApiVersioningMiddleware,
} from '@hydra/common';
import { QueueModule } from '@hydra/queue';
import { AuthGuardModule } from '@hydra/auth';
import { CartModule } from './cart/cart.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { PaymentsModule } from './payments/payments.module.js';
import { CatalogModule } from './catalog/catalog.module.js';
import { NotifyClientModule } from './notify-client/notify-client.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: path.join(process.cwd(), '.env') }),
    ThrottleModule,
    AppCacheModule,
    QueueModule,
    PrismaModule,
    AuthGuardModule,
    NotifyClientModule,
    CatalogModule,
    CartModule,
    OrdersModule,
    PaymentsModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ErrorInterceptor },
  ],
})
export class CommerceModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ApiVersioningMiddleware).forRoutes('*');
  }
}
