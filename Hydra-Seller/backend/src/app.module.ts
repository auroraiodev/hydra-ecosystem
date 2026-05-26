import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './database/prisma.module.js';
import { ThrottleModule } from './common/modules/throttle.module.js';
import { LoggingModule } from './common/logging/logging.module.js';
import { HealthModule } from './health/health.module.js';
import { AppCacheModule } from './common/cache/cache.module.js';
import { TelemetryModule } from './common/telemetry/telemetry.module.js';
import { QueueModule } from './common/queue/queue.module.js';
import { ResponseInterceptor } from './common/interceptors/response.interceptor.js';
import { ErrorInterceptor } from './common/interceptors/error.interceptor.js';
import { TracingMiddleware } from './common/middleware/tracing.middleware.js';
import { RequestLoggingMiddleware } from './common/middleware/request-logging.middleware.js';
import { SecurityHeadersMiddleware } from './common/middleware/security-headers.middleware.js';
import { ApiVersioningMiddleware } from './common/middleware/api-versioning.middleware.js';
import { GlobalErrorHandlerMiddleware } from './common/middleware/global-error-handler.middleware.js';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard.js';
import { ListingsModule } from './listings/listings.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { WalletModule } from './wallet/wallet.module.js';
import { ReviewsModule } from './reviews/reviews.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { ChatModule } from './chat/chat.module.js';
import { NotifyClientModule } from './notify-client/notify-client.module.js';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module.js';
import { MaintenanceGuard } from './feature-flags/maintenance.guard.js';
import { BannersModule } from './banners/banners.module.js';
import { SellersModule } from './sellers/sellers.module.js';
import { ProductsModule } from '../apps/catalog/src/products/products.module.js';
import { CategoriesModule } from '../apps/catalog/src/categories/categories.module.js';
import { ConditionsModule } from '../apps/catalog/src/conditions/conditions.module.js';
import { LanguagesModule } from '../apps/catalog/src/languages/languages.module.js';
import { TagsModule } from '../apps/catalog/src/tags/tags.module.js';
import { TcgsModule } from '../apps/catalog/src/tcgs/tcgs.module.js';
import { SearchModule } from '../apps/catalog/src/search/search.module.js';
import { GoogleOauthModule } from './auth/google-oauth.module.js';

@Module({
  imports: [
    NotifyClientModule,
    BannersModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    ThrottleModule,
    LoggingModule,
    HealthModule,
    AppCacheModule,
    TelemetryModule,
    QueueModule,
    PrismaModule,
    UsersModule,
    AuthModule,
    ListingsModule,
    OrdersModule,
    WalletModule,
    ReviewsModule,
    NotificationsModule,
    ChatModule,
    FeatureFlagsModule,
    SellersModule,
    ProductsModule,
    CategoriesModule,
    ConditionsModule,
    LanguagesModule,
    TagsModule,
    TcgsModule,
    SearchModule,
    GoogleOauthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ErrorInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: MaintenanceGuard,
    },
  ],
  exports: [PrismaModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        TracingMiddleware,
        RequestLoggingMiddleware,
        SecurityHeadersMiddleware,
        ApiVersioningMiddleware,
        GlobalErrorHandlerMiddleware,
      )
      .forRoutes('*');
  }
}
