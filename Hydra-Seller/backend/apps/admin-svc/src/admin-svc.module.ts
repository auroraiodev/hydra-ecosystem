import * as path from 'path';
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '@hydra/database';
import {
  AppCacheModule,
  ThrottleModule,
  ResponseInterceptor,
  ErrorInterceptor,
  ApiVersioningMiddleware,
} from '@hydra/common';
import { QueueModule } from '@hydra/queue';
import { AuthGuardModule, JwtAuthGuard } from '@hydra/auth';
import { NotifyClientModule } from './notify-client/notify-client.module.js';
import { AdminModule } from './admin/admin.module.js';
import { BannersModule } from './banners/banners.module.js';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module.js';
import { MaintenanceGuard } from './feature-flags/maintenance.guard.js';
import { OcrModule } from './ocr/ocr.module.js';
import { ModalModule } from './modal/modal.module.js';
import { ImagesModule } from './images/images.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: path.join(process.cwd(), '.env'),
    }),
    ThrottleModule,
    AppCacheModule,
    QueueModule,
    PrismaModule,
    AuthGuardModule,
    JwtModule.register({}),
    NotifyClientModule,
    AdminModule,
    BannersModule,
    FeatureFlagsModule,
    OcrModule,
    ModalModule,
    ImagesModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ErrorInterceptor },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: MaintenanceGuard },
  ],
})
export class AdminSvcModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ApiVersioningMiddleware).forRoutes('*');
  }
}
